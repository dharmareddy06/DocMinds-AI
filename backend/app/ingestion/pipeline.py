import os
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.logging import logger
from backend.app.database.repositories import DocumentRepository, ChunkRepository
from backend.app.ingestion.extractors import DocumentExtractor
from backend.app.ingestion.chunking import ChunkService
from backend.app.embeddings.embedding_service import embedding_service

class IngestionPipeline:
    @staticmethod
    def process_document(document_id: str, db: Session) -> Dict[str, Any]:
        """
        Executes the end-to-end ingestion pipeline:
        Extraction -> Chunking -> Embedding -> Database Storage -> Status Update.
        """
        doc = DocumentRepository.get_by_id(db, document_id)
        if not doc:
            raise ValueError(f"Document with ID {document_id} not found.")

        try:
            logger.info(f"Starting ingestion for document: {doc.filename} (ID: {doc.id})")
            DocumentRepository.update_status(db, doc.id, status="processing")

            # 1. Extract content and metadata
            if not os.path.exists(doc.file_path):
                raise FileNotFoundError(f"File not found on disk: {doc.file_path}")

            pages = DocumentExtractor.extract_document(doc.file_path, doc.file_type)
            total_pages = len(pages)
            logger.info(f"Extracted {total_pages} page(s) from {doc.filename}")

            if not pages:
                raise ValueError("No text or content could be extracted from the document.")

            # 2. Split content into semantic chunks
            chunks = ChunkService.create_chunks(pages)
            logger.info(f"Created {len(chunks)} chunks for {doc.filename}")

            # 3. Generate embeddings for chunks
            chunk_texts = [c["content"] for c in chunks]
            embeddings = embedding_service.embed_documents(chunk_texts)
            logger.info(f"Generated {len(embeddings)} vector embeddings for {doc.filename}")

            # 4. Save chunks with embeddings to database
            chunks_to_insert = []
            for i, chunk in enumerate(chunks):
                chunks_to_insert.append({
                    "document_id": doc.id,
                    "content": chunk["content"],
                    "embedding": embeddings[i],
                    "page_number": chunk.get("page_number", 1),
                    "chunk_index": chunk["chunk_index"],
                    "token_count": chunk.get("token_count", 0),
                    "metadata_": chunk.get("metadata", {})
                })

            ChunkRepository.create_batch(db, chunks_to_insert)

            # 5. Update document status to completed
            DocumentRepository.update_status(
                db,
                doc_id=doc.id,
                status="completed",
                chunks_count=len(chunks),
                total_pages=total_pages
            )
            logger.info(f"Successfully completed ingestion for {doc.filename}")

            return {
                "document_id": doc.id,
                "status": "completed",
                "chunks_count": len(chunks),
                "total_pages": total_pages
            }

        except Exception as e:
            logger.error(f"Ingestion failed for document {doc.id}: {str(e)}", exc_info=True)
            DocumentRepository.update_status(
                db,
                doc_id=doc.id,
                status="failed",
                error_message=str(e)
            )
            raise e
