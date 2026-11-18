from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.retrieval.semantic_search import SemanticSearch
from backend.app.retrieval.keyword_search import KeywordSearch
from backend.app.retrieval.fusion import ReciprocalRankFusion
from backend.app.retrieval.reranker import reranker
from backend.app.core.logging import logger

class HybridRetrievalService:
    @staticmethod
    def retrieve(
        db: Session,
        query: str,
        workspace_id: Optional[str] = None,
        mode: str = "hybrid_rerank", # "vector_only", "keyword_only", "hybrid", "hybrid_rerank"
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieves the most relevant passages for a query using the requested mode.
        """
        logger.info(f"Retrieving passages for query='{query}' using mode='{mode}'")

        if mode == "vector_only":
            return SemanticSearch.search(db, query, workspace_id, top_k=top_k)

        elif mode == "keyword_only":
            return KeywordSearch.search(db, query, workspace_id, top_k=top_k)

        elif mode == "hybrid":
            semantic_candidates = SemanticSearch.search(db, query, workspace_id, top_k=top_k * 2)
            keyword_candidates = KeywordSearch.search(db, query, workspace_id, top_k=top_k * 2)
            return ReciprocalRankFusion.fuse(semantic_candidates, keyword_candidates, top_k=top_k)

        else: # "hybrid_rerank" (default production pipeline)
            semantic_candidates = SemanticSearch.search(db, query, workspace_id, top_k=15)
            keyword_candidates = KeywordSearch.search(db, query, workspace_id, top_k=15)
            fused_candidates = ReciprocalRankFusion.fuse(semantic_candidates, keyword_candidates, top_k=15)
            return reranker.rerank(query, fused_candidates, top_k=top_k)

hybrid_retrieval_service = HybridRetrievalService()
