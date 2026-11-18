import json
import asyncio
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.api.dependencies import get_database
from backend.app.database.repositories import ConversationRepository
from backend.app.database.models import Conversation
from backend.app.agents.workflow import DocMindAgentWorkflow
from backend.app.retrieval.hybrid_search import hybrid_retrieval_service
from backend.app.llm.provider import llm_provider
from backend.app.llm.prompts import PromptTemplates
from backend.app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    CitationResponse
)

router = APIRouter(prefix="", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
async def submit_question(
    request: ChatRequest,
    db: Session = Depends(get_database)
):
    """
    Submits a user question to the DocMind LangGraph Agent workflow.
    Returns grounded answer with verifiable citations.
    """
    # 1. Get or create conversation
    conv_id = request.conversation_id
    if not conv_id:
        title = request.message[:40] + ("..." if len(request.message) > 40 else "")
        conv = ConversationRepository.create(db, title=title, workspace_id=request.workspace_id)
        conv_id = conv.id

    # 2. Save user message
    ConversationRepository.add_message(db, conv_id, role="user", content=request.message)

    # 3. Run Agent Workflow
    agent = DocMindAgentWorkflow(db)
    result = await agent.run(query=request.message, workspace_id=request.workspace_id)

    final_answer = result.get("final_answer", "")
    citations = result.get("citations", [])

    # 4. Save assistant message & citations
    assistant_msg = ConversationRepository.add_message(db, conv_id, role="assistant", content=final_answer)
    if citations:
        ConversationRepository.add_citations(db, assistant_msg.id, citations)

    return ChatResponse(
        conversation_id=conv_id,
        message_id=assistant_msg.id,
        answer=final_answer,
        citations=[CitationResponse(**c) for c in citations],
        execution_trace=result.get("execution_trace", [])
    )

@router.post("/chat/stream")
async def stream_question(
    request: ChatRequest,
    db: Session = Depends(get_database)
):
    """
    Streams response tokens and citations via Server-Sent Events (SSE).
    """
    # 1. Retrieve evidence
    chunks = hybrid_retrieval_service.retrieve(
        db=db,
        query=request.message,
        workspace_id=request.workspace_id,
        mode="hybrid_rerank",
        top_k=5
    )

    context_str = "\n\n".join([
        f"[Passage {i+1} | Source: {c['document_name']}, Page: {c.get('page_number', 1)}]\n{c['content']}"
        for i, c in enumerate(chunks)
    ])

    messages = [
        {"role": "system", "content": PromptTemplates.SYSTEM_RAG_CITATION.format(context_passages=context_str)},
        {"role": "user", "content": request.message}
    ]

    citations = [
        {
            "document_id": c["document_id"],
            "document_name": c["document_name"],
            "page_number": c.get("page_number", 1),
            "relevant_passage": c["content"][:250],
            "relevance_score": c.get("rerank_score", 1.0)
        }
        for c in chunks
    ]

    async def sse_event_generator():
        # First send citations event
        yield f"event: citations\ndata: {json.dumps(citations)}\n\n"

        # Then stream tokens
        async for token in llm_provider.stream_response(messages):
            yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"

        # Send completion event
        yield f"event: done\ndata: {json.dumps({'status': 'completed'})}\n\n"

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream")

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    workspace_id: Optional[str] = None,
    db: Session = Depends(get_database)
):
    """
    List all conversation sessions.
    """
    return ConversationRepository.list_all(db, workspace_id=workspace_id)
