"""
Secure File Ingestion and Cryptographic Quarantine Module
Prevents path traversal, archive bombs, and preserves immutable file bytes.
"""

import hashlib
import os
import re
import uuid
import zipfile
from pathlib import Path
from typing import Dict, Any, Tuple
from fastapi import UploadFile, HTTPException
from backend.app.core.config import settings


class SecureIngestionService:
    def __init__(self):
        settings.ensure_directories()
        self.quarantine_dir = settings.QUARANTINE_DIR
        self.max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent directory traversal and special character injection."""
        base_name = os.path.basename(filename)
        # Strip all path separators, null bytes, and shell metacharacters
        clean = re.sub(r'[^a-zA-Z0-9._-]', '_', base_name)
        if not clean or clean.startswith('.'):
            clean = f"sample_{clean}"
        return clean[:255]

    async def ingest_upload(self, file: UploadFile) -> Dict[str, Any]:
        """
        Securely stream upload to disk, compute SHA-256, validate size, and quarantine.
        """
        investigation_id = str(uuid.uuid4())
        safe_original_name = self.sanitize_filename(file.filename or "unknown_sample")
        file_ext = Path(safe_original_name).suffix.lower()

        # Generate unique quarantined storage name
        stored_name = f"{investigation_id}{file_ext}"
        destination_path = self.quarantine_dir / stored_name

        hasher = hashlib.sha256()
        total_bytes = 0

        try:
            with open(destination_path, "wb") as f_out:
                while chunk := await file.read(65536):
                    total_bytes += len(chunk)
                    if total_bytes > self.max_size_bytes:
                        raise HTTPException(
                            status_code=413,
                            detail=f"File exceeds maximum allowed upload size ({settings.MAX_UPLOAD_SIZE_MB}MB)"
                        )
                    hasher.update(chunk)
                    f_out.write(chunk)
        except Exception as e:
            if destination_path.exists():
                destination_path.unlink(missing_ok=True)
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to ingest file: {str(e)}")

        sha256_hash = hasher.hexdigest()

        # Check for archive bomb if ZIP
        if file_ext == ".zip":
            self.check_zip_safety(destination_path)

        # Detect MIME / basic format
        file_type = self.detect_file_format(destination_path, file_ext)

        return {
            "investigation_id": investigation_id,
            "original_name": safe_original_name,
            "stored_name": stored_name,
            "file_path": str(destination_path),
            "sha256": sha256_hash,
            "file_size_bytes": total_bytes,
            "file_type": file_type,
            "file_ext": file_ext,
        }

    def check_zip_safety(self, zip_path: Path) -> None:
        """
        Check for zip bomb (high uncompressed ratio, excessive member count, directory traversal).
        """
        try:
            if not zipfile.is_zipfile(zip_path):
                return
            with zipfile.ZipFile(zip_path, 'r') as zf:
                infos = zf.infolist()
                if len(infos) > 5000:
                    raise HTTPException(status_code=400, detail="Archive rejected: excessive member count (>5000)")
                total_uncompressed = sum(info.file_size for info in infos)
                compressed = max(zip_path.stat().st_size, 1)
                ratio = total_uncompressed / compressed
                if ratio > 100 and total_uncompressed > 50 * 1024 * 1024:
                    raise HTTPException(status_code=400, detail=f"Archive rejected: compression bomb detected (ratio {ratio:.1f}x)")
                for info in infos:
                    if ".." in info.filename or info.filename.startswith("/") or info.filename.startswith("\\"):
                        raise HTTPException(status_code=400, detail="Archive rejected: illegal path traversal member name")
        except zipfile.BadZipFile:
            # Let static analysis handle malformed archives
            pass

    def detect_file_format(self, path: Path, ext: str) -> str:
        """Inspect magic bytes to categorize file format."""
        try:
            with open(path, "rb") as f:
                header = f.read(16)
                if header.startswith(b"%PDF"):
                    return "application/pdf"
                if header.startswith(b"PK\x03\x04") or header.startswith(b"PK\x05\x06"):
                    if ext in [".docx", ".docm", ".dotx"]:
                        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    return "application/zip"
                if header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
                    return "application/x-ole-storage"
                if header.startswith(b"MZ"):
                    return "application/x-dosexec"
                if header.startswith(b"\x7fELF"):
                    return "application/x-executable"
                if header.startswith(b"#!") or ext in [".ps1", ".vbs", ".js", ".sh", ".py", ".bat"]:
                    return "text/x-script"
                # Check printable text
                if all(b < 128 for b in header[:8]):
                    return "text/plain"
        except Exception:
            pass
        return f"application/octet-stream ({ext})"


ingestion_service = SecureIngestionService()
