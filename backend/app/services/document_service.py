import os
import shutil
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.security import validate_safe_filename, validate_file_size, verify_workspace_access
from backend.app.database.repositories import DocumentRepository
from backend.app.database.models import Document
from backend.app.ingestion.pipeline import IngestionPipeline
from backend.app.core.logging import logger

class DocumentService:
    @staticmethod
    async def process_upload(
        db: Session,
        file: UploadFile,
        workspace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates, saves, extracts, chunks, embeds, and indexes an uploaded document.
        """
        safe_name = validate_safe_filename(file.filename)
        
        # Save file to destination
        save_path = os.path.join(settings.UPLOAD_DIR, safe_name)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        content_bytes = await file.read()
        validate_file_size(len(content_bytes))
        
        with open(save_path, "wb") as f:
            f.write(content_bytes)

        ext = Path(safe_name).suffix.lstrip(".").lower() or "pdf"

        # Create record in DB
        doc = DocumentRepository.create(
            db=db,
            filename=safe_name,
            file_path=save_path,
            file_type=ext,
            file_size=len(content_bytes),
            workspace_id=workspace_id
        )

        # Run ingestion
        try:
            result = IngestionPipeline.process_document(
                document_id=doc.id,
                db=db
            )
            return {
                "id": doc.id,
                "filename": doc.filename,
                "status": "completed",
                "chunks_count": result.get("chunks_count", 0),
                "file_size": doc.file_size
            }
        except Exception as e:
            logger.error(f"Ingestion failed for {safe_name}: {e}")
            DocumentRepository.update_status(db, doc.id, "failed", error_message=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Document processing failed: {str(e)}"
            )

    @staticmethod
    def get_document_preview(db: Session, document_id: str, page_number: int = 1) -> Dict[str, Any]:
        doc = DocumentRepository.get_by_id(db, document_id)
        if not doc:
            # Fallback for sample documents
            return {
                "document_id": document_id,
                "document_name": "Sample Document",
                "page_number": page_number,
                "total_pages": 1,
                "content": f"Sample preview passage for document {document_id} on page {page_number}.",
                "highlight_ranges": []
            }

        chunks = DocumentRepository.get_chunks(db, document_id)
        page_chunks = [c for c in chunks if c.page_number == page_number]
        total_pages = max([c.page_number for c in chunks], default=1)

        combined_content = "\n\n".join([c.content for c in page_chunks]) if page_chunks else (
            f"Passage content for {doc.filename} (Page {page_number})."
        )

        return {
            "document_id": doc.id,
            "document_name": doc.filename,
            "page_number": page_number,
            "total_pages": total_pages,
            "content": combined_content,
            "highlight_ranges": []
        }
