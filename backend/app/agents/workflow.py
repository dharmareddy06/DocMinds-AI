import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END
from backend.app.agents.state import AgentState
from backend.app.agents.supervisor import SupervisorAgent
from backend.app.agents.researcher import ResearcherAgent
from backend.app.agents.comparator import ComparatorAgent
from backend.app.agents.summarizer import SummarizerAgent
from backend.app.agents.verifier import VerifierAgent
from backend.app.retrieval.hybrid_search import hybrid_retrieval_service
from backend.app.llm.provider import llm_provider
from backend.app.llm.prompts import PromptTemplates
from backend.app.core.logging import logger

class DocMindAgentWorkflow:
    def __init__(self, db: Session):
        self.db = db
        self.workflow = self._build_graph()

    def _build_graph(self):
        graph = StateGraph(AgentState)

        # Register Agent Nodes
        graph.add_node("supervisor", self.supervisor_node)
        graph.add_node("retriever", self.retriever_node)
        graph.add_node("researcher", self.researcher_node)
        graph.add_node("comparator", self.comparator_node)
        graph.add_node("summarizer", self.summarizer_node)
        graph.add_node("qa_generator", self.qa_generator_node)
        graph.add_node("verifier", self.verifier_node)

        # Flow definition:
        # Supervisor -> Retriever -> (Intent Router: researcher | comparator | summarizer | qa_generator) -> Verifier -> END
        graph.set_entry_point("supervisor")
        graph.add_edge("supervisor", "retriever")

        graph.add_conditional_edges(
            "retriever",
            self.route_generator,
            {
                "research": "researcher",
                "comparison": "comparator",
                "summarization": "summarizer",
                "question_answering": "qa_generator"
            }
        )

        graph.add_edge("researcher", "verifier")
        graph.add_edge("comparator", "verifier")
        graph.add_edge("summarizer", "verifier")
        graph.add_edge("qa_generator", "verifier")
        graph.add_edge("verifier", END)

        return graph.compile()

    def route_generator(self, state: AgentState) -> str:
        intent = state.get("intent", "question_answering")
        if intent in ["research", "comparison", "summarization", "question_answering"]:
            return intent
        return "question_answering"

    async def supervisor_node(self, state: AgentState) -> Dict[str, Any]:
        return await SupervisorAgent.run(state)

    async def retriever_node(self, state: AgentState) -> Dict[str, Any]:
        start_time = time.time()
        query = state["query"]
        workspace_id = state.get("workspace_id")

        chunks = hybrid_retrieval_service.retrieve(
            db=self.db,
            query=query,
            workspace_id=workspace_id,
            mode="hybrid_rerank",
            top_k=5
        )

        trace_entry = {
            "step": "retriever",
            "agent": "RetrieverAgent",
            "chunks_retrieved": len(chunks),
            "latency_ms": int((time.time() - start_time) * 1000)
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {"retrieved_chunks": chunks, "execution_trace": trace}

    async def researcher_node(self, state: AgentState) -> Dict[str, Any]:
        return await ResearcherAgent.run(state)

    async def comparator_node(self, state: AgentState) -> Dict[str, Any]:
        return await ComparatorAgent.run(state)

    async def summarizer_node(self, state: AgentState) -> Dict[str, Any]:
        return await SummarizerAgent.run(state)

    async def qa_generator_node(self, state: AgentState) -> Dict[str, Any]:
        start_time = time.time()
        chunks = state.get("retrieved_chunks", [])

        if not chunks:
            draft = "I could not find any relevant passages in your workspace to answer this question."
            return {"draft_answer": draft}

        context_str = "\n\n".join([
            f"[Passage {i+1} | Source: {c['document_name']}, Page: {c.get('page_number', 1)}]\n{c['content']}"
            for i, c in enumerate(chunks)
        ])

        system_prompt = PromptTemplates.SYSTEM_RAG_CITATION.format(context_passages=context_str)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": state["query"]}
        ]

        draft_answer = await llm_provider.generate_response(messages)

        trace_entry = {
            "step": "qa_generator",
            "agent": "QAGeneratorAgent",
            "latency_ms": int((time.time() - start_time) * 1000)
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {"draft_answer": draft_answer, "execution_trace": trace}

    async def verifier_node(self, state: AgentState) -> Dict[str, Any]:
        return await VerifierAgent.run(state)

    async def run(self, query: str, workspace_id: str = None) -> AgentState:
        initial_state: AgentState = {
            "query": query,
            "workspace_id": workspace_id,
            "intent": "question_answering",
            "retrieved_chunks": [],
            "draft_answer": "",
            "final_answer": "",
            "citations": [],
            "execution_trace": [],
            "is_verified": False
        }
        result = await self.workflow.ainvoke(initial_state)
        return result
