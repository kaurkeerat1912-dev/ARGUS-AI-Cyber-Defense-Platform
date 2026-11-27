"""
ARGUS Email Attachment Extractor Service
Extracts attachments, headers, sender telemetry, and phishing URLs directly from
raw .eml (RFC 822/MIME) and .msg (Outlook OLE) files without requiring local disk downloads.
"""

import email
from email import policy
import hashlib
import base64
import re
import io
from typing import List, Dict, Any, Optional
import olefile


class EmailExtractionService:
    def __init__(self):
        self.suspicious_extensions = {
            ".exe", ".scr", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".wsf",
            ".hta", ".cpl", ".msi", ".jar", ".docm", ".xlsm", ".pptm",
            ".iso", ".img", ".vhd", ".zip", ".rar", ".7z", ".tar", ".gz"
        }

    def parse_email(self, data: bytes, original_name: str = "message.eml") -> Dict[str, Any]:
        """
        Detects whether the input is .eml (MIME) or .msg (Outlook OLE) and extracts attachments.
        """
        # Check if Outlook OLE compound file
        if olefile.isOleFile(io.BytesIO(data)):
            try:
                return self._parse_msg(data, original_name)
            except Exception as e:
                # Fallback to MIME parser if OLE parsing fails
                pass

        return self._parse_eml(data, original_name)

    def _parse_eml(self, data: bytes, original_name: str) -> Dict[str, Any]:
        try:
            msg = email.message_from_bytes(data, policy=policy.default)
        except Exception:
            # Fallback to compat policy
            msg = email.message_from_bytes(data)

        subject = str(msg.get("Subject", "(No Subject)"))
        sender = str(msg.get("From", "(Unknown Sender)"))
        to = str(msg.get("To", "(Unknown Recipient)"))
        date = str(msg.get("Date", ""))
        message_id = str(msg.get("Message-ID", ""))
        return_path = str(msg.get("Return-Path", ""))

        # Security Authentication Results (SPF, DKIM, DMARC)
        auth_results = str(msg.get("Authentication-Results", ""))
        spf_status = "PASS" if "spf=pass" in auth_results.lower() else ("FAIL" if "spf=fail" in auth_results.lower() else "UNKNOWN")
        dkim_status = "PASS" if "dkim=pass" in auth_results.lower() else ("FAIL" if "dkim=fail" in auth_results.lower() else "UNKNOWN")

        # Received Hops / Originating IP
        received_headers = msg.get_all("Received", [])
        originating_ip = None
        for r in received_headers:
            ip_match = re.search(r'\[([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\]', str(r))
            if ip_match:
                originating_ip = ip_match.group(1)

        body_text = ""
        attachments: List[Dict[str, Any]] = []
        att_counter = 1

        for part in msg.walk():
            filename = part.get_filename()
            content_type = part.get_content_type()
            content_disposition = str(part.get_content_disposition() or "")

            # If it has a filename or is explicitly marked as attachment
            if filename or content_disposition == "attachment":
                raw_payload = part.get_payload(decode=True)
                if raw_payload and len(raw_payload) > 0:
                    fn = filename or f"attachment_{att_counter}.bin"
                    sha256 = hashlib.sha256(raw_payload).hexdigest()
                    md5 = hashlib.md5(raw_payload).hexdigest()
                    ext = "." + fn.split(".")[-1].lower() if "." in fn else ""
                    is_suspicious = ext in self.suspicious_extensions or "javascript" in content_type.lower() or "octet-stream" in content_type.lower()

                    attachments.append({
                        "id": f"att_{att_counter}",
                        "filename": fn,
                        "size_bytes": len(raw_payload),
                        "content_type": content_type or "application/octet-stream",
                        "sha256": sha256,
                        "md5": md5,
                        "is_suspicious": is_suspicious,
                        "data_base64": base64.b64encode(raw_payload).decode("ascii")
                    })
                    att_counter += 1
            elif content_type in ("text/plain", "text/html"):
                try:
                    decoded = part.get_payload(decode=True)
                    if decoded:
                        body_text += "\n" + decoded.decode("utf-8", errors="ignore")
                except Exception:
                    pass

        # Extract embedded URLs from body
        raw_urls = re.findall(r'https?://[^\s<>\"\'\)]+', body_text)
        unique_urls = list(dict.fromkeys(raw_urls))[:20]

        suspicious_urls = []
        for url in unique_urls:
            is_phish = any(k in url.lower() for k in ["login", "verify", "secure", "update", "account", "paypal", "invoice", "bank", "password"]) or re.search(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url) is not None
            suspicious_urls.append({
                "url": url,
                "is_suspicious": bool(is_phish)
            })

        return {
            "email_format": "EML / MIME (RFC 822)",
            "original_name": original_name,
            "subject": subject,
            "sender": sender,
            "recipient": to,
            "date": date,
            "message_id": message_id,
            "return_path": return_path,
            "originating_ip": originating_ip,
            "spf_status": spf_status,
            "dkim_status": dkim_status,
            "body_snippet": body_text[:500].strip(),
            "attachment_count": len(attachments),
            "attachments": attachments,
            "embedded_urls": suspicious_urls
        }

    def _parse_msg(self, data: bytes, original_name: str) -> Dict[str, Any]:
        """
        Parses Microsoft Outlook .msg compound binary format via olefile.
        """
        ole = olefile.OleFileIO(io.BytesIO(data))
        subject = "(No Subject)"
        sender = "(Unknown Sender)"
        to = "(Unknown Recipient)"
        date = ""
        body_text = ""
        attachments: List[Dict[str, Any]] = []

        # Read top-level properties
        for entry in ole.listdir():
            if len(entry) == 1:
                name = entry[0]
                # Subject PR_SUBJECT: 0x0037
                if "0037" in name:
                    try:
                        raw = ole.openstream(entry).read()
                        subject = raw.decode("utf-16-le" if "001F" in name else "latin-1", errors="ignore").rstrip("\x00")
                    except Exception:
                        pass
                # Sender PR_SENDER_NAME: 0x0C1A or 0x0042
                elif "0C1A" in name or "0042" in name:
                    try:
                        raw = ole.openstream(entry).read()
                        sender = raw.decode("utf-16-le" if "001F" in name else "latin-1", errors="ignore").rstrip("\x00")
                    except Exception:
                        pass
                # Body PR_BODY: 0x1000
                elif "1000" in name:
                    try:
                        raw = ole.openstream(entry).read()
                        body_text = raw.decode("utf-16-le" if "001F" in name else "latin-1", errors="ignore")
                    except Exception:
                        pass

        # Find attachment directories
        attach_dirs = set()
        for entry in ole.listdir():
            if entry and entry[0].startswith("__attach_version1.0_"):
                attach_dirs.add(entry[0])

        att_counter = 1
        for adir in sorted(attach_dirs):
            filename = f"attachment_{att_counter}.bin"
            content_type = "application/octet-stream"
            payload = b""

            for entry in ole.listdir():
                if entry and entry[0] == adir and len(entry) > 1:
                    sub = entry[1]
                    if "3707" in sub or "3704" in sub:
                        try:
                            raw = ole.openstream([adir, sub]).read()
                            filename = raw.decode("utf-16-le" if "001F" in sub else "latin-1", errors="ignore").rstrip("\x00")
                        except Exception:
                            pass
                    elif "370E" in sub:
                        try:
                            raw = ole.openstream([adir, sub]).read()
                            content_type = raw.decode("utf-16-le" if "001F" in sub else "latin-1", errors="ignore").rstrip("\x00")
                        except Exception:
                            pass
                    elif "3701" in sub:
                        try:
                            payload = ole.openstream([adir, sub]).read()
                        except Exception:
                            pass

            if payload and len(payload) > 0:
                sha256 = hashlib.sha256(payload).hexdigest()
                md5 = hashlib.md5(payload).hexdigest()
                ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
                is_suspicious = ext in self.suspicious_extensions

                attachments.append({
                    "id": f"att_{att_counter}",
                    "filename": filename,
                    "size_bytes": len(payload),
                    "content_type": content_type,
                    "sha256": sha256,
                    "md5": md5,
                    "is_suspicious": is_suspicious,
                    "data_base64": base64.b64encode(payload).decode("ascii")
                })
                att_counter += 1

        ole.close()

        raw_urls = re.findall(r'https?://[^\s<>\"\'\)]+', body_text)
        unique_urls = list(dict.fromkeys(raw_urls))[:20]
        suspicious_urls = [{
            "url": u,
            "is_suspicious": any(k in u.lower() for k in ["login", "verify", "secure", "update", "account", "invoice"])
        } for u in unique_urls]

        return {
            "email_format": "Outlook MSG (OLE Binary)",
            "original_name": original_name,
            "subject": subject,
            "sender": sender,
            "recipient": to,
            "date": date,
            "message_id": "",
            "return_path": "",
            "originating_ip": None,
            "spf_status": "UNKNOWN",
            "dkim_status": "UNKNOWN",
            "body_snippet": body_text[:500].strip(),
            "attachment_count": len(attachments),
            "attachments": attachments,
            "embedded_urls": suspicious_urls
        }


email_extraction_service = EmailExtractionService()
