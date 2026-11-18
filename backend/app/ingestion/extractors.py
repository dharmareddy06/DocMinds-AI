import os
from typing import List, Dict, Any
from backend.app.core.logging import logger

class DocumentExtractor:
    @staticmethod
    def extract_document(file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """
        Extracts content from a file, returning a list of pages with text and metadata.
        Output format: [{'page_number': int, 'content': str, 'metadata': dict}, ...]
        """
        file_type = file_type.lower()
        if file_type == "pdf":
            return DocumentExtractor._extract_pdf(file_path)
        elif file_type == "docx":
            return DocumentExtractor._extract_docx(file_path)
        elif file_type in ("csv", "xlsx"):
            return DocumentExtractor._extract_tabular(file_path, file_type)
        elif file_type in ("txt", "md"):
            return DocumentExtractor._extract_text(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    @staticmethod
    def _extract_pdf(file_path: str) -> List[Dict[str, Any]]:
        import pymupdf  # PyMuPDF
        pages = []
        doc = pymupdf.open(file_path)
        try:
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                text = page.get_text("text").strip()
                if text:
                    pages.append({
                        "page_number": page_idx + 1,
                        "content": text,
                        "metadata": {
                            "total_pages": len(doc),
                            "page_width": page.rect.width,
                            "page_height": page.rect.height
                        }
                    })
        finally:
            doc.close()
        return pages

    @staticmethod
    def _extract_docx(file_path: str) -> List[Dict[str, Any]]:
        import docx
        doc = docx.Document(file_path)
        paragraphs_text = []

        # Extract paragraphs
        for p in doc.paragraphs:
            if p.text.strip():
                paragraphs_text.append(p.text.strip())

        # Extract tables
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    paragraphs_text.append(" | ".join(row_text))

        full_text = "\n\n".join(paragraphs_text)
        return [{
            "page_number": 1,
            "content": full_text,
            "metadata": {"source": "docx"}
        }]

    @staticmethod
    def _extract_tabular(file_path: str, file_type: str) -> List[Dict[str, Any]]:
        import pandas as pd
        if file_type == "csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        # Convert table to markdown or formatted representation in batches of rows
        pages = []
        batch_size = 50
        total_rows = len(df)
        
        for i in range(0, max(total_rows, 1), batch_size):
            chunk_df = df.iloc[i : i + batch_size]
            table_md = chunk_df.to_markdown(index=False)
            pages.append({
                "page_number": (i // batch_size) + 1,
                "content": f"Table Rows {i+1} to {min(i+batch_size, total_rows)}:\n\n{table_md}",
                "metadata": {
                    "columns": list(df.columns),
                    "total_rows": total_rows
                }
            })
        return pages

    @staticmethod
    def _extract_text(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return [{
            "page_number": 1,
            "content": content,
            "metadata": {"source": "text"}
        }]
