import os
import shutil
import uuid
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from backend.app.api.dependencies import get_database
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.ingestion.loaders import FileValidator
from backend.app.ingestion.pipeline import IngestionPipeline
from backend.app.database.repositories import DocumentRepository, ChunkRepository
from backend.app.schemas.document import (
    DocumentResponse,
    DocumentListResponse,
    DocumentPreviewResponse,
    DocumentPagePreview
)

router = APIRouter(prefix="/documents", tags=["documents"])

def run_ingestion_background(document_id: str):
    from backend.app.database.session import SessionLocal
    db = SessionLocal()
    try:
        IngestionPipeline.process_document(document_id, db)
    finally:
        db.close()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    workspace_id: Optional[str] = None,
    db: Session = Depends(get_database)
):
    """
    Upload and register a document for ingestion.
    """
    filename, ext = FileValidator.validate_file(file)

    # Save to disk
    safe_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # Create document record
    doc = DocumentRepository.create(
        db=db,
        filename=filename,
        file_path=file_path,
        file_type=ext,
        file_size=file_size,
        workspace_id=workspace_id
    )

    # Queue ingestion pipeline as background task
    background_tasks.add_task(run_ingestion_background, doc.id)

    return doc

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    workspace_id: Optional[str] = None,
    db: Session = Depends(get_database)
):
    """
    List all uploaded documents.
    """
    return DocumentRepository.list_all(db, workspace_id=workspace_id)

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_database)
):
    """
    Get detailed document record and ingestion status.
    """
    doc = DocumentRepository.get_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/{document_id}/preview", response_model=DocumentPreviewResponse)
def get_document_preview(
    document_id: str,
    db: Session = Depends(get_database)
):
    """
    Returns page-by-page extracted content and chunks for the document viewer and citation inspector.
    """
    doc = DocumentRepository.get_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = ChunkRepository.get_by_document(db, document_id)

    # Group chunk contents by page_number
    pages_dict: Dict[int, List[str]] = {}
    for c in chunks:
        pg = c.page_number or 1
        if pg not in pages_dict:
            pages_dict[pg] = []
        pages_dict[pg].append(c.content)

    pages = []
    if pages_dict:
        for pg_num in sorted(pages_dict.keys()):
            pages.append(DocumentPagePreview(
                page_number=pg_num,
                content="\n\n".join(pages_dict[pg_num]),
                chunks_count=len(pages_dict[pg_num])
            ))
    elif os.path.exists(doc.file_path):
        # Fallback reading directly if not chunked yet
        from backend.app.ingestion.extractors import DocumentExtractor
        extracted = DocumentExtractor.extract_document(doc.file_path, doc.file_type)
        for page in extracted:
            pages.append(DocumentPagePreview(
                page_number=page.get("page_number", 1),
                content=page.get("content", ""),
                chunks_count=1
            ))

    return DocumentPreviewResponse(
        document_id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size_bytes=doc.file_size_bytes,
        total_pages=doc.total_pages or len(pages) or 1,
        chunks_count=len(chunks),
        pages=pages
    )

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_database)
):
    """
    Delete a document and its stored chunks.
    """
    doc = DocumentRepository.get_by_id(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    DocumentRepository.delete(db, document_id)
    return {"message": "Document deleted successfully", "document_id": document_id}
