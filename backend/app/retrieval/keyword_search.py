import math
import re
from typing import List, Dict, Any, Optional
from collections import Counter
from sqlalchemy.orm import Session
from backend.app.database.models import DocumentChunk, Document

class KeywordSearch:
    @staticmethod
    def search(
        db: Session,
        query: str,
        workspace_id: Optional[str] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        BM25-style keyword search over document chunks.
        """
        # Query tokens
        query_terms = re.findall(r"\b\w+\b", query.lower())
        if not query_terms:
            return []

        chunks_query = db.query(DocumentChunk, Document.filename).join(Document, DocumentChunk.document_id == Document.id)
        if workspace_id:
            chunks_query = chunks_query.filter(Document.workspace_id == workspace_id)

        all_records = chunks_query.all()
        if not all_records:
            return []

        # Corpus statistics for BM25
        doc_count = len(all_records)
        tokenized_corpus = []
        doc_lengths = []
        
        for chunk, filename in all_records:
            tokens = re.findall(r"\b\w+\b", chunk.content.lower())
            tokenized_corpus.append(tokens)
            doc_lengths.append(len(tokens))

        avg_doc_len = sum(doc_lengths) / max(doc_count, 1)

        # Document frequencies for query terms
        df = Counter()
        for tokens in tokenized_corpus:
            unique_tokens = set(tokens)
            for qt in query_terms:
                if qt in unique_tokens:
                    df[qt] += 1

        # BM25 parameters
        k1 = 1.5
        b = 0.75

        scored_chunks = []
        for i, (chunk, filename) in enumerate(all_records):
            tokens = tokenized_corpus[i]
            d_len = doc_lengths[i]
            tf = Counter(tokens)
            score = 0.0

            for qt in query_terms:
                if qt in tf:
                    # IDF calculation
                    n_q = df[qt]
                    idf = math.log((doc_count - n_q + 0.5) / (n_q + 0.5) + 1.0)
                    # TF term
                    tf_term = (tf[qt] * (k1 + 1)) / (tf[qt] + k1 * (1 - b + b * (d_len / avg_doc_len)))
                    score += idf * tf_term

            if score > 0:
                scored_chunks.append({
                    "chunk_id": chunk.id,
                    "document_id": chunk.document_id,
                    "content": chunk.content,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "metadata": chunk.metadata_ or {},
                    "document_name": filename,
                    "score": float(score),
                    "retrieval_method": "keyword"
                })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
