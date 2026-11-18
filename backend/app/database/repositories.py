from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.models import (
    Workspace,
    Document,
    DocumentChunk,
    Conversation,
    Message,
    Citation,
    AgentRun
)

class DocumentRepository:
    @staticmethod
    def create(db: Session, filename: str, file_path: str, file_type: str, file_size: int, workspace_id: Optional[str] = None) -> Document:
        doc = Document(
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            file_size_bytes=file_size,
            workspace_id=workspace_id,
            status="pending"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    @staticmethod
    def get_by_id(db: Session, doc_id: str) -> Optional[Document]:
        return db.query(Document).filter(Document.id == doc_id).first()

    @staticmethod
    def list_all(db: Session, workspace_id: Optional[str] = None) -> List[Document]:
        query = db.query(Document)
        if workspace_id:
            query = query.filter(Document.workspace_id == workspace_id)
        return query.order_by(desc(Document.created_at)).all()

    @staticmethod
    def update_status(db: Session, doc_id: str, status: str, chunks_count: int = 0, total_pages: int = 0, error_message: Optional[str] = None) -> Optional[Document]:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = status
            if chunks_count > 0:
                doc.chunks_count = chunks_count
            if total_pages > 0:
                doc.total_pages = total_pages
            if error_message:
                doc.error_message = error_message
            db.commit()
            db.refresh(doc)
        return doc

    @staticmethod
    def delete(db: Session, doc_id: str) -> bool:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            db.delete(doc)
            db.commit()
            return True
        return False

class ChunkRepository:
    @staticmethod
    def create_batch(db: Session, chunks_data: List[Dict[str, Any]]) -> List[DocumentChunk]:
        chunks = [DocumentChunk(**chunk) for chunk in chunks_data]
        db.bulk_save_objects(chunks)
        db.commit()
        return chunks

    @staticmethod
    def get_by_document(db: Session, doc_id: str) -> List[DocumentChunk]:
        return db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.chunk_index).all()

    @staticmethod
    def list_all_chunks(db: Session) -> List[DocumentChunk]:
        return db.query(DocumentChunk).all()

class ConversationRepository:
    @staticmethod
    def create(db: Session, title: str = "New Conversation", workspace_id: Optional[str] = None) -> Conversation:
        conv = Conversation(title=title, workspace_id=workspace_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def get_by_id(db: Session, conv_id: str) -> Optional[Conversation]:
        return db.query(Conversation).filter(Conversation.id == conv_id).first()

    @staticmethod
    def list_all(db: Session, workspace_id: Optional[str] = None) -> List[Conversation]:
        query = db.query(Conversation)
        if workspace_id:
            query = query.filter(Conversation.workspace_id == workspace_id)
        return query.order_by(desc(Conversation.updated_at)).all()

    @staticmethod
    def add_message(db: Session, conversation_id: str, role: str, content: str) -> Message:
        msg = Message(conversation_id=conversation_id, role=role, content=content)
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def add_citations(db: Session, message_id: str, citations_data: List[Dict[str, Any]]) -> List[Citation]:
        citations = [Citation(message_id=message_id, **c) for c in citations_data]
        db.bulk_save_objects(citations)
        db.commit()
        return citations
