import json
from typing import AsyncGenerator, Dict, Any, Optional, List
from sqlalchemy.orm import Session
from backend.app.database.repositories import ConversationRepository
from backend.app.retrieval.hybrid_search import hybrid_retrieval_service
from backend.app.llm.provider import llm_provider
from backend.app.llm.prompts import PromptTemplates
from backend.app.llm.response import ResponseFormatter
from backend.app.agents.workflow import DocMindAgentWorkflow

class ChatService:
    @staticmethod
    async def handle_chat_message(
        db: Session,
        message: str,
        conversation_id: Optional[str] = None,
        workspace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the agentic RAG workflow and persists conversation history & citations.
        """
        if not conversation_id:
            title = message[:40] + ("..." if len(message) > 40 else "")
            conv = ConversationRepository.create(db, title=title, workspace_id=workspace_id)
            conversation_id = conv.id

        ConversationRepository.add_message(db, conversation_id, role="user", content=message)

        agent = DocMindAgentWorkflow(db)
        result = await agent.run(query=message, workspace_id=workspace_id)

        final_answer = result.get("final_answer", "")
        citations = result.get("citations", [])

        assistant_msg = ConversationRepository.add_message(db, conversation_id, role="assistant", content=final_answer)
        if citations:
            ConversationRepository.add_citations(db, assistant_msg.id, citations)

        return {
            "conversation_id": conversation_id,
            "message_id": assistant_msg.id,
            "answer": final_answer,
            "citations": citations,
            "execution_trace": result.get("execution_trace", [])
        }

    @staticmethod
    async def stream_chat_response(
        db: Session,
        message: str,
        workspace_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens and citations via Server-Sent Events (SSE).
        """
        # 1. Retrieve evidence
        chunks = hybrid_retrieval_service.retrieve(
            db=db,
            query=message,
            workspace_id=workspace_id,
            mode="hybrid_rerank",
            top_k=5
        )

        context_str = "\n\n".join([
            f"[Passage {i+1} | Source: {c['document_name']}, Page: {c.get('page_number', 1)}]\n{c['content']}"
            for i, c in enumerate(chunks)
        ])

        messages = [
            {"role": "system", "content": PromptTemplates.SYSTEM_RAG_CITATION.format(context_passages=context_str)},
            {"role": "user", "content": message}
        ]

        citations = [
            {
                "chunk_id": c.get("chunk_id"),
                "document_id": c["document_id"],
                "document_name": c["document_name"],
                "page_number": c.get("page_number", 1),
                "relevant_passage": c["content"][:250],
                "relevance_score": c.get("rerank_score", 1.0)
            }
            for c in chunks
        ]

        # First send citations event
        yield ResponseFormatter.format_citations_event(citations)

        # Stream tokens
        async for token in llm_provider.stream_response(messages):
            yield ResponseFormatter.format_token_event(token)

        # Send completion event
        yield ResponseFormatter.format_done_event()
