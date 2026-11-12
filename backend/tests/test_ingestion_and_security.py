"""
Unit Tests for Secure Ingestion, Path Traversal Prevention, and Cryptographic Quarantine.
"""

import hashlib
import io
import pytest
from pathlib import Path
from fastapi import UploadFile, HTTPException

from backend.app.services.ingestion.quarantine import ingestion_service


def test_sanitize_filename_path_traversal():
    """Verify that dangerous directory traversal attacks in filenames are neutralized."""
    dangerous = "../../../etc/passwd"
    clean = ingestion_service.sanitize_filename(dangerous)
    assert ".." not in clean
    assert "/" not in clean
    assert "\\" not in clean
    assert clean.endswith("passwd")


def test_sanitize_filename_special_characters():
    """Verify stripping of command injection metacharacters."""
    dangerous = "sample;rm -rf /;`calc.exe`.pdf"
    clean = ingestion_service.sanitize_filename(dangerous)
    assert ";" not in clean
    assert "`" not in clean
    assert " " not in clean


def test_sha256_hash_accuracy():
    """Verify cryptographic hashing matches standard hashlib."""
    test_content = b"SRM University Academic Digital Forensics Test Payload 2026-2027"
    expected_hash = hashlib.sha256(test_content).hexdigest()

    file_obj = UploadFile(
        filename="test_crypto.txt",
        file=io.BytesIO(test_content)
    )

    import asyncio
    meta = asyncio.run(ingestion_service.ingest_upload(file_obj))
    assert meta["sha256"] == expected_hash
    assert meta["file_size_bytes"] == len(test_content)
    assert Path(meta["file_path"]).exists()

    # Clean up quarantined test file
    Path(meta["file_path"]).unlink(missing_ok=True)


def test_detect_file_format_magic_bytes(tmp_path):
    """Test format detection from binary headers."""
    # PDF magic
    pdf_file = tmp_path / "test.pdf"
    pdf_file.write_bytes(b"%PDF-1.4\n%header")
    assert ingestion_service.detect_file_format(pdf_file, ".pdf") == "application/pdf"

    # DOS MZ magic
    exe_file = tmp_path / "test.exe"
    exe_file.write_bytes(b"MZ\x90\x00\x03\x00\x00\x00")
    assert ingestion_service.detect_file_format(exe_file, ".exe") == "application/x-dosexec"
