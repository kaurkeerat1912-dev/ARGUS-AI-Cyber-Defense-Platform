"""
Static Digital Forensics Engine
Performs non-executing deep forensic analysis on PDF, DOCX, ZIP, PE binaries, and scripts.
Extracts structured evidence items with defensible severity and limitations.
"""

import math
import os
import re
import zipfile
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Optional / Graceful Imports
try:
    import pymupdf  # Modern PyMuPDF API
except ImportError:
    pymupdf = None

try:
    import pefile
except ImportError:
    pefile = None

try:
    from oletools.olevba import VBA_Parser
except ImportError:
    VBA_Parser = None

try:
    import yara
except ImportError:
    yara = None

from backend.app.core.config import settings


class StaticForensicsEngine:
    def __init__(self):
        self.yara_rules = None
        self._load_yara_rules()

    def _load_yara_rules(self):
        """Compile YARA rules if yara is available and rule file exists."""
        if yara and settings.YARA_RULES_PATH.exists():
            try:
                self.yara_rules = yara.compile(filepath=str(settings.YARA_RULES_PATH))
            except Exception as e:
                print(f"[Forensics] Warning: Failed to compile YARA rules: {e}")
                self.yara_rules = None

    def calculate_entropy(self, data: bytes) -> float:
        """Calculate Shannon entropy (0.0 to 8.0) of byte buffer."""
        if not data:
            return 0.0
        entropy = 0.0
        length = len(data)
        counts = Counter(data)
        for count in counts.values():
            p_x = count / length
            if p_x > 0:
                entropy -= p_x * math.log2(p_x)
        return round(entropy, 4)

    def extract_strings(self, data: bytes, min_len: int = 4) -> List[str]:
        """Extract printable ASCII and UTF-16 strings."""
        ascii_regex = re.compile(rb'[\x20-\x7E]{' + str(min_len).encode() + rb',}')
        unicode_regex = re.compile(rb'(?:[\x20-\x7E]\x00){' + str(min_len).encode() + rb',}')

        strings = []
        for match in ascii_regex.finditer(data):
            strings.append(match.group().decode('ascii', errors='ignore'))
        for match in unicode_regex.finditer(data):
            strings.append(match.group().decode('utf-16le', errors='ignore'))
        return strings

    def extract_iocs(self, strings: List[str]) -> Dict[str, List[str]]:
        """Identify URLs, IPv4 addresses, and domain indicators from strings."""
        url_pattern = re.compile(r'https?://[a-zA-Z0-9.-]+(?:/[^\s]*)?', re.IGNORECASE)
        ip_pattern = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
        domain_pattern = re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|ru|xyz|top|cc|onion|biz|info|site)\b', re.IGNORECASE)

        urls = set()
        ips = set()
        domains = set()

        benign_schema_domains = {
            "ns.adobe.com", "w3.org", "www.w3.org", "purl.org",
            "schemas.openxmlformats.org", "schemas.microsoft.com",
            "openoffice.org", "xml.org", "oasis-open.org", "schema.org"
        }

        def _is_benign_schema(val: str) -> bool:
            try:
                from urllib.parse import urlparse
                parsed = urlparse(val)
                host = (parsed.netloc or val).lower()
                if ":" in host:
                    host = host.split(":")[0]
                return any(host == d or host.endswith("." + d) for d in benign_schema_domains)
            except Exception:
                return False

        for s in strings:
            for u in url_pattern.findall(s):
                clean_u = u.strip("'\".,()<>")
                if not _is_benign_schema(clean_u):
                    urls.add(clean_u)
            for ip in ip_pattern.findall(s):
                # Filter out standard non-routable / subnet masks
                if not (ip.startswith("0.") or ip.startswith("127.") or ip == "255.255.255.255" or ip == "0.0.0.0"):
                    ips.add(ip)
            for d in domain_pattern.findall(s):
                clean_d = d.lower()
                if not clean_d.endswith(".exe") and not clean_d.endswith(".dll") and not _is_benign_schema(clean_d):
                    domains.add(clean_d)

        return {
            "urls": sorted(list(urls))[:50],
            "ips": sorted(list(ips))[:50],
            "domains": sorted(list(domains))[:50],
        }

    def analyze_file(self, file_path: str, original_name: str, file_type: str) -> List[Dict[str, Any]]:
        """
        Main static analysis dispatcher. Returns a list of structured Evidence Items.
        """
        path = Path(file_path)
        if not path.exists():
            return []

        with open(path, "rb") as f:
            raw_bytes = f.read()

        evidence_items: List[Dict[str, Any]] = []

        # 1. Base Metadata & Entropy Evidence
        file_size = len(raw_bytes)
        overall_entropy = self.calculate_entropy(raw_bytes)

        evidence_items.append({
            "category": "METADATA",
            "title": "Cryptographic and Structural Size Metrics",
            "description": f"File size is {file_size} bytes ({file_size / 1024:.2f} KB). Detected MIME type is {file_type}.",
            "severity": "INFO",
            "observed_value": f"Size: {file_size} B, Type: {file_type}",
            "extraction_source": "Header Inspection",
            "offset_or_location": "Offset 0x0000",
            "explanation": "Fundamental baseline artifact recorded for verification and non-repudiation.",
            "confidence": 1.0,
            "limitations": "MIME type is inferred from magic bytes and extension, not execution behavior."
        })

        ext = path.suffix.lower()
        is_compressed_container = (
            any(k in file_type.lower() for k in ["pdf", "zip", "word", "opendocument"])
            or ext in [".pdf", ".docx", ".zip", ".xlsx", ".pptx"]
        )

        entropy_severity = "INFO"
        entropy_desc = f"Overall Shannon entropy is {overall_entropy:.2f} out of 8.0."
        if overall_entropy > 7.3 and not is_compressed_container:
            entropy_severity = "HIGH"
            entropy_desc += " Very high entropy strongly indicates encrypted payloads, obfuscation, or packed executable layers."
        elif overall_entropy > 7.95 and is_compressed_container:
            entropy_severity = "MEDIUM"
            entropy_desc += " Near-maximum byte entropy in container suggests high-density encrypted or obfuscated payload stream."
        elif overall_entropy > 6.6 and not is_compressed_container:
            entropy_severity = "MEDIUM"
            entropy_desc += " Elevated entropy typical of compressed data or lightweight obfuscation."
        elif is_compressed_container:
            entropy_desc += " Byte entropy level is normal and expected for standard compressed container object streams."

        evidence_items.append({
            "category": "ENTROPY",
            "title": "Shannon Entropy Analysis",
            "description": entropy_desc,
            "severity": entropy_severity,
            "observed_value": str(overall_entropy),
            "extraction_source": "Entropy Calculator",
            "offset_or_location": "Full Sample",
            "explanation": "Calculates byte randomness to detect packing, compression, or encryption.",
            "confidence": 0.95,
            "limitations": "Benign media (PNG, JPEG, MP3) and compressed archives naturally exhibit high entropy."
        })

        # 2. String Extraction & IOCs
        extracted_strings = self.extract_strings(raw_bytes)
        iocs = self.extract_iocs(extracted_strings)

        if iocs["urls"]:
            evidence_items.append({
                "category": "NETWORK",
                "title": f"Extracted Network URLs ({len(iocs['urls'])} detected)",
                "description": f"Identified remote URLs: {', '.join(iocs['urls'][:5])}{'...' if len(iocs['urls']) > 5 else ''}",
                "severity": "MEDIUM",
                "observed_value": "; ".join(iocs["urls"]),
                "extraction_source": "String Analysis",
                "offset_or_location": "String Table",
                "explanation": "Potential Command & Control (C2) domains, stage-2 download URLs, or benign web links.",
                "confidence": 0.85,
                "limitations": "URLs may be benign schema references, documentation links, or decoy strings."
            })

        if iocs["ips"]:
            evidence_items.append({
                "category": "NETWORK",
                "title": f"Hardcoded IP Indicators ({len(iocs['ips'])} detected)",
                "description": f"Discovered IP addresses: {', '.join(iocs['ips'][:5])}",
                "severity": "MEDIUM",
                "observed_value": "; ".join(iocs["ips"]),
                "extraction_source": "String Analysis",
                "offset_or_location": "String Table",
                "explanation": "Direct IP communication without DNS resolution is frequently used by botnets and droppers.",
                "confidence": 0.80,
                "limitations": "Some IPs may be internal development addresses, DNS servers, or CDN endpoints."
            })

        # 3. YARA Rules Scanning
        if self.yara_rules:
            try:
                matches = self.yara_rules.match(data=raw_bytes)
                for match in matches:
                    meta = match.meta
                    rule_severity = meta.get("severity", "HIGH")
                    evidence_items.append({
                        "category": "YARA",
                        "title": f"YARA Match: {match.rule}",
                        "description": meta.get("description", f"Rule {match.rule} matched signature criteria."),
                        "severity": rule_severity,
                        "observed_value": f"Rule: {match.rule}, Tags: {','.join(match.tags) if match.tags else 'None'}",
                        "extraction_source": "YARA Engine 4.5",
                        "offset_or_location": f"Strings matched: {len(match.strings)}",
                        "explanation": "Signatures based on established threat intelligence and forensic research.",
                        "confidence": 0.90,
                        "limitations": "YARA rules can trigger on benign files containing sample strings."
                    })
            except Exception as e:
                print(f"[Forensics] YARA scan error: {e}")

        # 4. Format-Specific Forensic Parsers
        ext = path.suffix.lower()

        # PDF Forensics
        if "pdf" in file_type or ext == ".pdf":
            evidence_items.extend(self._analyze_pdf(raw_bytes))

        # Office DOCX Forensics
        elif "word" in file_type or ext in [".docx", ".docm", ".dotx"]:
            evidence_items.extend(self._analyze_docx(path, raw_bytes))

        # OLE Binary Forensics (.doc)
        elif "ole" in file_type or ext == ".doc":
            evidence_items.extend(self._analyze_ole(path))

        # ZIP Archive Forensics
        elif "zip" in file_type or ext == ".zip":
            evidence_items.extend(self._analyze_zip(path))

        # Windows PE Executable Forensics (.exe, .dll)
        elif "dosexec" in file_type or ext in [".exe", ".dll"]:
            evidence_items.extend(self._analyze_pe(raw_bytes))

        # Script Forensics (.ps1, .vbs, .js, .bat, .sh)
        elif ext in [".ps1", ".vbs", ".js", ".bat", ".sh", ".py"]:
            evidence_items.extend(self._analyze_script(raw_bytes, ext))

        return evidence_items

    def _analyze_pdf(self, data: bytes) -> List[Dict[str, Any]]:
        """Deep PDF static inspection using PyMuPDF structural xref inspection and token-boundary regex."""
        items = []
        suspicious_pdf_keywords = {
            "JavaScript": ("CRITICAL", "PDF contains embedded JavaScript (/JavaScript), common in exploit documents."),
            "JS": ("CRITICAL", "PDF contains abbreviated JavaScript block (/JS)."),
            "Launch": ("CRITICAL", "PDF attempts to execute external command or application (/Launch)."),
            "OpenAction": ("HIGH", "PDF automatically triggers an action upon opening (/OpenAction)."),
            "AA": ("HIGH", "PDF includes Additional Action trigger (/AA)."),
            "EmbeddedFiles": ("MEDIUM", "PDF contains attached embedded files (/EmbeddedFiles)."),
            "AcroForm": ("INFO", "PDF contains interactive form fields (/AcroForm)."),
        }

        detected_counts = Counter()
        pymupdf_success = False

        if pymupdf:
            try:
                doc = pymupdf.open(stream=data, filetype="pdf")
                pymupdf_success = True
                meta = doc.metadata or {}
                page_count = len(doc)

                # 1. Structural inspection of XREF dictionary keys (defensible, non-executing)
                for xref in range(1, doc.xref_length()):
                    try:
                        keys = doc.xref_get_keys(xref)
                        for k in keys:
                            k_clean = k.strip("/")
                            if k_clean in suspicious_pdf_keywords:
                                detected_counts[k_clean] += 1
                    except Exception:
                        continue

                items.append({
                    "category": "STRUCTURE",
                    "title": "PDF Document Architecture",
                    "description": f"Pages: {page_count}, Producer: {meta.get('producer', 'Unknown')}, Creator: {meta.get('creator', 'Unknown')}",
                    "severity": "INFO",
                    "observed_value": f"Pages: {page_count}, Encrypted: {doc.is_encrypted}",
                    "extraction_source": "PyMuPDF Parser",
                    "offset_or_location": "PDF Info Dictionary",
                    "explanation": "Structural document integrity and creation application provenance.",
                    "confidence": 1.0,
                    "limitations": "Metadata can be trivially spoofed by threat actors."
                })
                doc.close()
            except Exception as e:
                items.append({
                    "category": "STRUCTURE",
                    "title": "PDF Parsing Anomaly",
                    "description": f"Malformed or corrupted PDF structure: {str(e)}",
                    "severity": "MEDIUM",
                    "observed_value": "Malformed Syntax",
                    "extraction_source": "PyMuPDF Parser",
                    "offset_or_location": "XREF / Header",
                    "explanation": "Malformed headers are often engineered to exploit PDF reader vulnerability parsers.",
                    "confidence": 0.85,
                    "limitations": "File may simply be truncated during incomplete transmission."
                })

        # Token-boundary regex fallback if PyMuPDF not installed or parser errored
        if not pymupdf_success:
            for keyword in suspicious_pdf_keywords:
                # Require PDF token boundary delimiters: whitespace, slash, or angle brackets
                pattern = re.compile(rb'(?:^|[\s<>/])/' + keyword.encode('ascii') + rb'(?:[\s<>/]|$)', re.IGNORECASE)
                count = len(pattern.findall(data))
                if count > 0:
                    detected_counts[keyword] = count

        for keyword, count in detected_counts.items():
            if count > 0 and keyword in suspicious_pdf_keywords:
                severity, explanation = suspicious_pdf_keywords[keyword]
                items.append({
                    "category": "EMBEDDED",
                    "title": f"Suspicious PDF Object: /{keyword}",
                    "description": f"Detected {count} instance(s) of /{keyword} object stream.",
                    "severity": severity,
                    "observed_value": f"Count: {count}",
                    "extraction_source": "PDF Stream Parser",
                    "offset_or_location": "Catalog / Stream Objects",
                    "explanation": explanation,
                    "confidence": 0.95,
                    "limitations": "Legitimate dynamic PDF forms may include benign JavaScript for calculation."
                })
        return items

    def _analyze_docx(self, path: Path, data: bytes) -> List[Dict[str, Any]]:
        """Analyze OpenXML Office documents for VBA macros and external relationships."""
        items = []
        try:
            if zipfile.is_zipfile(path):
                with zipfile.ZipFile(path, 'r') as zf:
                    names = zf.namelist()
                    # Check for vbaProject.bin
                    vba_files = [n for n in names if 'vbaProject.bin' in n or 'vbaData' in n]
                    if vba_files:
                        items.append({
                            "category": "EMBEDDED",
                            "title": "Embedded VBA Macro Project Detected",
                            "description": f"Found VBA binary container in OpenXML document: {', '.join(vba_files)}",
                            "severity": "HIGH",
                            "observed_value": "; ".join(vba_files),
                            "extraction_source": "OpenXML Inspector",
                            "offset_or_location": "word/vbaProject.bin",
                            "explanation": "Macros in modern DOCX files are anomalous (standard files use .docm) and pose malware risk.",
                            "confidence": 0.95,
                            "limitations": "Macros may be legacy enterprise workflow automation."
                        })

                    # Check external relationships (Template injection)
                    rel_files = [n for n in names if n.endswith('.rels')]
                    for rel_file in rel_files:
                        content = zf.read(rel_file).decode('utf-8', errors='ignore')
                        if 'TargetMode="External"' in content:
                            external_targets = re.findall(r'Target="([^"]+)"', content)
                            items.append({
                                "category": "NETWORK",
                                "title": "Remote Template Injection Mechanism",
                                "description": f"Document references external remote relationships: {', '.join(external_targets[:3])}",
                                "severity": "HIGH",
                                "observed_value": "; ".join(external_targets),
                                "extraction_source": "OpenXML Relationships",
                                "offset_or_location": rel_file,
                                "explanation": "Attackers use remote template injection to load malicious macro-enabled templates at runtime.",
                                "confidence": 0.90,
                                "limitations": "Enterprise templates may be hosted on legitimate internal SharePoint servers."
                            })
        except Exception as e:
            items.append({
                "category": "STRUCTURE",
                "title": "DOCX Archive Examination Failure",
                "description": f"Error inspecting OpenXML package: {str(e)}",
                "severity": "LOW",
                "observed_value": "Error",
                "extraction_source": "Archive Reader",
                "offset_or_location": "PK Container",
                "explanation": "Non-standard document packaging.",
                "confidence": 0.70,
                "limitations": "Non-fatal parsing notification."
            })
        return items

    def _analyze_ole(self, path: Path) -> List[Dict[str, Any]]:
        """Analyze legacy OLE (.doc) files using oletools if available."""
        items = []
        if VBA_Parser:
            try:
                vbaparser = VBA_Parser(str(path))
                if vbaparser.detect_vba_macros():
                    macros = vbaparser.get_vba_code()
                    results = vbaparser.analyze_macros()
                    suspicious_keywords = []
                    for kw_type, keyword, description in results:
                        suspicious_keywords.append(f"[{kw_type}] {keyword}: {description}")

                    severity = "CRITICAL" if any("AutoExec" in s or "Suspicious" in s for s in suspicious_keywords) else "HIGH"
                    items.append({
                        "category": "EMBEDDED",
                        "title": "OLE VBA Macro Primitives and Execution Triggers",
                        "description": f"Found {len(suspicious_keywords)} trigger(s) or suspicious APIs in VBA streams.",
                        "severity": severity,
                        "observed_value": "; ".join(suspicious_keywords[:8]),
                        "extraction_source": "oletools / olevba",
                        "offset_or_location": "VBA Macro Storage",
                        "explanation": "Detected API calls capable of executing code, invoking shells, or dropping payloads.",
                        "confidence": 0.95,
                        "limitations": "Administrative automation scripts occasionally invoke shell commands."
                    })
                vbaparser.close()
            except Exception as e:
                print(f"[Forensics] OLE parser notice: {e}")
        return items

    def _analyze_zip(self, path: Path) -> List[Dict[str, Any]]:
        """Structural inspection of ZIP archives."""
        items = []
        try:
            with zipfile.ZipFile(path, 'r') as zf:
                infos = zf.infolist()
                double_extensions = []
                executable_members = []
                for info in infos:
                    filename = info.filename
                    ext = Path(filename).suffix.lower()
                    if ext in [".exe", ".dll", ".bat", ".vbs", ".ps1", ".scr", ".js"]:
                        executable_members.append(filename)
                    if len(filename.split('.')) > 2:
                        double_extensions.append(filename)

                if double_extensions:
                    items.append({
                        "category": "STRUCTURE",
                        "title": "Double Extension Masquerading Detected",
                        "description": f"Archive contains files with multiple extensions: {', '.join(double_extensions[:5])}",
                        "severity": "HIGH",
                        "observed_value": "; ".join(double_extensions),
                        "extraction_source": "ZIP Directory Parser",
                        "offset_or_location": "Central Directory",
                        "explanation": "Technique used to deceive victims into opening executables disguised as documents.",
                        "confidence": 0.92,
                        "limitations": "Benign backups often use compound extensions such as .tar.gz."
                    })

                if executable_members:
                    items.append({
                        "category": "EMBEDDED",
                        "title": "Embedded Executables Inside Archive",
                        "description": f"Archive packages executable binaries: {', '.join(executable_members[:5])}",
                        "severity": "HIGH",
                        "observed_value": "; ".join(executable_members),
                        "extraction_source": "ZIP Directory Parser",
                        "offset_or_location": "Archive Entries",
                        "explanation": "Executable delivery via compressed containers is a primary vector for phishing droppers.",
                        "confidence": 0.90,
                        "limitations": "Software distributions legitimately distribute executable installers in ZIP archives."
                    })
        except Exception as e:
            items.append({
                "category": "STRUCTURE",
                "title": "ZIP Structural Analysis Error",
                "description": str(e),
                "severity": "LOW",
                "observed_value": "Error",
                "extraction_source": "ZIP Parser",
                "offset_or_location": "Container",
                "explanation": "Notice while inspecting archive entries.",
                "confidence": 0.70,
                "limitations": "None."
            })
        return items

    def _analyze_pe(self, data: bytes) -> List[Dict[str, Any]]:
        """Analyze Windows Portable Executable headers, sections, and imports."""
        items = []
        if not pefile:
            return items

        try:
            pe = pefile.PE(data=data)
            suspicious_apis = {
                "VirtualAlloc": "Memory injection / shellcode staging",
                "WriteProcessMemory": "Process injection primitive",
                "CreateRemoteThread": "Thread injection into external process",
                "URLDownloadToFileA": "Outbound stage-2 payload downloader",
                "URLDownloadToFileW": "Outbound stage-2 payload downloader",
                "WinExec": "Process execution command",
                "ShellExecuteA": "Process execution command",
                "IsDebuggerPresent": "Anti-analysis / evasive detection",
                "CheckRemoteDebuggerPresent": "Anti-analysis / evasive detection",
            }

            found_suspicious_apis = []
            if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
                for entry in pe.DIRECTORY_ENTRY_IMPORT:
                    for imp in entry.imports:
                        if imp.name:
                            name_str = imp.name.decode('utf-8', errors='ignore')
                            if name_str in suspicious_apis:
                                found_suspicious_apis.append(f"{name_str} ({suspicious_apis[name_str]})")

            if found_suspicious_apis:
                items.append({
                    "category": "STRUCTURE",
                    "title": f"High-Risk Imported API Functions ({len(found_suspicious_apis)} detected)",
                    "description": f"Detected APIs commonly abused for malware staging: {', '.join(found_suspicious_apis[:4])}",
                    "severity": "HIGH",
                    "observed_value": "; ".join(found_suspicious_apis),
                    "extraction_source": "PE Import Directory Table",
                    "offset_or_location": "IMAGE_DIRECTORY_ENTRY_IMPORT",
                    "explanation": "Imported functions allow process memory manipulation, remote code execution, and evasion.",
                    "confidence": 0.88,
                    "limitations": "Legitimate system utilities and debuggers also call these Win32 APIs."
                })

            # Check sections entropy & UPX
            packed_sections = []
            for section in pe.sections:
                sec_name = section.Name.decode('utf-8', errors='ignore').strip('\x00')
                sec_entropy = section.get_entropy()
                if sec_entropy > 7.3 or "UPX" in sec_name:
                    packed_sections.append(f"{sec_name} (Entropy: {sec_entropy:.2f})")

            if packed_sections:
                items.append({
                    "category": "ENTROPY",
                    "title": "Packed or Encrypted PE Section Headers",
                    "description": f"Sections exhibit high entropy or packing signatures: {', '.join(packed_sections)}",
                    "severity": "HIGH",
                    "observed_value": "; ".join(packed_sections),
                    "extraction_source": "PE Section Header Parser",
                    "offset_or_location": "IMAGE_SECTION_HEADER",
                    "explanation": "Packing compresses or encrypts binary code to obstruct static reverse engineering and AV signatures.",
                    "confidence": 0.92,
                    "limitations": "Legitimate proprietary software protectors also pack binary assets."
                })
        except Exception as e:
            items.append({
                "category": "STRUCTURE",
                "title": "PE File Analysis Note",
                "description": f"PE parser reported: {str(e)}",
                "severity": "INFO",
                "observed_value": "Notice",
                "extraction_source": "pefile",
                "offset_or_location": "PE Header",
                "explanation": "Executable header parsing information.",
                "confidence": 0.80,
                "limitations": "File might be corrupted or truncated."
            })
        return items

    def _analyze_script(self, data: bytes, ext: str) -> List[Dict[str, Any]]:
        """Static pattern matching on script files."""
        items = []
        text = data.decode('utf-8', errors='ignore')
        patterns = {
            "Download Cradle": (r'(?:DownloadString|DownloadFile|Invoke-WebRequest|curl\s+-O|bitsadmin)', "CRITICAL"),
            "Hidden Execution": (r'(?:-WindowStyle\s+Hidden|-w\s+hidden|-ExecutionPolicy\s+Bypass|-enc\s+)', "HIGH"),
            "Base64 Decoding": (r'(?:FromBase64String|\[System\.Convert\]::FromBase64String|certutil\s+-decode)', "HIGH"),
            "Obfuscated Variables": (r'\$\{?`?[a-zA-Z0-9_]+`?\}?', "MEDIUM"),
        }

        for pattern_name, (regex_str, severity) in patterns.items():
            matches = re.findall(regex_str, text, re.IGNORECASE)
            if matches:
                items.append({
                    "category": "STRINGS",
                    "title": f"Script Anomaly: {pattern_name}",
                    "description": f"Detected {len(matches)} occurrence(s) of suspicious command patterns: {matches[0]}",
                    "severity": severity,
                    "observed_value": f"Count: {len(matches)}, Sample: {matches[0][:80]}",
                    "extraction_source": f"Script Parser ({ext})",
                    "offset_or_location": "Text Body",
                    "explanation": f"Pattern frequently employed by malware droppers to execute living-off-the-land commands.",
                    "confidence": 0.88,
                    "limitations": "Administrative automation scripts occasionally use download cradles or hidden execution."
                })
        return items


static_forensics_engine = StaticForensicsEngine()
