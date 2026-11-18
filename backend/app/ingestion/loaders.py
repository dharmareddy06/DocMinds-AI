import os
from typing import Tuple
from fastapi import UploadFile, HTTPException

ALLOWED_EXTENSIONS = {"pdf", "docx", "csv", "xlsx", "txt", "md"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 # 50 MB

class FileValidator:
    @staticmethod
    def validate_file(file: UploadFile) -> Tuple[str, str]:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename cannot be empty")
        
        ext = file.filename.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        
        return file.filename, ext
