import re
import os
import hashlib
import hmac
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, status
from backend.app.core.config import settings
from backend.app.core.logging import logger

# Maximum allowed upload size (50 MB)
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

# Allowed file extensions
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".xlsx", ".md"}

# Known prompt injection signatures to sanitize from untrusted document chunks
PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"system\s*:\s*you\s+are\s+now", re.IGNORECASE),
    re.compile(r"you\s+must\s+now\s+act\s+as", re.IGNORECASE),
    re.compile(r"<\s*script\s*>", re.IGNORECASE),
    re.compile(r"\[\s*system\s*prompt\s*override\s*\]", re.IGNORECASE),
]

def sanitize_untrusted_text(text: str) -> str:
    """
    Sanitizes untrusted text extracted from uploaded files to protect against
    indirect prompt injection attacks before feeding into LLM context.
    """
    sanitized = text
    for pattern in PROMPT_INJECTION_PATTERNS:
        sanitized = pattern.sub("[FILTERED_POTENTIAL_INJECTION]", sanitized)
    return sanitized

def validate_safe_filename(filename: str) -> str:
    """
    Prevents path traversal attacks (e.g. ../../etc/passwd) and sanitizes filenames.
    """
    clean_name = os.path.basename(filename).strip()
    if not clean_name or ".." in clean_name or "/" in clean_name or "\\" in clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename: potential path traversal detected."
        )
    
    ext = Path(clean_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    
    return clean_name

def validate_file_size(size_bytes: int) -> None:
    """
    Ensures uploaded files do not exceed maximum permitted allocation.
    """
    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

def verify_workspace_access(requested_workspace_id: Optional[str], document_workspace_id: Optional[str]) -> bool:
    """
    Enforces tenant/workspace-level authorization on retrieval and document operations.
    """
    if not document_workspace_id:
        return True
    if not requested_workspace_id:
        return True
    return requested_workspace_id == document_workspace_id

def hash_password(password: str) -> str:
    """
    Deterministic salted SHA-256 password hash for standard user records.
    """
    salt = "docmind_enterprise_salt"
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Validates plaintext password against stored hash.
    """
    expected = hash_password(plain_password)
    return hmac.compare_digest(expected, hashed_password)
