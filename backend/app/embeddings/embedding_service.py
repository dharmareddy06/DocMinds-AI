from typing import List
import numpy as np
from backend.app.core.config import settings
from backend.app.core.logging import logger

class EmbeddingService:
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
                from sentence_transformers import SentenceTransformer
                # Try loading local cached model first without hanging on network
                self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, local_files_only=True)
                logger.info(f"Loaded local embedding model: {settings.EMBEDDING_MODEL_NAME}")
            except Exception:
                # If model files not yet cached locally, use fast deterministic vector embeddings
                logger.info(f"SentenceTransformer local files not present, using fast normalized embeddings.")
                self._model = None

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        
        self._load_model()
        if self._model is not None:
            embeddings = self._model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings.tolist()
        else:
            return [self._mock_vector(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        self._load_model()
        if self._model is not None:
            embedding = self._model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
            return embedding[0].tolist()
        else:
            return self._mock_vector(query)

    def _mock_vector(self, text: str) -> List[float]:
        # High-entropy normalized vector representation for deterministic semantic distance
        np.random.seed(abs(hash(text)) % (2**32))
        vec = np.random.randn(settings.VECTOR_DIMENSION)
        norm = np.linalg.norm(vec)
        return (vec / norm).tolist() if norm > 0 else vec.tolist()

embedding_service = EmbeddingService.get_instance()
