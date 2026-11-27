"""
Google OAuth 2.0 & Gmail API Forensics Service
Permits connecting real personal Gmail accounts via read-only Google OAuth 2.0.
Fetches real user inbox messages and extracts file attachments directly into
ARGUS's in-memory multi-layered forensic inspection engine without ever saving
passwords or exposing secrets.
"""

import os
import json
import base64
from typing import Optional, Dict, Any, List
from pathlib import Path
from datetime import datetime, timezone

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

# ARGUS storage location for OAuth tokens (secure local session token storage)
TOKENS_DIR = Path(__file__).resolve().parents[4] / "data" / "oauth_tokens"
TOKENS_DIR.mkdir(parents=True, exist_ok=True)
TOKEN_PATH = TOKENS_DIR / "gmail_token.json"

# Read-only Gmail scope ensuring maximum security and zero write permissions
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid"
]


class GmailOAuthService:
    def __init__(self):
        # Allow OAuth over http for local development (localhost)
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

    def get_client_credentials(self) -> Dict[str, str]:
        """
        Retrieves Google Client ID & Secret from environment variables or settings.
        """
        client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/email/gmail/oauth/callback")
        return {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri
        }

    def is_configured(self) -> bool:
        creds = self.get_client_credentials()
        return bool(creds["client_id"] and creds["client_secret"])

    def create_authorization_url(self, state: Optional[str] = None) -> Dict[str, str]:
        """
        Generates Google OAuth 2.0 consent authorization URL.
        """
        creds = self.get_client_credentials()
        if not creds["client_id"] or not creds["client_secret"]:
            raise ValueError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not configured in .env")

        client_config = {
            "web": {
                "client_id": creds["client_id"],
                "client_secret": creds["client_secret"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [creds["redirect_uri"]],
            }
        }

        flow = Flow.from_client_config(
            client_config,
            scopes=GMAIL_SCOPES,
            redirect_uri=creds["redirect_uri"]
        )

        auth_url, state_param = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )

        return {
            "authorization_url": auth_url,
            "state": state_param
        }

    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchanges authorization code for access & refresh tokens and caches them locally.
        """
        creds = self.get_client_credentials()
        client_config = {
            "web": {
                "client_id": creds["client_id"],
                "client_secret": creds["client_secret"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [creds["redirect_uri"]],
            }
        }

        flow = Flow.from_client_config(
            client_config,
            scopes=GMAIL_SCOPES,
            redirect_uri=creds["redirect_uri"]
        )

        flow.fetch_token(code=code)
        credentials = flow.credentials

        token_data = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
        }

        with open(TOKEN_PATH, "w", encoding="utf-8") as f:
            json.dump(token_data, f, indent=2)

        # Retrieve user profile
        user_info = self.get_user_profile(credentials)
        return user_info

    def get_credentials(self) -> Optional[Credentials]:
        """
        Loads saved user credentials from local disk and refreshes if expired.
        """
        if not TOKEN_PATH.exists():
            return None

        try:
            with open(TOKEN_PATH, "r", encoding="utf-8") as f:
                token_data = json.load(f)

            credentials = Credentials(
                token=token_data.get("token"),
                refresh_token=token_data.get("refresh_token"),
                token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
                client_id=token_data.get("client_id"),
                client_secret=token_data.get("client_secret"),
                scopes=token_data.get("scopes", GMAIL_SCOPES)
            )

            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                # Update saved token file
                token_data["token"] = credentials.token
                with open(TOKEN_PATH, "w", encoding="utf-8") as f:
                    json.dump(token_data, f, indent=2)

            return credentials
        except Exception as e:
            print(f"Error loading credentials: {e}")
            return None

    def disconnect(self) -> bool:
        """
        Removes saved token and disconnects Gmail account.
        """
        if TOKEN_PATH.exists():
            try:
                TOKEN_PATH.unlink()
                return True
            except Exception:
                return False
        return True

    def get_user_profile(self, creds: Optional[Credentials] = None) -> Dict[str, Any]:
        """
        Fetches the authenticated Gmail user's email address and profile name.
        """
        credentials = creds or self.get_credentials()
        if not credentials:
            return {"authenticated": False}

        try:
            service = build('gmail', 'v1', credentials=credentials, cache_discovery=False)
            profile = service.users().getProfile(userId='me').execute()
            return {
                "authenticated": True,
                "email": profile.get("emailAddress", ""),
                "messages_total": profile.get("messagesTotal", 0),
                "threads_total": profile.get("threadsTotal", 0),
                "history_id": profile.get("historyId", "")
            }
        except Exception as e:
            return {"authenticated": False, "error": str(e)}

    def fetch_real_inbox_messages(self, max_results: int = 15) -> Dict[str, Any]:
        """
        Fetches real user inbox messages from Gmail API.
        Extracts message metadata, snippet, headers, and attachments in-memory.
        """
        credentials = self.get_credentials()
        if not credentials:
            raise ValueError("Gmail account not authenticated. Please complete Google OAuth login.")

        service = build('gmail', 'v1', credentials=credentials, cache_discovery=False)
        profile = service.users().getProfile(userId='me').execute()
        account_email = profile.get("emailAddress", "me")

        # Query messages
        results = service.users().messages().list(
            userId='me',
            maxResults=max_results,
            q='label:INBOX'
        ).execute()

        messages_list = results.get('messages', [])
        inbox_messages = []
        unread_count = 0

        for msg_ref in messages_list:
            msg_id = msg_ref['id']
            try:
                msg = service.users().messages().get(
                    userId='me',
                    id=msg_id,
                    format='full'
                ).execute()

                payload = msg.get('payload', {})
                headers = {h['name'].lower(): h['value'] for h in payload.get('headers', [])}

                subject = headers.get('subject', '(No Subject)')
                sender = headers.get('from', 'Unknown Sender')
                date_str = headers.get('date', '')
                snippet = msg.get('snippet', '')
                label_ids = msg.get('labelIds', [])
                is_unread = 'UNREAD' in label_ids
                if is_unread:
                    unread_count += 1

                spf_status = "PASS" if "spf=pass" in headers.get('authentication-results', '').lower() else "INFO"
                dkim_status = "PASS" if "dkim=pass" in headers.get('authentication-results', '').lower() else "INFO"
                originating_ip = headers.get('x-originating-ip', headers.get('received', '127.0.0.1'))
                if " " in originating_ip:
                    # Parse out IP from first received bracket if available
                    import re
                    match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', originating_ip)
                    originating_ip = match.group(0) if match else "127.0.0.1"

                # Extract attachments
                attachments = []
                self._extract_parts(service, msg_id, payload, attachments)

                inbox_messages.append({
                    "id": msg_id,
                    "thread_id": msg.get("threadId", msg_id),
                    "subject": subject,
                    "sender": sender,
                    "snippet": snippet,
                    "date": date_str,
                    "unread": is_unread,
                    "spf_status": spf_status,
                    "dkim_status": dkim_status,
                    "originating_ip": originating_ip,
                    "has_attachments": len(attachments) > 0,
                    "attachments": attachments
                })
            except Exception as ex:
                print(f"Error parsing Gmail message {msg_id}: {ex}")
                continue

        return {
            "status": "connected",
            "account_email": account_email,
            "unread_count": unread_count,
            "total_messages": len(inbox_messages),
            "messages": inbox_messages
        }

    def _extract_parts(self, service, message_id: str, part: Dict[str, Any], attachments: List[Dict[str, Any]]):
        """
        Recursively extracts file attachments from Gmail message payload parts.
        """
        filename = part.get('filename')
        body = part.get('body', {})
        attachment_id = body.get('attachmentId')

        if filename and attachment_id:
            try:
                # Fetch attachment data directly from Gmail API
                att_part = service.users().messages().attachments().get(
                    userId='me',
                    messageId=message_id,
                    id=attachment_id
                ).execute()

                raw_base64 = att_part.get('data', '')
                # Gmail returns URL-safe base64, convert to standard base64
                standard_b64 = raw_base64.replace('-', '+').replace('_', '/')
                # Pad if needed
                pad = len(standard_b64) % 4
                if pad:
                    standard_b64 += '=' * (4 - pad)

                import hashlib
                raw_bytes = base64.b64decode(standard_b64)
                file_hash = hashlib.sha256(raw_bytes).hexdigest()
                md5_hash = hashlib.md5(raw_bytes).hexdigest()

                # Flag suspicious extensions
                ext = Path(filename).suffix.lower()
                is_suspicious = ext in [
                    '.exe', '.dll', '.bin', '.vbs', '.ps1', '.bat', '.cmd', '.scr',
                    '.docm', '.xlsm', '.pptm', '.zip', '.iso', '.jar', '.js', '.wsf'
                ]

                attachments.append({
                    "id": attachment_id,
                    "filename": filename,
                    "size_bytes": len(raw_bytes),
                    "content_type": part.get('mimeType', 'application/octet-stream'),
                    "sha256": file_hash,
                    "md5": md5_hash,
                    "is_suspicious": is_suspicious,
                    "data_base64": standard_b64
                })
            except Exception as e:
                print(f"Error fetching attachment {filename}: {e}")

        # Check subparts
        for sub_part in part.get('parts', []):
            self._extract_parts(service, message_id, sub_part, attachments)


gmail_oauth_service = GmailOAuthService()
