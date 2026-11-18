from typing import List, Dict, Any
from backend.app.core.config import settings
from backend.app.core.logging import logger

class CrossEncoderReranker:
    _instance = None
    _model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self):
        if self._model is None:
            try:
                from sentence_transformers import CrossEncoder
                self._model = CrossEncoder(settings.RERANKER_MODEL_NAME, local_files_only=True)
                logger.info(f"Loaded local CrossEncoder: {settings.RERANKER_MODEL_NAME}")
            except Exception:
                logger.info(f"Local CrossEncoder not cached, using RRF score ranking.")
                self._model = None

    def rerank(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Reranks retrieved candidate chunks against the user query using a cross-encoder.
        """
        if not documents:
            return []

        self._load_model()
        if self._model is not None:
            pairs = [[query, doc["content"]] for doc in documents]
            scores = self._model.predict(pairs)

            reranked = []
            for i, doc in enumerate(documents):
                doc_copy = dict(doc)
                doc_copy["rerank_score"] = float(scores[i])
                reranked.append(doc_copy)

            reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
            return reranked[:top_k]
        else:
            for doc in documents:
                doc["rerank_score"] = doc.get("rrf_score", doc.get("score", 1.0))
            return documents[:top_k]

reranker = CrossEncoderReranker.get_instance()
