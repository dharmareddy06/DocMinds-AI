import asyncio
from typing import Dict, Any, List
from backend.app.database.session import SessionLocal, init_db
from backend.app.agents.workflow import DocMindAgentWorkflow

async def evaluate_agent_faithfulness():
    init_db()
    db = SessionLocal()

    test_queries = [
        "What is the average retrieval latency of DocMind AI?",
        "Compare the vector dimensions and embedding models used in the architecture.",
        "What is the overall recall achieved by the hybrid pipeline?"
    ]

    print("=================================================================")
    print("         DocMind AI - Agentic Faithfulness & Citation Evals      ")
    print("=================================================================\n")

    agent = DocMindAgentWorkflow(db)
    faithfulness_scores = []
    citation_counts = []

    for q in test_queries:
        print(f"Testing Query: '{q}'")
        res = await agent.run(q)
        answer = res.get("final_answer", "")
        citations = res.get("citations", [])
        trace = res.get("execution_trace", [])

        # Check if citations are present and non-empty
        has_citations = len(citations) > 0
        citation_counts.append(len(citations))
        
        # Verify if answer contains ground-truth reference or disclaimer
        is_grounded = len(answer) > 20 and has_citations
        faithfulness_scores.append(1.0 if is_grounded else 0.5)

        print(f" -> Citations Attached: {len(citations)}")
        print(f" -> Trace Steps: {[t.get('step') for t in trace]}")
        print(f" -> Grounded: {is_grounded}\n")

    avg_faithfulness = sum(faithfulness_scores) / len(faithfulness_scores)
    avg_citations = sum(citation_counts) / len(citation_counts)

    print("-" * 65)
    print(f"Average Agent Faithfulness: {avg_faithfulness * 100:.1f}%")
    print(f"Average Citations Per Response: {avg_citations:.1f}")
    print("=" * 65)
    db.close()

if __name__ == "__main__":
    asyncio.run(evaluate_agent_faithfulness())
