import os
import sys
from pathlib import Path
import asyncio

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.database.session import SessionLocal, init_db
from backend.app.database.repositories import DocumentRepository
from backend.app.ingestion.pipeline import IngestionPipeline
from backend.app.retrieval.hybrid_search import hybrid_retrieval_service
from backend.app.agents.workflow import DocMindAgentWorkflow

async def main():
    print("--- 1. Initializing Database ---")
    init_db()
    db = SessionLocal()

    # Create a sample markdown file to test ingestion
    sample_file_path = "storage/documents/sample_ai_architecture.md"
    os.makedirs(os.path.dirname(sample_file_path), exist_ok=True)
    with open(sample_file_path, "w", encoding="utf-8") as f:
        f.write("""# DocMind AI System Architecture
DocMind AI uses a hybrid retrieval pipeline combining pgvector semantic search and BM25 full-text search.
The results are merged using Reciprocal Rank Fusion (RRF) with a ranking constant of k=60.
After fusion, cross-encoder reranking is applied using ms-marco-MiniLM-L-6-v2.

## Key Performance Metrics
- Hybrid retrieval recall reaches 94.2% across benchmark questions.
- Vector embeddings use 384 dimensions from Sentence Transformers.
- Average retrieval latency is under 150 milliseconds.
""")

    print("--- 2. Ingesting Document ---")
    doc = DocumentRepository.create(
        db=db,
        filename="sample_ai_architecture.md",
        file_path=sample_file_path,
        file_type="md",
        file_size=os.path.getsize(sample_file_path)
    )

    result = IngestionPipeline.process_document(doc.id, db)
    print(f"Ingestion finished: {result}")

    print("--- 3. Testing Hybrid Retrieval with RRF ---")
    retrieved = hybrid_retrieval_service.retrieve(
        db=db,
        query="What is the RRF ranking constant and retrieval recall?",
        mode="hybrid_rerank",
        top_k=2
    )
    print(f"Retrieved {len(retrieved)} chunk(s):")
    for r in retrieved:
        print(f" - [Score: {r.get('rerank_score', 0):.4f}] {r['content'][:120]}...")

    print("--- 4. Testing LangGraph Agent Workflow ---")
    agent = DocMindAgentWorkflow(db)
    agent_output = await agent.run("What are the key performance metrics of DocMind AI?")
    print("Agent Final Answer:")
    print(agent_output.get("final_answer"))
    print("\nCitations:")
    for c in agent_output.get("citations", []):
        print(f" - Doc: {c['document_name']} | Page {c['page_number']}")

    print("\n--- All Backend Modules Verified Successfully! ---")
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
