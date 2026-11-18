from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.database.models import DocumentChunk, Document
from backend.app.embeddings.embedding_service import embedding_service

class SemanticSearch:
    @staticmethod
    def search(
        db: Session,
        query: str,
        workspace_id: Optional[str] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top_k chunks using vector cosine similarity.
        Works on both PostgreSQL (with pgvector) and SQLite (in-memory cosine similarity fallback).
        """
        query_embedding = embedding_service.embed_query(query)

        # Check if PostgreSQL with pgvector is active
        if "postgresql" in settings.DATABASE_URL:
            try:
                # pgvector cosine distance operator is <=>
                sql = text("""
                    SELECT 
                        c.id, c.document_id, c.content, c.page_number, c.chunk_index, c.metadata,
                        d.filename,
                        1 - (c.embedding <=> :query_vector) AS similarity_score
                    FROM document_chunks c
                    JOIN documents d ON c.document_id = d.id
                    WHERE (:workspace_id IS NULL OR d.workspace_id = :workspace_id)
                    ORDER BY c.embedding <=> :query_vector
                    LIMIT :top_k
                """)
                results = db.execute(
                    sql,
                    {
                        "query_vector": str(query_embedding),
                        "workspace_id": workspace_id,
                        "top_k": top_k
                    }
                ).fetchall()

                return [
                    {
                        "chunk_id": r[0],
                        "document_id": r[1],
                        "content": r[2],
                        "page_number": r[3],
                        "chunk_index": r[4],
                        "metadata": r[5] or {},
                        "document_name": r[6],
                        "score": float(r[7]),
                        "retrieval_method": "semantic"
                    }
                    for r in results
                ]
            except Exception as e:
                logger.warning(f"pgvector query failed, falling back to python cosine similarity: {e}")

        # Python-based cosine similarity (SQLite / fallback)
        query = db.query(DocumentChunk, Document.filename).join(Document, DocumentChunk.document_id == Document.id)
        if workspace_id:
            query = query.filter(Document.workspace_id == workspace_id)

        all_chunks = query.all()
        if not all_chunks:
            return []

        scored_chunks = []
        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)

        for chunk, filename in all_chunks:
            if chunk.embedding is not None:
                c_vec = np.array(chunk.embedding, dtype=np.float32)
                c_norm = np.linalg.norm(c_vec)
                if q_norm > 0 and c_norm > 0:
                    sim = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
                else:
                    sim = 0.0
            else:
                sim = 0.0

            scored_chunks.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "content": chunk.content,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "metadata": chunk.metadata_ or {},
                "document_name": filename,
                "score": sim,
                "retrieval_method": "semantic"
            })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
