from typing import List, Dict, Any
from backend.app.core.config import settings

class ReciprocalRankFusion:
    @staticmethod
    def fuse(
        semantic_results: List[Dict[str, Any]],
        keyword_results: List[Dict[str, Any]],
        k: int = settings.RRF_K,
        top_k: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Merges semantic and keyword ranked results using Reciprocal Rank Fusion (RRF).
        Formula: RRF(d) = sum(1 / (k + rank_i(d)))
        """
        rrf_scores: Dict[str, float] = {}
        chunks_map: Dict[str, Dict[str, Any]] = {}

        # 1. Score semantic results
        for rank, item in enumerate(semantic_results, start=1):
            chunk_id = item["chunk_id"]
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (k + rank))
            if chunk_id not in chunks_map:
                chunks_map[chunk_id] = {**item, "semantic_rank": rank}
            else:
                chunks_map[chunk_id]["semantic_rank"] = rank

        # 2. Score keyword results
        for rank, item in enumerate(keyword_results, start=1):
            chunk_id = item["chunk_id"]
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (k + rank))
            if chunk_id not in chunks_map:
                chunks_map[chunk_id] = {**item, "keyword_rank": rank}
            else:
                chunks_map[chunk_id]["keyword_rank"] = rank

        # 3. Build fused and sorted result list
        fused_results = []
        for chunk_id, fused_score in sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True):
            chunk_data = chunks_map[chunk_id]
            chunk_data["rrf_score"] = fused_score
            chunk_data["retrieval_method"] = "hybrid_rrf"
            fused_results.append(chunk_data)

        return fused_results[:top_k]
