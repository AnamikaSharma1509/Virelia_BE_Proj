import os
import re
import mimetypes
from typing import Generator, Tuple, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import StreamingResponse
from app.core.config import settings

def get_safe_media_path(relative_path: str) -> str:
    """
    Sanitize and resolve path inside MEDIA_ROOT to prevent directory traversal.
    """
    if not relative_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No media path specified")
    
    # Strip dangerous characters
    clean_rel = re.sub(r'(\.\.[/\\]|[/\\]\.\.)', '', relative_path).lstrip("/\\")
    full_path = os.path.abspath(os.path.join(settings.MEDIA_ROOT, clean_rel))
    media_root_abs = os.path.abspath(settings.MEDIA_ROOT)
    
    if not full_path.startswith(media_root_abs):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Illegal media path")
        
    return full_path

def stream_video_file(file_path: str, request: Request) -> StreamingResponse:
    """
    Stream video file supporting HTTP 206 Partial Content Range requests.
    """
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video asset file is not yet uploaded or configured."
        )

    file_size = os.path.getsize(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "video/mp4"

    range_header = request.headers.get("range")
    if not range_header:
        def file_iterator():
            with open(file_path, "rb") as f:
                while chunk := f.read(1024 * 1024):  # 1MB chunks
                    yield chunk

        return StreamingResponse(
            file_iterator(),
            status_code=status.HTTP_200_OK,
            headers={
                "Content-Length": str(file_size),
                "Content-Type": mime_type,
                "Accept-Ranges": "bytes",
            }
        )

    # Parse byte range header, e.g. "bytes=0-1048576"
    range_match = re.match(r"^bytes=(\d+)-(\d*)$", range_header.strip())
    if not range_match:
        raise HTTPException(status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE, detail="Invalid range header")

    start_str, end_str = range_match.groups()
    start = int(start_str)
    end = int(end_str) if end_str else file_size - 1

    if start >= file_size or end >= file_size or start > end:
        raise HTTPException(
            status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
            detail="Range not satisfiable",
            headers={"Content-Range": f"bytes */{file_size}"}
        )

    chunk_length = (end - start) + 1

    def ranged_iterator():
        with open(file_path, "rb") as f:
            f.seek(start)
            remaining = chunk_length
            while remaining > 0:
                to_read = min(1024 * 512, remaining)
                chunk = f.read(to_read)
                if not chunk:
                    break
                remaining -= len(chunk)
                yield chunk

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(chunk_length),
        "Content-Type": mime_type,
    }

    return StreamingResponse(
        ranged_iterator(),
        status_code=status.HTTP_206_PARTIAL_CONTENT,
        headers=headers
    )
