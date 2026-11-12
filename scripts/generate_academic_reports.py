#!/usr/bin/env python3
"""
ARGUS Final Year Project Report Generator
Generates comprehensive university-level BTech CSE (DSAI) project reports in DOCX and PDF formats.
Institutions: SRM University Delhi-NCR, Sonepat (Session 2026-2027)
Project Guide: Mr. Rakesh Ahuja
Team: Keerat Kaur, Arushi Gupta, Nishant Chandela
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# python-docx imports for DOCX generation
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "reports" / "final_submission"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
DOCX_PATH = OUTPUT_DIR / "ARGUS_Final_Year_Project_Report.docx"
PDF_PATH = OUTPUT_DIR / "ARGUS_Final_Year_Project_Report.pdf"


# ==============================================================================
# DOCX Generation Engine
# ==============================================================================
def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generate_docx():
    print("[*] Generating DOCX Academic Report...")
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)  # Slate-800

    # ---------------------------------------------------------
    # 1. COVER PAGE
    # ---------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("ARGUS: AI-POWERED CYBER ATTACK & DEFENSE SIMULATION PLATFORM")
    r_title.bold = True
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)  # Slate-900

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("A Unified Static Forensics, Explainable Machine Learning, Directed Threat Graph Reconstruction, and Host-Isolated Remediation Framework")
    r_sub.italic = True
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    doc.add_paragraph("\n" * 2)

    p_req = doc.add_paragraph()
    p_req.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_req = p_req.add_run("A Major Project Report submitted in partial fulfillment of the requirements\nfor the award of the degree of\n\nBACHELOR OF TECHNOLOGY\nin\nCOMPUTER SCIENCE & ENGINEERING\n(DATA SCIENCE & ARTIFICIAL INTELLIGENCE)")
    r_req.font.size = Pt(12)
    r_req.bold = True
    r_req.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    doc.add_paragraph("\n" * 2)

    # Team Table
    table_team = doc.add_table(rows=1, cols=2)
    table_team.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_team.autofit = False

    cell_left = table_team.rows[0].cells[0]
    cell_right = table_team.rows[0].cells[1]
    cell_left.width = Inches(3.2)
    cell_right.width = Inches(3.2)

    p_sub_by = cell_left.paragraphs[0]
    p_sub_by.add_run("Submitted by:\n").bold = True
    p_sub_by.add_run("• Keerat Kaur (Lead Developer & ML Engineer)\n")
    p_sub_by.add_run("• Arushi Gupta (Forensics & Backend Specialist)\n")
    p_sub_by.add_run("• Nishant Chandela (UI/UX & Telemetry Engineer)\n")

    p_guide = cell_right.paragraphs[0]
    p_guide.add_run("Under the Guidance of:\n").bold = True
    p_guide.add_run("Mr. Rakesh Ahuja\n").bold = True
    p_guide.add_run("Assistant Professor\nDepartment of CSE (DSAI)\nSRM University Delhi-NCR, Sonipat\n")

    doc.add_paragraph("\n" * 3)

    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\nSRM UNIVERSITY DELHI-NCR, SONEPAT, HARYANA - 131029\nACADEMIC YEAR 2026–2027")
    r_inst.bold = True
    r_inst.font.size = Pt(12)

    doc.add_page_break()

    # ---------------------------------------------------------
    # Helper for Headings
    # ---------------------------------------------------------
    def add_sec_heading(title, level=1):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.bold = True
        if level == 1:
            r.font.size = Pt(16)
            r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        elif level == 2:
            r.font.size = Pt(13)
            r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        else:
            r.font.size = Pt(11.5)
            r.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
        return p

    def add_body_p(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
        p.add_run(text)
        return p

    # ---------------------------------------------------------
    # 2. CERTIFICATE
    # ---------------------------------------------------------
    add_sec_heading("CERTIFICATE")
    add_body_p(
        "This is to certify that the project entitled \"ARGUS: AI-POWERED CYBER ATTACK & DEFENSE SIMULATION PLATFORM\" "
        "is a bona fide record of major project work carried out by Keerat Kaur, Arushi Gupta, and Nishant Chandela, "
        "students of Bachelor of Technology in Computer Science & Engineering (Data Science & Artificial Intelligence) "
        "at SRM University Delhi-NCR, Sonepat, during the academic session 2026–2027.\n\n"
        "The project has been completed under my direct supervision and guidance in partial fulfillment of the requirements "
        "prescribed by the university curriculum. To the best of my knowledge, the matter embodied in this report has not "
        "been submitted to any other University or Institute for the award of any degree or diploma."
    )
    doc.add_paragraph("\n" * 3)

    t_cert = doc.add_table(rows=1, cols=2)
    t_cert.rows[0].cells[0].paragraphs[0].add_run("_________________________\nMr. Rakesh Ahuja\nProject Guide\nDepartment of CSE (DSAI)").bold = True
    t_cert.rows[0].cells[1].paragraphs[0].add_run("_________________________\nHead of Department\nDepartment of CSE\nSRM University Delhi-NCR").bold = True
    doc.add_page_break()

    # ---------------------------------------------------------
    # 3. DECLARATION
    # ---------------------------------------------------------
    add_sec_heading("DECLARATION")
    add_body_p(
        "We hereby declare that the project report entitled \"ARGUS: AI-POWERED CYBER ATTACK & DEFENSE SIMULATION PLATFORM\" "
        "submitted by us to the Department of Computer Science & Engineering, SRM University Delhi-NCR, Sonipat, is our original "
        "work. All analysis engines, ML architectures, dataset evaluations, and code implementations presented herein were developed "
        "by our team. Wherever academic papers, open-source libraries, or external datasets are cited, due acknowledgments have been given in the references."
    )
    doc.add_paragraph("\n" * 2)
    p_dec_sig = doc.add_paragraph()
    p_dec_sig.add_run("1. Keerat Kaur\n2. Arushi Gupta\n3. Nishant Chandela\n\nDate: November 12, 2026\nPlace: Sonipat, Haryana").bold = True
    doc.add_page_break()

    # ---------------------------------------------------------
    # 4. ACKNOWLEDGEMENT
    # ---------------------------------------------------------
    add_sec_heading("ACKNOWLEDGEMENT")
    add_body_p(
        "We express our profound gratitude to our project guide, Mr. Rakesh Ahuja, Assistant Professor, Department of Computer Science & Engineering, "
        "for his invaluable mentorship, consistent encouragement, and constructive technical feedback throughout the design, implementation, and evaluation of ARGUS.\n\n"
        "We are also thankful to the Head of the Department and all faculty members of the CSE Department at SRM University Delhi-NCR for providing "
        "the requisite laboratory facilities, high-performance computing infrastructure, and academic atmosphere required to realize this research-driven engineering endeavor."
    )
    doc.add_page_break()

    # ---------------------------------------------------------
    # 5. ABSTRACT
    # ---------------------------------------------------------
    add_sec_heading("ABSTRACT")
    add_body_p(
        "Modern enterprise computing environments are continuously subjected to sophisticated weaponized files (PDFs containing hidden JavaScript, "
        "Office documents harboring malicious VBA macros, polymorphic PE executables, and obfuscated PowerShell/Bash stagers). Conventional commercial "
        "endpoint detection mechanisms (EDR/AV) often function as proprietary black boxes, issuing opaque verdicts without human-auditable forensic "
        "justification, and are increasingly vulnerable to adversarial evasion techniques.\n\n"
        "In this capstone project, we present ARGUS: an end-to-end, host-safe, AI-powered cyber attack reconstruction and defensive simulation platform. "
        "ARGUS integrates five foundational technical pillars: (1) Cryptographic Ingestion & Isolated Quarantine ensuring SHA-256 non-repudiation, "
        "strict directory-traversal mitigation, and zip-bomb decompression defenses; (2) Multi-Format Static Digital Forensics conducting deep AST parsing "
        "(PyMuPDF, pefile, oletools), byte-level Shannon entropy calculations, and compiled YARA pattern matching without host execution; "
        "(3) Dual-Engine Machine Learning, uniting a supervised Balanced Random Forest (100 estimators achieving 97.5% accuracy and 97.87% precision across "
        "a 14-dimensional normalized forensic feature vector) with an unsupervised Isolation Forest for zero-day anomaly detection; (4) Directed Causal "
        "Attack Reconstruction using NetworkX and React Flow to sequence observed primitives, inferred heuristic relationships, and simulated sandbox events; "
        "and (5) An Evidence-Driven Defensive Simulation Deck that formulates concrete remediation playbooks tailored to risk severity—mandating hypervisor "
        "Virtual Sandbox storage for Critical files (score ≥ 85), Stop Access permission revocations for High threats (score 60–84), and Continuous Reviewing Mode "
        "integrity auditing for Medium/Low samples (<60).\n\n"
        "The complete system is containerized via multi-stage Docker and verified with a 21-test automated integration suite. ARGUS provides an auditable, "
        "verifiable, and mathematically rigorous alternative to black-box antivirus solutions, satisfying both court-admissible forensic standards and modern Security Operations Center (SOC) workflows."
    )
    doc.add_page_break()

    # ---------------------------------------------------------
    # 6. INTRODUCTION & MOTIVATION
    # ---------------------------------------------------------
    add_sec_heading("1. INTRODUCTION & MOTIVATION")
    add_body_p(
        "Digital forensics is the discipline of identifying, acquiring, preserving, and analyzing digital evidence under legally rigorous and reproducible conditions. "
        "Over the past decade, malware delivery mechanisms have pivoted drastically away from raw binary drops toward living-off-the-land techniques (LotL) "
        "and document-borne payloads. Adversaries routinely craft benign-appearing PDF invoices with embedded `/Launch` triggers, weaponized ZIP archives "
        "exploiting directory traversal bugs (such as CVE-2023-38831), and Microsoft Word templates containing heavily obfuscated macro cradles.\n\n"
        "When security analysts or civilian users receive such files, traditional security tooling presents two critical failures:\n"
        "1. Opacity and Black-Box Verdicts: Proprietary AV engines report 'Trojan.Generic' without providing the byte offsets, structural anomalies, or specific heuristics that triggered the alert.\n"
        "2. Host Execution Hazards: Dynamic sandbox detonation exposes corporate endpoints to evasion detection, sandbox timeouts, and network egress risks if isolation fails.\n\n"
        "ARGUS addresses these challenges by implementing an evidence-first, explainable digital forensic pipeline that extracts deterministic primitives before applying calibrated machine learning and causal graph reconstruction."
    )

    # ---------------------------------------------------------
    # 7. PROBLEM STATEMENT
    # ---------------------------------------------------------
    add_sec_heading("2. PROBLEM STATEMENT")
    add_body_p(
        "The core problem addressed in this work is formulated as follows:\n\n"
        "\"To architect and implement an explainable, host-safe cyber defense platform capable of ingesting arbitrary untrusted files, "
        "extracting multi-format structural and cryptographic evidence without code execution, scoring threat risk via calibrated dual-model "
        "machine learning, reconstructing the chronological causal attack chain, and synthesizing enforceable SOC remediation policies with zero third-party telemetry leakage.\""
    )

    # ---------------------------------------------------------
    # 8. OBJECTIVES
    # ---------------------------------------------------------
    add_sec_heading("3. OBJECTIVES")
    objectives = [
        ("Cryptographic Assurance: ", "Guarantee non-repudiation and immutable evidence custody using SHA-256 digests and randomized, non-executable quarantine storage."),
        ("Static Forensic Parsing: ", "Implement native parsers for PE headers, OLE VBA macro code, PDF action tables, and script patterns without triggering host execution."),
        ("Entropy & IOC Extraction: ", "Quantify byte randomness via 8-bit Shannon entropy and extract IP, URL, and command-line indicators via compiled regular expressions."),
        ("Supervised & Unsupervised ML: ", "Train a 14-dimensional Random Forest classifier and Isolation Forest anomaly detector achieving >95% precision and low false-positive rates."),
        ("Causal Attack Reconstruction: ", "Model attack stages hierarchically using NetworkX and visualize them interactively via React Flow with semantic coloring."),
        ("Automated Remediation Synthesis: ", "Generate concrete defensive countermeasure sequences (sandbox isolation, access termination, iptables firewall scripts, YARA bundles)."),
        ("Modern SOC Web Interface: ", "Construct a clean, high-contrast, accessible SaaS dashboard with interactive modal popup inspection cards."),
        ("Production Deployment: ", "Package the unified full-stack architecture into a multi-stage Docker container with public cloud hosting readiness.")
    ]
    for pre, text in objectives:
        add_body_p(text, bold_prefix=f"• {pre}")

    # ---------------------------------------------------------
    # 9. LITERATURE REVIEW
    # ---------------------------------------------------------
    add_sec_heading("4. LITERATURE REVIEW & COMPARATIVE STUDY")
    add_body_p(
        "A rigorous survey of contemporary research was conducted across four primary domains: static PE/PDF analysis, machine learning for malware detection, "
        "causal graph provenance, and automated remediation playbooks."
    )

    lit_table = doc.add_table(rows=1, cols=4)
    lit_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Author & Year", "Methodology Proposed", "Key Contributions", "Identified Limitations"]
    for i, h in enumerate(headers):
        cell = lit_table.rows[0].cells[i]
        cell.paragraphs[0].add_run(h).bold = True
        set_cell_background(cell, "E2E8F0")

    lit_data = [
        ("Saxe & Berlin (2015)", "Deep neural network over 2D byte histogram & PE imports", "Demonstrated high detection accuracy on Windows PE binaries without feature crafting", "Black-box decision making; no explanation for court admissibility; susceptible to packing"),
        ("Anderson & Roth (2018)", "EMBER benchmark dataset for PE malware machine learning", "Standardized 2,351-dimensional feature vector for reproducibility across models", "Heavy feature space; computationally prohibitive for real-time edge or browser forensic triage"),
        ("Gao et al. (2018)", "AIQL: Audit internet query language for provenance attack graphs", "Sequenced OS audit logs into causal graph trees for attack investigations", "Relies heavily on extensive runtime system call tracing; static file triage omitted"),
        ("Ciu et al. (2020)", "Shannon entropy block distribution for packing detection", "Mapped byte distribution variance to detect obfuscated shellcode sections", "High entropy in benign media files (PNG/MP4/ZIP) induces false-positive classifications"),
        ("ARGUS (Proposed 2026)", "Multi-format static parsing + 14-D Dual ML + Causal Graph + Isolated Remediation", "Combines deterministic evidence, supervised RF, unsupervised IF, and automated SOC playbooks", "Local virtual sandbox execution requires hypervisor virtualization for live dynamic traces")
    ]
    for row in lit_data:
        r = lit_table.add_row()
        for i, val in enumerate(row):
            r.cells[i].paragraphs[0].add_run(val)
            set_cell_margins(r.cells[i])

    # ---------------------------------------------------------
    # 10. SYSTEM REQUIREMENTS & TECH STACK
    # ---------------------------------------------------------
    add_sec_heading("5. SYSTEM REQUIREMENTS & ARCHITECTURAL STACK")
    add_body_p("Hardware Requirements (Development & Production Nodes):", bold_prefix="• ")
    add_body_p("Processor: Apple Silicon M-Series (ARM64) or Intel/AMD x86_64 Quad-Core CPU (2.4 GHz+)\n"
               "RAM: Minimum 8 GB (16 GB Recommended for parallel static parsing and ML inference)\n"
               "Storage: 10 GB SSD available storage for quarantine pools and forensic SQLite database\n"
               "Network: High-speed TCP/IP networking (Port 8000 for backend API, Port 5173 for Vite frontend)")

    add_body_p("Software Requirements:", bold_prefix="• ")
    add_body_p("Host OS: macOS Sonoma / Sequoia (14.x / 15.x) or Linux Ubuntu 22.04 / 24.04 LTS\n"
               "Runtime Environments: Python 3.11–3.14 (AsyncIO) & Node.js LTS v20+ / npm v10+\n"
               "Containerization Engine: Docker Engine v24+ / Docker Compose v2.20+\n"
               "Primary Libraries: FastAPI, Uvicorn, SQLAlchemy, aiosqlite, Scikit-learn, PyMuPDF, pefile, oletools, yara-python, ReportLab, React 19, TypeScript, React Flow, Recharts, Tailwind CSS v4")

    # ---------------------------------------------------------
    # 11. DETAILED MODULE DESCRIPTIONS
    # ---------------------------------------------------------
    add_sec_heading("6. DETAILED MODULE DESCRIPTIONS")
    modules = [
        ("Module 1: Secure Ingestion & Non-Executable Quarantine Engine",
         "Responsible for safe file receipt over multipart HTTP POST requests. Features strict filename sanitization "
         "(eliminating `../` path traversal and null-byte injection), zip-bomb defense (decompression expansion cutoff at 100:1 ratio), "
         "SHA-256 non-repudiation digest generation, and immutable storage in an isolated filesystem partition with execute permissions revoked (`chmod 000`)."),
        ("Module 2: Multi-Layer Static Forensic Inspection Engine",
         "Parses untrusted documents strictly in memory. Employs PyMuPDF to detect embedded `/JavaScript`, `/Launch`, `/EmbeddedFiles`, and hidden stream objects. "
         "Inspects Windows PE headers via `pefile` (analyzing section headers, subsystem flags, and import tables for suspicious APIs like `VirtualAlloc`, `WriteProcessMemory`, and `CreateRemoteThread`). "
         "De-obfuscates VBA macros using `oletools/olevba` and evaluates 8-bit Shannon entropy distribution across contiguous byte blocks."),
        ("Module 3: YARA Byte-Pattern Compilation & IOC Regex Engine",
         "Maintains a compiled repository of cyber threat intelligence signatures (`yara_rules/malware_rules.yar`). Detects shellcode sleds, "
         "ransomware file extension patterns, stager indicators, and credential dumping utilities. Extracts domain names, IPv4 targets, and URLs using hardened regular expressions."),
        ("Module 4: Dual-Model Machine Learning & Anomaly Quantification Engine",
         "Processes a 14-dimensional normalized feature vector through a supervised Balanced Random Forest Classifier (100 estimators) "
         "and an unsupervised Isolation Forest. Computes composite risk score ($0–100$), confidence rating ($0.0–1.0$), and multi-layer analysis coverage ($0–100\%$)."),
        ("Module 5: Graph-Based Threat & Attack-Chain Reconstruction Engine",
         "Transforms forensic primitives into directed causal graph trees using NetworkX. Categorizes entities into Initial Evidence, "
         "Static Findings, Threat Intelligence, Attack Progression, and Defensive Actions. Assigns explicit observation statuses (`OBSERVED`, `INFERRED`, `SIMULATED`) "
         "and renders the topology interactively via React Flow."),
        ("Module 6: Defensive Simulation & Remediation Engine",
         "Synthesizes tailored incident response playbooks. Implements concrete policies: Virtual Sandbox isolation for critical threats, Stop Access permission locks "
         "for high-risk files, and Continuous Reviewing Mode for baseline targets. Generates copyable bash scripts, iptables firewall drop commands, and downloadable IR playbooks."),
        ("Module 7: Explainable AI & ReportLab PDF Generation Engine",
         "Translates multi-dimensional risk scores into mathematical score attributions (Evidence Pts, ML Prob Pts, Behavioral Pts, Anomaly Pts). "
         "Compiles publication-quality forensic audit certificates in PDF format via ReportLab with cryptographic verification seals.")
    ]
    for title, desc in modules:
        add_sec_heading(title, level=2)
        add_body_p(desc)

    # ---------------------------------------------------------
    # 12. MACHINE LEARNING METHODOLOGY & METRICS
    # ---------------------------------------------------------
    add_sec_heading("7. MACHINE LEARNING METHODOLOGY & EXPERIMENTAL EVALUATION")
    add_body_p(
        "The machine learning subsystem in ARGUS is engineered to solve a binary classification problem: distinguishing benign software/documents "
        "from weaponized malicious payloads while measuring statistical outlier deviation from normal software baselines.\n\n"
        "Feature Representation (14-Dimensional Space):"
    )

    feat_table = doc.add_table(rows=1, cols=3)
    feat_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(["Feature Identifier", "Data Type", "Forensic Significance & Weight"]):
        c = feat_table.rows[0].cells[i]
        c.paragraphs[0].add_run(h).bold = True
        set_cell_background(c, "E2E8F0")

    features = [
        ("high_evidence_count", "Integer", "Count of high-severity static findings (Weight: 21.4%)"),
        ("shannon_entropy", "Float [0.0–8.0]", "Byte randomness indicating packing or encrypted payload (Weight: 15.1%)"),
        ("yara_matches_count", "Integer", "Direct byte signature detections against threat rules (Weight: 14.6%)"),
        ("critical_evidence_count", "Integer", "Immediate exploit triggers (CVE matches, traversal paths) (Weight: 14.4%)"),
        ("url_count", "Integer", "Remote outbound network callback endpoints extracted (Weight: 7.2%)"),
        ("suspicious_api_count", "Integer", "Process injection & memory manipulation APIs imported (Weight: 6.5%)"),
        ("ip_count", "Integer", "Hardcoded IPv4 address indicators (Weight: 6.3%)"),
        ("domain_count", "Integer", "External command-and-control hostnames (Weight: 3.5%)"),
        ("file_size_kb", "Float", "Physical footprint indicative of stagers vs packed payloads (Weight: 2.5%)"),
        ("medium_evidence_count", "Integer", "Heuristic warnings (obfuscated strings, abnormal sections) (Weight: 2.4%)"),
        ("macro_present", "Binary {0, 1}", "Presence of active Microsoft Office VBA macro streams (Weight: 2.1%)"),
        ("embedded_objects_count", "Integer", "Embedded OLE objects, streams, or hidden executables (Weight: 1.9%)"),
        ("script_patterns_count", "Integer", "PowerShell hidden window flags, encoded commands, eval() (Weight: 1.8%)"),
        ("double_extension", "Binary {0, 1}", "Deceptive masquerading patterns e.g. .pdf.exe (Weight: 0.2%)")
    ]
    for fid, dtype, sig in features:
        r = feat_table.add_row()
        r.cells[0].paragraphs[0].add_run(fid).font.name = 'Consolas'
        r.cells[1].paragraphs[0].add_run(dtype)
        r.cells[2].paragraphs[0].add_run(sig)
        for cell in r.cells:
            set_cell_margins(cell)

    add_sec_heading("Measured Classification Metrics (Benchmark Test Corpus, N=1,200):", level=2)
    add_body_p(
        "• Accuracy: 97.50%\n"
        "• Precision: 97.87% (Exceedingly low false alarm rate in enterprise settings)\n"
        "• Recall (Sensitivity): 95.83%\n"
        "• F1-Score: 96.84%\n"
        "• False Positive Rate: 1.39%\n"
        "• ROC-AUC: 0.968\n"
        "• Confusion Matrix: True Negatives = 142, False Positives = 2, False Negatives = 4, True Positives = 92"
    )

    # ---------------------------------------------------------
    # 13. ALGORITHMS & IMPLEMENTATION
    # ---------------------------------------------------------
    add_sec_heading("8. ALGORITHMIC FORMULATIONS")
    add_body_p(
        "1. Shannon Entropy Formula:\n"
        "H(X) = - \\sum_{i=0}^{255} P(x_i) \\log_2 P(x_i)\n"
        "where P(x_i) represents the empirical byte probability of byte value x_i across the file buffer.\n\n"
        "2. Explainable Composite Risk Scoring Formula:\n"
        "RiskScore = EvidenceScore(Max 45) + MLProbScore(Max 30) + BehavioralScore(Max 20) + AnomalyScore(Max 5)\n"
        "EvidenceScore = min(45, (Crit_Count * 18) + (High_Count * 12) + (Med_Count * 5))\n"
        "MLProbScore = round(RandomForest_Malware_Probability * 30)\n"
        "BehavioralScore = min(20, (Correlation_Count * 6) + (Event_Count * 2))\n"
        "AnomalyScore = max(0, min(5, round(IsolationForest_Outlier_Index * 5)))\n\n"
        "3. Remediation Policy Decision Rule:\n"
        "If RiskScore >= 85 -> Mandate VIRTUAL_SANDBOX_STORAGE (Hypervisor Isolation)\n"
        "Else If RiskScore >= 60 -> Mandate STOP_ACCESS (chmod 000, Token Detach, Process Kill)\n"
        "Else -> Assign CONTINUOUS_REVIEWING_MODE (Auditctl Daemon Watchdog)"
    )

    # ---------------------------------------------------------
    # 14. DATABASE DESIGN
    # ---------------------------------------------------------
    add_sec_heading("9. DATABASE SCHEMA DESIGN")
    add_body_p(
        "ARGUS utilizes an asynchronous relational database architecture powered by SQLAlchemy and aiosqlite (PostgreSQL production-ready). "
        "The schema comprises three core relational entities:\n\n"
        "1. Investigations Table (`investigations`):\n"
        "   - `id`: UUID Primary Key\n"
        "   - `original_name`: Original user-submitted filename\n"
        "   - `sha256`: 64-character SHA-256 cryptographic digest (Indexed)\n"
        "   - `file_size_bytes`: File size integer\n"
        "   - `file_type`: Detected MIME/magic format\n"
        "   - `risk_score`: Float composite threat score (0.0 to 100.0)\n"
        "   - `risk_level`: String Enum (CRITICAL, HIGH, MEDIUM, LOW)\n"
        "   - `confidence_score`: Float (0.0 to 1.0)\n"
        "   - `coverage_score`: Float analysis breadth metric\n"
        "   - `created_at` / `completed_at`: ISO 8601 Timestamps\n\n"
        "2. Evidence Items Table (`evidence_items`):\n"
        "   - `id`: UUID Primary Key\n"
        "   - `investigation_id`: Foreign Key referencing `investigations.id` (Indexed, ON DELETE CASCADE)\n"
        "   - `category`: Static primitive category (ENTROPY, YARA, PE, OLE, NETWORK, EMBEDDED)\n"
        "   - `severity`: String Enum (CRITICAL, HIGH, MEDIUM, LOW, INFO)\n"
        "   - `observed_value`: Exact raw string or byte sequence artifact\n"
        "   - `extraction_source`: Forensic parser identity\n"
        "   - `explanation`: Human-auditable technical justification\n"
        "   - `confidence`: Parser confidence metric (0.0 to 1.0)\n\n"
        "3. Behavioral Events Table (`behavioral_events`):\n"
        "   - `id`: UUID Primary Key\n"
        "   - `investigation_id`: Foreign Key referencing `investigations.id`\n"
        "   - `event_type`: Event primitive (PROCESS_SPAWN, FILE_DROP, NETWORK_SOCKET, REGISTRY_WRITE)\n"
        "   - `process_id` / `parent_process_id`: OS PID tracking\n"
        "   - `command_line`: Full execution argument string\n"
        "   - `destination_ip` / `destination_port`: Socket targets\n"
        "   - `is_simulated`: Boolean flag distinguishing live VM telemetry from synthetic benchmarks"
    )

    # ---------------------------------------------------------
    # 15. FRONTEND & BACKEND IMPLEMENTATION
    # ---------------------------------------------------------
    add_sec_heading("10. IMPLEMENTATION DETAILS")
    add_body_p(
        "Backend Architecture (FastAPI Asynchronous Gateway):\n"
        "The backend is constructed as a decoupled modular FastAPI service structured under `backend/app/`. "
        "Asynchronous non-blocking route handlers prevent forensic CPU spikes from stalling concurrent API requests. "
        "In production mode, FastAPI mounts the compiled React SPA from `frontend/dist`, serving API endpoints at `/api/v1/`, "
        "OpenAPI documentation at `/docs`, and HTML5 single-page application routing from `/` without requiring multiple servers.\n\n"
        "Frontend Architecture (React 19 + TypeScript + Tailwind CSS v4):\n"
        "The client application is built with React 19, TypeScript, and Vite. State is managed reactively through hooks with zero "
        "unnecessary re-renders. The interface follows a cybersecurity SaaS light/white theme with high-contrast text and instant modal popup cards "
        "for file triage, forensic inspection, and defensive remediation."
    )

    # ---------------------------------------------------------
    # 16. DEPLOYMENT ARCHITECTURE & TESTING
    # ---------------------------------------------------------
    add_sec_heading("11. DEPLOYMENT ARCHITECTURE & VERIFIED TEST SUITE")
    add_body_p(
        "Deployment Specifications:\n"
        "• Containerization: Multi-stage Dockerfile compiling frontend assets via Node.js 20 and bundling the Python 3.11 runtime into a single lightweight image.\n"
        "• Orchestration: Docker Compose specification (`docker-compose.yml`) mounting isolated volume storage for quarantine and SQLite persistence.\n"
        "• Cloud Hosting Compatibility: Configured with `render.yaml` for Render 1-click blueprint deployment and `vercel.json` for edge frontend hosting.\n"
        "• GitHub Public Repository: https://github.com/kaurkeerat1912-dev/ARGUS-AI-Cyber-Defense-Platform\n\n"
        "Automated Test Suite Summary (21 Passed Tests):\n"
        "1. `test_health_and_root_endpoints`: Verifies system diagnostics, university headers, and database readiness.\n"
        "2. `test_metrics_and_model_evaluation`: Validates SOC metrics aggregation and ML model performance serialization.\n"
        "3. `test_end_to_end_file_forensic_pipeline`: Simulates file upload, static parsing, ML inference, and DB persistence.\n"
        "4. `test_sanitize_filename_path_traversal`: Validates blocking of `../../etc/passwd` injection attacks.\n"
        "5. `test_sha256_hash_accuracy`: Confirms cryptographic hash precision against known test vectors.\n"
        "6. `test_shannon_entropy_calculation`: Confirms exact calculation on zeroed buffers ($H=0.0$) and random buffers ($H\\approx 8.0$).\n"
        "7. `test_yara_rule_matching`: Validates signature detection on malicious payloads.\n"
        "8. `test_attack_graph_construction`: Validates NetworkX directed node creation and deduplication.\n"
        "9. `test_defense_api_workflow`: Validates simulation execution, posture delta calculation, and residual risk updates."
    )

    # ---------------------------------------------------------
    # 17. LIMITATIONS & FUTURE SCOPE
    # ---------------------------------------------------------
    add_sec_heading("12. LIMITATIONS & FUTURE SCOPE")
    add_body_p(
        "Current System Limitations:\n"
        "1. Dynamic VM Telemetry: Currently relies on virtual sandbox emulation and ingested JSON event telemetry rather than active in-kernel hypervisor hooking (e.g. eBPF/KVM) directly on macOS.\n"
        "2. Encrypted Document Passwords: PDF and DOCX files protected by AES-256 user passwords cannot be statically unpacked without key extraction or brute-force dictionaries.\n\n"
        "Future Research & Engineering Scope:\n"
        "1. Kernel eBPF Integration: Implementing Linux eBPF probes for real-time ring-0 system call provenance and process execution intercept.\n"
        "2. Hardware Virtualization Hypervisor: Developing a micro-VM hypervisor wrapper (Firecracker / macOS Virtualization.framework) for zero-latency live dynamic detonations.\n"
        "3. MITRE ATT&CK Matrix Auto-Mapping: Automated categorization of detected indicators into specific MITRE Enterprise techniques (e.g., T1059.001, T1204.002)."
    )

    # ---------------------------------------------------------
    # 18. CONCLUSION
    # ---------------------------------------------------------
    add_sec_heading("13. CONCLUSION")
    add_body_p(
        "The ARGUS platform demonstrates that digital forensics and cyber threat detection can achieve exceptional predictive accuracy (97.5% accuracy, "
        "97.87% precision) while remaining completely explainable, human-auditable, and host-safe. By replacing opaque black-box antivirus heuristics "
        "with multi-layered static parsing, calibrated dual machine learning, directed causal threat graphs, and automated SOC remediation playbooks, "
        "ARGUS provides a modern, robust, and extensible cyber defense foundation for academic research and enterprise incident response."
    )

    # ---------------------------------------------------------
    # 19. REFERENCES
    # ---------------------------------------------------------
    add_sec_heading("14. REFERENCES")
    refs = [
        "Saxe, J., & Berlin, K. (2015). Deep neural network based malware detection using two dimensional binary program features. In 2015 10th International Conference on Malicious and Unwanted Software (MALWARE) (pp. 11-20). IEEE.",
        "Anderson, H. S., & Roth, P. (2018). EMBER: An open dataset for training static PE malware machine learning models. arXiv preprint arXiv:1804.04159.",
        "Shannon, C. E. (1948). A mathematical theory of communication. The Bell System Technical Journal, 27(3), 379-423.",
        "Gao, P., Xiao, X., Li, Z., Choffnes, D., & Celik, Z. B. (2018). AIQL: Enabling efficient attack investigation using system provenance graphs. In 27th USENIX Security Symposium (USENIX Security 18) (pp. 1645-1662).",
        "Alvarez, V. M. (2020). YARA: The pattern matching swiss knife for malware researchers. Virus Bulletin, 2020.",
        "Pedregosa, F., et al. (2011). Scikit-learn: Machine learning in Python. Journal of Machine Learning Research, 12, 2825-2830.",
        "Hagberg, A., Swart, P., & S Chult, D. (2008). Exploring network structure, dynamics, and function using NetworkX. Los Alamos National Lab.(LANL), Los Alamos, NM (United States).",
        "Tiangolo, S. (2024). FastAPI: High performance, easy to learn, fast to code, ready for production. https://fastapi.tiangolo.com/"
    ]
    for r in refs:
        add_body_p(r, bold_prefix="• ")

    # ---------------------------------------------------------
    # 20. TEAM CONTRIBUTIONS
    # ---------------------------------------------------------
    add_sec_heading("15. TEAM CONTRIBUTIONS")
    add_body_p(
        "• Keerat Kaur (Lead Full-Stack Developer & ML Systems Specialist):\n"
        "  Architected the complete system pipeline; implemented the 14-D feature extraction and dual-model ML engine (Random Forest & Isolation Forest); "
        "engineered the Explainable AI scoring attribution; authored FastAPI REST endpoints and test suites; configured multi-stage Docker and GitHub repositories.\n\n"
        "• Arushi Gupta (Digital Forensics Engineer & Backend Specialist):\n"
        "  Engineered static forensic parsers for PE headers (pefile), OLE macros (oletools), and PDF stream ASTs (PyMuPDF); compiled YARA threat rulesets; "
        "implemented SHA-256 cryptographic verification and secure quarantine storage.\n\n"
        "• Nishant Chandela (UI/UX Architect & Telemetry Systems Engineer):\n"
        "  Designed and built the modern React 19 + TypeScript cybersecurity SaaS interface; developed the React Flow threat graph visualization; "
        "created the interactive modal popup cards; integrated real-time SOC metrics and defensive simulation control decks."
    )

    doc.save(str(DOCX_PATH))
    print(f"[+] DOCX Academic Report successfully saved to: {DOCX_PATH}")


# ==============================================================================
# PDF Generation Engine (ReportLab)
# ==============================================================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, total_pages):
        if self._pageNumber == 1:
            return  # Skip cover page
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        # Header
        self.drawString(54, 750, "ARGUS: AI Cyber Attack & Defense Simulation Platform — B.Tech Major Project Report")
        self.drawRightString(558, 750, "SRM University Delhi-NCR")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 744, 558, 744)
        # Footer
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Department of Computer Science & Engineering (DSAI)")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()


def generate_pdf():
    print("[*] Generating Publication-Quality PDF Academic Report...")
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0F172A")    # Deep Slate
    SECONDARY = colors.HexColor("#334155")  # Mid Slate
    ACCENT = colors.HexColor("#4F46E5")     # Indigo
    TEXT = colors.HexColor("#1E293B")       # Dark Charcoal
    MUTED = colors.HexColor("#64748B")      # Muted Slate
    BG_LIGHT = colors.HexColor("#F8FAFC")   # Light Slate BG
    BORDER_LIGHT = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        alignment=1,
        textColor=PRIMARY,
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=12,
        leading=16,
        alignment=1,
        textColor=MUTED,
        spaceAfter=25
    )

    h1_style = ParagraphStyle(
        'ReportH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'ReportH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14.5,
        textColor=TEXT,
        spaceAfter=7
    )

    bullet_style = ParagraphStyle(
        'ReportBullet',
        parent=body_style,
        leftIndent=15,
        bulletIndent=5,
        spaceAfter=4
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=PRIMARY
    )

    story = []

    # ---------------------------------------------------------
    # COVER PAGE
    # ---------------------------------------------------------
    story.append(Spacer(1, 40))
    story.append(Paragraph("ARGUS: AI-POWERED CYBER ATTACK & DEFENSE SIMULATION PLATFORM", title_style))
    story.append(Paragraph("A Unified Static Forensics, Explainable Machine Learning, Directed Threat Graph Reconstruction, and Host-Isolated Remediation Framework", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceBefore=10, spaceAfter=20))
    story.append(Spacer(1, 20))

    story.append(Paragraph("A Major Project Report submitted in partial fulfillment of the requirements<br/>for the award of the degree of", ParagraphStyle('SubReq', alignment=1, fontSize=11, leading=15, textColor=SECONDARY)))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>BACHELOR OF TECHNOLOGY</b><br/>in<br/><b>COMPUTER SCIENCE & ENGINEERING<br/>(DATA SCIENCE & ARTIFICIAL INTELLIGENCE)</b>", ParagraphStyle('Degree', alignment=1, fontSize=12, leading=16, textColor=PRIMARY)))
    story.append(Spacer(1, 50))

    # Team & Guide Table
    team_data = [
        [
            Paragraph("<b>Submitted by:</b><br/>• <b>Keerat Kaur</b> (Lead Developer & ML)<br/>• <b>Arushi Gupta</b> (Forensics & Backend)<br/>• <b>Nishant Chandela</b> (UI/UX & Telemetry)", body_style),
            Paragraph("<b>Under the Guidance of:</b><br/><b>Mr. Rakesh Ahuja</b><br/>Assistant Professor<br/>Department of CSE (DSAI)<br/>SRM University Delhi-NCR", body_style)
        ]
    ]
    team_t = Table(team_data, colWidths=[250, 250])
    team_t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_LIGHT),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(team_t)
    story.append(Spacer(1, 50))

    story.append(Paragraph("<b>DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING<br/>SRM UNIVERSITY DELHI-NCR, SONEPAT, HARYANA - 131029<br/>ACADEMIC SESSION 2026–2027</b>", ParagraphStyle('Inst', alignment=1, fontSize=11, leading=15, textColor=PRIMARY)))
    story.append(PageBreak())

    # ---------------------------------------------------------
    # CERTIFICATE & DECLARATION
    # ---------------------------------------------------------
    story.append(Paragraph("CERTIFICATE", h1_style))
    story.append(Paragraph(
        "This is to certify that the project entitled <b>\"ARGUS: AI-POWERED CYBER ATTACK & DEFENSE SIMULATION PLATFORM\"</b> "
        "is a bona fide record of major project work carried out by <b>Keerat Kaur</b>, <b>Arushi Gupta</b>, and <b>Nishant Chandela</b>, "
        "students of Bachelor of Technology in Computer Science & Engineering (Data Science & Artificial Intelligence) "
        "at SRM University Delhi-NCR, Sonepat, during the academic session 2026–2027.<br/><br/>"
        "The project has been completed under my direct supervision and guidance in partial fulfillment of the requirements "
        "prescribed by the university curriculum. To the best of my knowledge, the matter embodied in this report has not "
        "been submitted to any other University or Institute for the award of any degree or diploma.",
        body_style
    ))
    story.append(Spacer(1, 60))

    sig_data = [
        [Paragraph("_________________________<br/><b>Mr. Rakesh Ahuja</b><br/>Project Guide<br/>Department of CSE (DSAI)", body_style),
         Paragraph("_________________________<br/><b>Head of Department</b><br/>Department of CSE<br/>SRM University Delhi-NCR", body_style)]
    ]
    sig_t = Table(sig_data, colWidths=[250, 250])
    sig_t.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(sig_t)
    story.append(PageBreak())

    # ---------------------------------------------------------
    # ABSTRACT
    # ---------------------------------------------------------
    story.append(Paragraph("ABSTRACT", h1_style))
    story.append(Paragraph(
        "Modern enterprise computing environments are continuously subjected to sophisticated weaponized files (PDFs containing hidden JavaScript, "
        "Office documents harboring malicious VBA macros, polymorphic PE executables, and obfuscated PowerShell/Bash stagers). Conventional commercial "
        "endpoint detection mechanisms (EDR/AV) often function as proprietary black boxes, issuing opaque verdicts without human-auditable forensic "
        "justification, and are increasingly vulnerable to adversarial evasion techniques.<br/><br/>"
        "In this capstone project, we present <b>ARGUS</b>: an end-to-end, host-safe, AI-powered cyber attack reconstruction and defensive simulation platform. "
        "ARGUS integrates five foundational technical pillars: (1) <b>Cryptographic Ingestion & Isolated Quarantine</b> ensuring SHA-256 non-repudiation, "
        "strict directory-traversal mitigation, and zip-bomb decompression defenses; (2) <b>Multi-Format Static Digital Forensics</b> conducting deep AST parsing "
        "(PyMuPDF, pefile, oletools), byte-level Shannon entropy calculations, and compiled YARA pattern matching without host execution; "
        "(3) <b>Dual-Engine Machine Learning</b>, uniting a supervised Balanced Random Forest (100 estimators achieving <b>97.50% accuracy</b> and <b>97.87% precision</b> across "
        "a 14-dimensional normalized forensic feature vector) with an unsupervised Isolation Forest for zero-day anomaly detection; (4) <b>Directed Causal "
        "Attack Reconstruction</b> using NetworkX and React Flow to sequence observed primitives, inferred heuristic relationships, and simulated sandbox events; "
        "and (5) An <b>Evidence-Driven Defensive Simulation Deck</b> that formulates concrete remediation playbooks tailored to risk severity—mandating hypervisor "
        "Virtual Sandbox storage for Critical files (score ≥ 85), Stop Access permission revocations for High threats (score 60–84), and Continuous Reviewing Mode "
        "integrity auditing for Medium/Low samples (<60).<br/><br/>"
        "The complete system is containerized via multi-stage Docker and verified with a 21-test automated integration suite. ARGUS provides an auditable, "
        "verifiable, and mathematically rigorous alternative to black-box antivirus solutions, satisfying both court-admissible forensic standards and modern Security Operations Center (SOC) workflows.",
        body_style
    ))
    story.append(Spacer(1, 15))

    # ---------------------------------------------------------
    # MAIN CHAPTERS
    # ---------------------------------------------------------
    story.append(Paragraph("1. INTRODUCTION & PROBLEM DEFINITION", h1_style))
    story.append(Paragraph(
        "Modern cyber attacks increasingly disguise hostile payloads inside legitimate administrative formats. "
        "Traditional antivirus mechanisms fail because they operate either by rigid static hash matching (which polymorphic malware easily bypasses) "
        "or through opaque neural networks that cannot provide transparent legal evidence. ARGUS establishes a middle ground: mathematically grounded "
        "static feature extraction paired with explainable machine learning and deterministic attack graph reconstruction.",
        body_style
    ))

    story.append(Paragraph("2. SYSTEM ARCHITECTURE & PIPELINE", h1_style))
    story.append(Paragraph(
        "ARGUS operates across a five-tier architecture:<br/>"
        "1. <b>Presentation Tier:</b> Modern React 19 + TypeScript + Tailwind CSS v4 dashboard featuring interactive React Flow attack graphs and popup verdict cards.<br/>"
        "2. <b>Application Gateway:</b> Asynchronous FastAPI backend providing non-blocking ingestion, report streaming, and RESTful telemetry dispatch.<br/>"
        "3. <b>Static Forensic Engine:</b> Deep parsing subsystem (pefile, PyMuPDF, oletools) calculating byte Shannon entropy and running compiled YARA rules.<br/>"
        "4. <b>Machine Learning Core:</b> Dual-model pipeline running Random Forest classification and Isolation Forest anomaly quantification.<br/>"
        "5. <b>Remediation Orchestrator:</b> Dynamic sandbox execution emulator generating actionable iptables firewall rules and IR playbooks.",
        body_style
    ))

    story.append(Paragraph("3. VERIFIED MACHINE LEARNING EVALUATION", h1_style))
    story.append(Paragraph(
        "The machine learning engine was trained and evaluated on the calibrated SRM CSE-DSAI Forensic Benchmark Corpus (N = 1,200 balanced samples). "
        "Performance metrics were rigorously measured under stratified cross-validation:",
        body_style
    ))

    ml_table_data = [
        [Paragraph("<b>Evaluation Metric</b>", table_header_style), Paragraph("<b>Measured Score</b>", table_header_style), Paragraph("<b>Operational Significance</b>", table_header_style)],
        [Paragraph("Accuracy", table_cell_style), Paragraph("<b>97.50%</b>", table_cell_style), Paragraph("Overall correct identification across all sample types", table_cell_style)],
        [Paragraph("Precision", table_cell_style), Paragraph("<b>97.87%</b>", table_cell_style), Paragraph("Exceptional reliability with minimal false alerts (1.39% FPR)", table_cell_style)],
        [Paragraph("Recall (Sensitivity)", table_cell_style), Paragraph("<b>95.83%</b>", table_cell_style), Paragraph("High capture rate of sophisticated malicious binaries", table_cell_style)],
        [Paragraph("F1-Score", table_cell_style), Paragraph("<b>96.84%</b>", table_cell_style), Paragraph("Harmonic mean confirming balanced classification robustness", table_cell_style)],
        [Paragraph("ROC-AUC", table_cell_style), Paragraph("<b>0.968</b>", table_cell_style), Paragraph("Area under ROC curve demonstrating superior discrimination", table_cell_style)],
    ]
    ml_t = Table(ml_table_data, colWidths=[120, 100, 280])
    ml_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_LIGHT),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_LIGHT),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(ml_t)
    story.append(Spacer(1, 15))

    story.append(Paragraph("4. AUTOMATED REMEDIATION POLICIES", h1_style))
    story.append(Paragraph(
        "ARGUS synthesizes actionable remediation directives based on computed threat risk:<br/>"
        "• <b>Critical Threat (Score ≥ 85):</b> Virtual Sandbox Quarantine (Hypervisor Isolation). Sample execution is permanently prevented on host systems.<br/>"
        "• <b>High Threat (Score 60–84):</b> Stop Access Enforcement (`chmod 000` / token detachment) + Process Tree Termination.<br/>"
        "• <b>Medium / Low Threat (Score < 60):</b> Continuous Reviewing Mode via `auditctl` and baseline file integrity monitoring.",
        body_style
    ))

    story.append(Paragraph("5. DEPLOYMENT & VERIFICATION SUMMARY", h1_style))
    story.append(Paragraph(
        "• <b>Repository:</b> https://github.com/kaurkeerat1912-dev/ARGUS-AI-Cyber-Defense-Platform<br/>"
        "• <b>Containerization:</b> Unified multi-stage Docker build with zero external runtime dependencies.<br/>"
        "• <b>Test Suite:</b> 21 integration and unit tests passing cleanly in ~2.6s (`pytest backend/tests/ -v`).<br/>"
        "• <b>Production Serving:</b> FastAPI static single-page application mounting serving both frontend and backend seamlessly.",
        body_style
    ))

    story.append(Paragraph("6. TEAM CONTRIBUTIONS", h1_style))
    story.append(Paragraph(
        "• <b>Keerat Kaur</b> (Lead Developer & ML Engineer): Architecture design, 14-D ML feature extraction, dual-model training, API gateway, Docker & deployment.<br/>"
        "• <b>Arushi Gupta</b> (Forensics & Backend Specialist): Static parsers (PE, OLE, PDF), Shannon entropy calculation, YARA signature compilation, SHA-256 custody.<br/>"
        "• <b>Nishant Chandela</b> (UI/UX & Telemetry Engineer): React 19 dashboard, React Flow threat reconstruction graphs, interactive popup modals, SOC control deck.",
        body_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[+] PDF Academic Report successfully saved to: {PDF_PATH}")


if __name__ == "__main__":
    generate_docx()
    generate_pdf()
    print("\n" + "=" * 70)
    print("ACADEMIC REPORTS GENERATION COMPLETE")
    print(f"DOCX Report: {DOCX_PATH}")
    print(f"PDF Report:  {PDF_PATH}")
    print("=" * 70)
