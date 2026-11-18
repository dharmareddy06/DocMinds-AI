from typing import List, Dict, Any
from backend.app.core.config import settings

class ChunkService:
    @staticmethod
    def create_chunks(
        pages: List[Dict[str, Any]],
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP
    ) -> List[Dict[str, Any]]:
        """
        Splits page content into overlapping chunks while preserving page numbers and metadata.
        """
        chunks = []
        global_chunk_idx = 0

        for page in pages:
            page_num = page.get("page_number", 1)
            content = page.get("content", "").strip()
            page_meta = page.get("metadata", {})

            if not content:
                continue

            # Split content using sliding window with overlap
            start = 0
            content_len = len(content)

            while start < content_len:
                end = min(start + chunk_size, content_len)

                # If not at the end of the text, try to break on a sentence or paragraph boundary
                if end < content_len:
                    last_period = content.rfind(". ", start, end)
                    last_newline = content.rfind("\n", start, end)
                    break_point = max(last_period, last_newline)
                    if break_point > start + (chunk_size // 2):
                        end = break_point + 1

                chunk_text = content[start:end].strip()

                if chunk_text:
                    token_count = max(len(chunk_text.split()), 1)
                    chunks.append({
                        "chunk_index": global_chunk_idx,
                        "content": chunk_text,
                        "page_number": page_num,
                        "token_count": token_count,
                        "metadata": {
                            **page_meta,
                            "char_start": start,
                            "char_end": end,
                        }
                    })
                    global_chunk_idx += 1

                if end >= content_len:
                    break

                start = max(end - chunk_overlap, start + 1)

        return chunks
