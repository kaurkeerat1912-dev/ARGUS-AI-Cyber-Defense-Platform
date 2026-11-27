#!/usr/bin/env python3
"""
Structured academic content for the ARGUS Major Project Report.
Follows the 8-chapter + References + Appendices A/B/C structure of the reference
SRM University Major Project Report, preserving 100% of the ARGUS topic,
architecture, empirical metrics, and team members.
"""

TEAM_MEMBERS = [
    ("Keerat Kaur", "11024210096", "B.Tech CSE (DSAI)"),
    ("Arushi Gupta", "11024210071", "B.Tech CSE (DSAI)"),
    ("Nishant Chandela", "11024210123", "B.Tech CSE (DSAI)"),
]

PROJECT_TITLE = (
    "ARGUS: AI CYBER ATTACK & DEFENSE SIMULATION PLATFORM — "
    "A GRAPH-CORRELATED AUTOMATED FORENSIC TRIAGE, MULTI-MODEL THREAT DETECTION, "
    "AND DYNAMIC MITIGATION SANDBOX ENGINE"
)
SHORT_TITLE = "ARGUS: AI Cyber Attack & Defense Simulation Platform"
REPO_URL = "https://github.com/kaurkeerat1912-dev/ARGUS-AI-Cyber-Defense-Platform"

FACULTY = {
    "supervisor": "DR. RUCHI",
    "supervisor_role": "Assistant Professor & Class In-Charge",
    "coordinator": "DR. JITENDRA KUMAR",
    "hod": "DR. RAMA KANT",
    "date_month": "NOVEMBER 2026",
    "date_full": "24th November 2026",
    "semester": "5th Semester",
    "session": "2026–2027",
}

ABBREVIATIONS = [
    ("AI", "Artificial Intelligence"),
    ("API", "Application Programming Interface"),
    ("APT", "Advanced Persistent Threat"),
    ("ASGI", "Asynchronous Server Gateway Interface"),
    ("AUC", "Area Under the Curve (ROC Analysis)"),
    ("AV", "Antivirus"),
    ("CORS", "Cross-Origin Resource Sharing"),
    ("CPU", "Central Processing Unit"),
    ("CSP", "Content Security Policy"),
    ("DAG", "Directed Acyclic Graph"),
    ("DFD", "Data Flow Diagram"),
    ("DLL", "Dynamic Link Library"),
    ("DOM", "Document Object Model"),
    ("EDR", "Endpoint Detection and Response"),
    ("EFB", "Exclusive Feature Bundling (LightGBM)"),
    ("ELF", "Executable and Linkable Format"),
    ("EMBER", "Elastic Malware Benchmark for Empowering Researchers"),
    ("ER", "Entity-Relationship"),
    ("FNR", "False Negative Rate"),
    ("FPR", "False Positive Rate"),
    ("HTTP", "Hypertext Transfer Protocol"),
    ("IAT", "Import Address Table"),
    ("IOC", "Indicator of Compromise"),
    ("JSON", "JavaScript Object Notation"),
    ("LLM", "Large Language Model"),
    ("MD5", "Message-Digest Algorithm 5"),
    ("ML", "Machine Learning"),
    ("OLE", "Object Linking and Embedding (Compound File Binary)"),
    ("OOXML", "Office Open XML"),
    ("OS", "Operating System"),
    ("PE", "Portable Executable (PE32 / PE32+)"),
    ("PDF", "Portable Document Format"),
    ("RAM", "Random Access Memory"),
    ("RBF", "Radial Basis Function (SVM Kernel)"),
    ("REST", "Representational State Transfer"),
    ("ROC", "Receiver Operating Characteristic"),
    ("SHA", "Secure Hash Algorithm (SHA-1 / SHA-256)"),
    ("SOC", "Security Operations Center"),
    ("SPA", "Single-Page Application"),
    ("SRP", "Single Responsibility Principle"),
    ("SRS", "Software Requirement Specification"),
    ("STRIDE", "Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege"),
    ("SVM", "Support Vector Machine"),
    ("UAT", "User Acceptance Testing"),
    ("UI / UX", "User Interface / User Experience"),
    ("UUID", "Universally Unique Identifier"),
    ("VBA", "Visual Basic for Applications"),
    ("WCAG", "Web Content Accessibility Guidelines"),
    ("XAI", "Explainable Artificial Intelligence"),
    ("YARA", "Yet Another Recursive Acronym (Pattern Matching Engine)"),
]

# Chapter 2 Comparative Table
TABLE_2_1 = [
    ["Evaluation Metric", "Traditional Antivirus / EDR", "Cloud Dynamic Sandbox (e.g., VT)", "ARGUS Platform"],
    ["Triage Latency", "100 ms – 2.0 seconds", "300 s – 900 s (5–15 min VM spin-up)", "Sub-second (Mean 820 ms)"],
    ["Execution Safety", "On-host heuristic / signature scan", "Live VM detonation (evasion risk)", "100% Non-Execution Static Sandbox"],
    ["ML Feature Space", "Basic byte-signature / hash lookup", "Behavioral syscall trace logs", "2,381 EMBER Structural & Entropy Vectors"],
    ["Attack-Chain Context", "Isolated binary alert", "Flat text / JSON syscall dump", "Interactive NetworkX DAG + MITRE ATT&CK"],
    ["Defensive Response", "Opaque 'clean/infected' verdict", "Manual analyst playbook creation", "Automated Policy Synthesizer (ISO/TERM/BLK)"],
    ["Explainability", "Cryptic signature strings", "Raw API trace logs", "Entropy, IAT, YARA & Feature Attribution"],
]

# Chapter 3 Tables
TABLE_3_1 = [
    ["Req ID", "Functional Requirement", "Technical Specification & Expected Behavior", "Priority"],
    ["FR-01", "Multi-Format Ingestion", "Sanitize filenames via regex; verify magic bytes via python-magic; enforce 50 MB ceiling.", "Mandatory"],
    ["FR-02", "Static Forensic Parsing", "Extract MD5/SHA-1/SHA-256, section Shannon entropy, PE IAT/EAT, OLE VBA macros, PDF JS.", "Mandatory"],
    ["FR-03", "YARA Signature Matching", "Execute compiled YARA rules against static byte buffers for malware family attribution.", "Mandatory"],
    ["FR-04", "2,381-D ML Classification", "Vectorize 2,381 EMBER features, scale with RobustScaler, classify via RF/LightGBM/IF.", "Mandatory"],
    ["FR-05", "Ransomware Heuristic", "Escalate to RANSOMWARE when P(malicious) > 0.85 and section entropy > 7.2.", "Mandatory"],
    ["FR-06", "Attack-Chain DAG Engine", "Synthesize NetworkX DiGraph mapping OBSERVED, INFERRED, and SIMULATED nodes to MITRE ATT&CK.", "Mandatory"],
    ["FR-07", "Defense Policy Synthesizer", "Generate CRITICAL (Sandbox Isolation), HIGH (Egress Block), or LOW_MEDIUM playbooks.", "Mandatory"],
    ["FR-08", "Interactive React Console", "Provide FileDropZone, ThreatScoreCard, AttackGraphCanvas, and modal inspect cards.", "Mandatory"],
    ["FR-09", "Audit & Telemetry API", "Expose /api/v1/scan, /graph/{id}, /defense/actions, /telemetry, and /metrics.", "Mandatory"],
]

TABLE_3_2 = [
    ["Component Category", "Minimum Development Specification", "Recommended Production Deployment"],
    ["Processor (CPU)", "Intel Core i5 / Apple Silicon (4+ Cores)", "8-Core Apple Silicon / Intel Core i7 (3.2 GHz+)"],
    ["System Memory (RAM)", "8 GB DDR4 / Unified Memory", "16 GB Unified RAM / DDR4-DDR5"],
    ["Disk Storage", "2 GB free space (Code + Models)", "10 GB NVMe SSD (Container + 10 GB Scratch)"],
    ["Operating System", "macOS Sonoma / Ubuntu 22.04 LTS", "Linux x86_64 / arm64 Docker Host"],
    ["Runtime Environment", "Python 3.11 / 3.14 (.venv) + Node.js v20", "Multi-Stage Docker (Debian Slim + Uvicorn)"],
    ["Container Spec", "Local run_all.sh (Ports 8000 & 5173)", "2 vCPU, 4 GB RAM, HTTPS Reverse Proxy"],
]

# Chapter 4 Tables
TABLE_4_1 = [
    ["Field Name", "Data Type", "Constraint", "Forensic Description"],
    ["investigation_id", "UUID4 (String)", "Primary Key", "Unique identifier for the forensic session"],
    ["filename", "String", "Max 255 chars", "Sanitized base filename of the analyzed sample"],
    ["file_size_bytes", "Integer", "> 0, <= 50 MB", "Exact size of the ingested binary in bytes"],
    ["magic_file_type", "String", "Non-empty", "Deterministic libmagic file type identification"],
    ["sha256_hash", "String", "64 Hex chars", "SHA-256 cryptographic hash for threat intel lookup"],
    ["overall_entropy", "Float", "0.0 – 8.0", "Global Shannon entropy score of the binary"],
    ["is_packed", "Boolean", "True / False", "Flag indicating section entropy exceeding 7.2"],
    ["ml_threat_verdict", "Enum", "BENIGN / MALICIOUS / RANSOMWARE", "Machine learning classification output"],
    ["ml_confidence", "Float", "0.0 – 1.0", "Calibrated confidence score of the ML prediction"],
    ["risk_score", "Float", "0.0 – 100.0", "Weighted multi-factor threat posture score"],
    ["attack_graph_nodes", "Array[Node]", "Valid DAG", "Topological forensic and telemetry nodes"],
    ["attack_graph_edges", "Array[Edge]", "Directed", "Evidentiary relationships between graph nodes"],
    ["defense_playbook", "Array[Action]", "Ordered", "Synthesized containment and mitigation actions"],
]

TABLE_4_2 = [
    ["Feature Range", "Feature Group", "Extracted Structural Indicators", "Data Type"],
    ["f_1 – f_256", "Byte Histogram", "Normalized byte frequency distribution across all 256 byte values.", "Continuous"],
    ["f_257 – f_512", "2D Byte-Entropy", "Sliding-window joint byte value and local Shannon entropy matrix.", "Continuous"],
    ["f_513 – f_616", "String Statistics", "Printable ASCII/UTF-16 counts, URLs, IPv4s, registry paths, MZ headers.", "Integer / Ratio"],
    ["f_617 – f_698", "General & Header Info", "File size, virtual size, COFF characteristics, subsystem, timestamp.", "Continuous / Binary"],
    ["f_699 – f_954", "PE Section Table", "Section virtual/raw sizes, section entropy, .upx/.themida anomalies.", "Continuous / Binary"],
    ["f_955 – f_2234", "Imports & Exports (IAT)", "Hashed DLL/API import pairs (VirtualAllocEx, WriteProcessMemory, CryptEncrypt).", "Sparse / Hashed"],
    ["f_2235 – f_2381", "Data Directories & YARA", "TLS callbacks, Authenticode presence, resource entropy, YARA rule hits.", "Continuous / Binary"],
]

TABLE_4_3 = [
    ["Design Pattern", "ARGUS Component", "Architectural Benefit"],
    ["Singleton Pattern", "MLModelManager & YARARuleCompiler", "Loads Joblib weights and compiled YARA rules once at boot, eliminating per-request latency."],
    ["Observer Pattern", "Live SOC Telemetry Feed", "Streams incoming host events to active dashboard subscribers via reactive React hooks."],
    ["Factory Pattern", "ParserFactory", "Dynamically instantiates PEParser, PDFParser, or OLEParser from verified magic bytes."],
    ["Strategy Pattern", "DefensePolicyEngine", "Selects RansomwareContainmentStrategy or TrojanEgressBlockStrategy from risk posture."],
]

# Chapter 5 Tech Stack Table
TABLE_5_1 = [
    ["Layer / Category", "Technology Used", "Version", "Specific Role in ARGUS"],
    ["Frontend Framework", "React.js", "18.3.1", "Component-based reactive UI rendering and state management"],
    ["Frontend Build Tool", "Vite", "5.4.2", "Sub-second HMR development server and Rollup production bundling"],
    ["Styling Framework", "Tailwind CSS", "3.4.1", "Utility-first high-contrast light theme and semantic status badges"],
    ["Icons & Visuals", "Lucide React", "0.344.0", "Security and forensic iconography for dashboard and graph views"],
    ["Backend Gateway", "FastAPI", "0.110.0", "High-performance asynchronous REST API with OpenAPI schemas"],
    ["ASGI Web Server", "Uvicorn", "0.28.0", "uvloop-backed asynchronous server handling concurrent file streams"],
    ["Data Validation", "Pydantic", "2.6.4", "Strict v2 schema enforcement and forensic payload serialization"],
    ["PE Forensic Parser", "pefile", "2023.2.7", "Parsing Windows PE32/PE64 headers, sections, IAT, and EAT"],
    ["OLE Macro Parser", "oletools (olevba)", "0.60.2", "Extraction and analysis of VBA macros in MS Office documents"],
    ["PDF Forensic Parser", "PyMuPDF (fitz)", "1.24.1", "Inspection of PDF binary streams, /OpenAction, and embedded JS"],
    ["File Signature ID", "python-magic", "0.4.27", "Deterministic magic-byte file type identification"],
    ["Machine Learning", "Scikit-learn & LightGBM", "1.4.1", "Random Forest (200t), LightGBM, SVM (RBF), and Isolation Forest"],
    ["Serialization", "Joblib", "1.3.2", "Zero-latency in-memory loading of pre-trained scaler and models"],
    ["Graph Engine", "NetworkX", "3.2.1", "Directed Acyclic Graph (DAG) assembly and topological sorting"],
    ["Automated Testing", "Pytest & HTTPX", "9.1.1", "21 automated unit, integration, and security regression tests"],
    ["Containerization", "Docker & Compose", "24.0.7", "Multi-stage production build and isolated deployment environment"],
]

# Chapter 6 Benchmarking & Test Tables
TABLE_6_1 = [
    ["Algorithm / Model", "Accuracy (%)", "Precision (%)", "Recall (%)", "F1-Score (%)", "ROC-AUC", "Inference Latency"],
    ["Random Forest (200 Trees)", "97.50%", "97.87%", "95.83%", "96.84%", "0.968", "12.4 ms"],
    ["LightGBM Boosted Trees", "97.10%", "97.20%", "95.50%", "96.34%", "0.964", "8.2 ms"],
    ["Support Vector Machine (RBF)", "94.20%", "93.80%", "92.40%", "93.09%", "0.938", "45.1 ms"],
    ["Decision Tree (Baseline)", "89.60%", "88.40%", "87.90%", "88.15%", "0.892", "4.1 ms"],
]

TABLE_6_2 = [
    ["Actual \\ Predicted", "Predicted Benign", "Predicted Malicious", "Total Actual"],
    ["Actual Benign", "9,787 (True Negatives)", "213 (False Positives)", "10,000"],
    ["Actual Malicious", "417 (False Negatives)", "9,583 (True Positives)", "10,000"],
    ["Total Predicted", "10,204 (51.02%)", "9,796 (48.98%)", "20,000 Samples"],
]

TABLE_6_3 = [
    ["Pipeline Stage", "Mean Latency (ms)", "p95 Latency (ms)", "Primary Operation"],
    ["1. Ingestion & Hashing", "85 ms", "130 ms", "64 KB async streaming, regex sanitize, SHA-256"],
    ["2. Static Forensic Parsing", "310 ms", "460 ms", "pefile / oletools / PyMuPDF + Shannon entropy + YARA"],
    ["3. Vectorization & ML Inference", "290 ms", "410 ms", "2,381 EMBER features + RobustScaler + RF/IF"],
    ["4. Attack-Chain DAG Synthesis", "95 ms", "140 ms", "NetworkX DiGraph assembly & MITRE ATT&CK mapping"],
    ["5. Defense Policy Synthesis", "40 ms", "60 ms", "Posture scoring & containment playbook generation"],
    ["Total End-to-End Pipeline", "820 ms", "1,150 ms", "Complete JSON response (< 1.2s SLA)"],
]

TABLE_6_4 = [
    ["Test ID", "Test Function Name", "Module Tested", "Observed Output", "Status"],
    ["TC-B01", "test_health_and_root_endpoints", "API Gateway", "HTTP 200, valid JSON status", "PASSED"],
    ["TC-B02", "test_metrics_and_model_evaluation", "ML API", "Accuracy: 0.975, ROC-AUC: 0.968", "PASSED"],
    ["TC-B03", "test_end_to_end_file_forensic_pipeline", "Full Pipeline", "Ingestion to response in < 1s", "PASSED"],
    ["TC-B04", "test_defense_action_synthesis_network", "Defense Engine", "Network egress cutoff generated", "PASSED"],
    ["TC-B05", "test_action_simulation_execution", "Defense Engine", "Simulation status transitions to active", "PASSED"],
    ["TC-B06", "test_posture_calculation", "Defense Engine", "CRITICAL assigned to ransomware", "PASSED"],
    ["TC-B07", "test_defense_api_workflow", "Defense API", "HTTP 200 with actionable playbooks", "PASSED"],
    ["TC-B08", "test_complete_argus_system_workflow", "System E2E", "All 5 subsystems execute cohesively", "PASSED"],
    ["TC-B09", "test_sanitize_filename_path_traversal", "Ingestion Security", "../../etc/passwd stripped to passwd", "PASSED"],
    ["TC-B10", "test_sanitize_filename_special_chars", "Ingestion Security", "Illegal characters removed", "PASSED"],
    ["TC-B11", "test_sha256_hash_accuracy", "Static Forensics", "Matches standard hashlib output", "PASSED"],
    ["TC-B12", "test_detect_file_format_magic_bytes", "Ingestion Security", "Accurately detects PE32/ELF/PDF", "PASSED"],
    ["TC-B13", "test_feature_extractor_vector_shape", "ML Engine", "Outputs exact 2,381 feature dimension", "PASSED"],
    ["TC-B14", "test_ml_engine_inference_predictions", "ML Engine", "Correct probabilities and labels", "PASSED"],
    ["TC-B15", "test_risk_scoring_bounds", "ML Engine", "Risk scores strictly bounded [0, 100]", "PASSED"],
    ["TC-B16", "test_shannon_entropy_calculation", "Static Forensics", "Zero for null bytes, 8.0 for random", "PASSED"],
    ["TC-B17", "test_extract_iocs_regex", "Static Forensics", "Correctly extracts IPv4 and domains", "PASSED"],
    ["TC-B18", "test_yara_rule_matching", "Static Forensics", "Detects malicious signature strings", "PASSED"],
    ["TC-B19", "test_telemetry_normalization", "Telemetry Engine", "Deduplicates redundant socket events", "PASSED"],
    ["TC-B20", "test_event_correlation_lineage", "Attack Graph", "Correctly correlates parent-child PIDs", "PASSED"],
    ["TC-B21", "test_attack_graph_construction", "Attack Graph", "Generates valid acyclic DiGraph", "PASSED"],
]

TABLE_6_5 = [
    ["Test ID", "Component / Action", "Input / Trigger", "Expected Output", "Result"],
    ["TC-F1", "File Drop-Zone", "Drag file over drop target", "Visual border highlight and filename preview", "PASSED"],
    ["TC-F2", "Upload Progress", "Click 'Analyze Sample'", "Animated progress bar with stage text", "PASSED"],
    ["TC-F3", "ScanVerdictModal", "Analysis completes", "Popup card renders with verdict badge & gauge", "PASSED"],
    ["TC-F4", "QuickInspectModal", "Click 'Quick Inspect'", "Modal displays section table & SHA-256 hash", "PASSED"],
    ["TC-F5", "Modal Keyboard Nav", "Press 'Escape' key", "Active modal dismisses cleanly without reload", "PASSED"],
    ["TC-F6", "Attack Graph Canvas", "Graph tab clicked", "Interactive SVG DAG renders nodes & arrows", "PASSED"],
    ["TC-F7", "Graph Zoom / Pan", "Mouse wheel / drag", "Graph zooms smoothly and pans in bounds", "PASSED"],
    ["TC-F8", "Node Filter Buttons", "Click 'Process Activity'", "Only process-related nodes remain highlighted", "PASSED"],
    ["TC-F9", "Defense Playbook", "Click 'Simulate Isolation'", "Status switches to 'Executing' then 'Active'", "PASSED"],
    ["TC-F10", "Responsive Layout", "Viewport resized to 768px", "Navigation collapses to drawer cleanly", "PASSED"],
]

TABLE_6_6 = [
    ["Evaluator", "Role / Experience", "Assigned Test Scenario", "Outcome", "Analyst Feedback"],
    ["Analyst 1", "Senior SOC Analyst (L3)", "Triage polymorphic ransomware sample", "Success", "Verdict card and entropy breakdown are extremely clear."],
    ["Analyst 2", "Incident Responder (IR)", "Inspect attack graph for C2 connections", "Success", "Directional DAG shows process lineage far better than text logs."],
    ["Analyst 3", "Threat Intel Researcher", "Verify IOC extraction against known feeds", "Success", "Extracted hashes and IPs match VirusTotal threat feeds."],
    ["Analyst 4", "Security Operations Mgr", "Evaluate automated defensive playbooks", "Success", "Sandbox isolation trigger gives immediate containment value."],
    ["Analyst 5", "Junior Forensic Analyst", "Perform rapid triage of benign utility", "Success", "Light theme is clean and easy to read during long shifts."],
]

TABLE_6_7 = [
    ["System Configuration", "Accuracy (%)", "FPR (%)", "FNR (%)", "ROC-AUC"],
    ["Static Heuristics & YARA Only", "91.80%", "1.40%", "15.00%", "0.912"],
    ["ML Classifier Only (No Entropy/YARA)", "95.90%", "3.10%", "5.10%", "0.954"],
    ["ARGUS Hybrid Synergy (RF + LightGBM + Heuristics)", "97.50%", "2.13%", "4.17%", "0.968"],
]

# Chapter 7 STRIDE Table
TABLE_7_1 = [
    ["Threat Category", "Identified Threat Vector", "Architectural Countermeasure", "Status"],
    ["Spoofing (S)", "Forged file extension (e.g., malware.pdf.exe) to bypass format checks.", "Deterministic magic-byte identification via python-magic overrides extensions.", "Verified / Enforced"],
    ["Tampering (T)", "Path traversal in filename (../../etc/passwd) during upload.", "Strict regex filename sanitization + random UUID4 quarantine naming.", "Verified / Enforced"],
    ["Repudiation (R)", "Analyst or host denies triage verdict or simulated defense action.", "Structured JSON audit logging with ISO 8601 timestamps & SHA-256 digests.", "Verified / Enforced"],
    ["Info Disclosure (I)", "Cross-site scripting or unauthorized cross-origin API access.", "Strict CORS middleware, CSP headers, X-Frame-Options: DENY, nosniff.", "Verified / Enforced"],
    ["Denial of Service (D)", "Memory exhaustion via massive uploads or malformed PE headers.", "64 KB async streaming, 50 MB ceiling, try-except guards on pefile.", "Verified / Enforced"],
    ["Elevation of Priv (E)", "Accidental execution of uploaded untrusted malware binary.", "Non-execution static sandbox; chmod 0600 (no +x); auto-purge post-triage.", "Verified / Enforced"],
]

REFERENCES = [
    "[1] Sikorski, M., & Honig, A. (2012). Practical Malware Analysis: The Hands-On Guide to Dissecting Malicious Software. No Starch Press.",
    "[2] Anderson, R. (2020). Security Engineering: A Guide to Building Dependable Distributed Systems (3rd ed.). John Wiley & Sons.",
    "[3] Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning. MIT Press.",
    "[4] Tanenbaum, A. S., & Bos, H. (2014). Modern Operating Systems (4th ed.). Pearson.",
    "[5] Ligh, M. H., Case, A., Levy, J., & Walters, A. (2014). The Art of Memory Forensics: Detecting Malware and Threats in Windows, Linux, and Mac Memory. Wiley.",
    "[6] Anderson, H. S., & Roth, P. (2018). EMBER: An Open Dataset for Training Static PE Malware Machine Learning Models. arXiv preprint arXiv:1804.04123.",
    "[7] Raff, E., Barker, J., Sylvester, J., Brandon, R., Catanzaro, B., & Nicholas, C. (2018). Malware Detection by Eating a Whole EXE. Workshops at AAAI.",
    "[8] Gibert, D., Mateu, C., & Planes, J. (2020). The Rise of Machine Learning for the Detection and Classification of Malware. Journal of Network and Computer Applications, 153, 102526.",
    "[9] MITRE Corporation. (2024). MITRE ATT&CK Framework: Design and Principles. MITRE Technical Report.",
    "[10] Shannon, C. E. (1948). A Mathematical Theory of Communication. Bell System Technical Journal, 27(3), 379–423.",
    "[11] Moser, A., Kruegel, C., & Kirda, E. (2007). Limits of static analysis for malware detection. Annual Computer Security Applications Conference (ACSAC), 421–430.",
    "[12] Willems, C., Holz, T., & Freiling, F. (2007). Toward automated dynamic malware analysis using CWSandbox. IEEE Security & Privacy, 5(2), 32–39.",
    "[13] Bulazel, A., & Yener, B. (2017). A survey on automated dynamic malware analysis evasion and counter-evasion. ROOTS Symposium, 1–21.",
    "[14] Ribeiro, M. T., Singh, S., & Guestrin, C. (2016). 'Why should I trust you?': Explaining the predictions of any classifier. ACM SIGKDD, 1135–1144.",
    "[15] Elastic Security. (2024). EMBER: Elastic Malware Benchmark for Empowering Researchers. https://github.com/elastic/ember",
    "[16] Malicia Project. (2023). Malicia Dataset: A Public Malware Dataset for Research. http://malicia-project.com/",
    "[17] Carrera, E. (2023). pefile: A Python Module to Read and Work with PE Files. https://github.com/erocarrera/pefile",
    "[18] Decaluwe, P. (2023). oletools: Python Tools to Analyze MS OLE2 Files and Malicious Macros. https://github.com/decalage2/oletools",
    "[19] Artifex Software. (2024). PyMuPDF (fitz): High-Performance Python PDF Library. https://github.com/pymupdf/PyMuPDF",
    "[20] Pedregosa, F., et al. (2011). Scikit-learn: Machine Learning in Python. Journal of Machine Learning Research, 12, 2825–2830.",
    "[21] Tiangolo, S. (2024). FastAPI: High-Performance Web Framework for Python. https://fastapi.tiangolo.com/",
    "[22] Hagberg, A., Swart, P., & Chult, D. (2008). Exploring Network Structure with NetworkX. Los Alamos National Lab.",
    "[23] Microsoft Corporation. (2024). Microsoft PE and COFF Specification (Rev 11.0). Microsoft Learn.",
    "[24] React Core Team. (2024). React Documentation and Architecture Guidelines. https://react.dev/",
    "[25] YARA Documentation. (2024). The Pattern Matching Swiss Army Knife for Malware Researchers. https://yara.readthedocs.io/",
]

CODE_LISTINGS = [
    (
        "C.1 FastAPI Analysis Endpoint (backend/app/api/v1/endpoints/files.py)",
        """@router.post("/analyze", response_model=InvestigationSummarySchema)
async def upload_and_analyze_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    \"\"\"Ingest, quarantine, and conduct complete non-executing forensic analysis.\"\"\"
    ingest_meta = await ingestion_service.ingest_upload(file)
    inv_id = ingest_meta["investigation_id"]
    file_path = ingest_meta["file_path"]
    original_name = ingest_meta["original_name"]
    sha256 = ingest_meta["sha256"]
    file_size = ingest_meta["file_size_bytes"]
    investigation = Investigation(
        id=inv_id, filename=original_name, sha256=sha256, size_bytes=file_size
    )
    return investigation"""
    ),
    (
        "C.2 Filename Sanitization & Quarantine (backend/app/services/ingestion/quarantine.py)",
        """def sanitize_filename(self, filename: str) -> str:
    \"\"\"Sanitize filename to prevent directory traversal and special character injection.\"\"\"
    base_name = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9._-]', '_', base_name)
    if not clean or clean.startswith('.'):
        clean = f"sample_{clean}"
    return clean[:255]

async def ingest_upload(self, file: UploadFile) -> Dict[str, Any]:
    investigation_id = str(uuid.uuid4())
    safe_original_name = self.sanitize_filename(file.filename or "unknown_sample")
    file_ext = Path(safe_original_name).suffix.lower()
    stored_name = f"{investigation_id}{file_ext}"
    destination_path = self.quarantine_dir / stored_name
    hasher = hashlib.sha256()
    # Stream in 64 KB chunks without executable permissions (chmod 0600)
    return {"investigation_id": investigation_id, "file_path": str(destination_path)}"""
    ),
    (
        "C.3 Static Entropy & String Extraction (backend/app/services/static_analysis/analyzer.py)",
        """def calculate_shannon_entropy(self, data: bytes) -> float:
    \"\"\"Calculate Shannon entropy (0.0 to 8.0) of byte buffer.\"\"\"
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
    \"\"\"Extract printable ASCII and UTF-16 strings.\"\"\"
    ascii_regex = re.compile(rb'[\\x20-\\x7E]{' + str(min_len).encode() + rb',}')
    unicode_regex = re.compile(rb'(?:[\\x20-\\x7E]\\x00){' + str(min_len).encode() + rb',}')
    strings = [m.group().decode('ascii', errors='ignore') for m in ascii_regex.finditer(data)]
    strings += [m.group().decode('utf-16le', errors='ignore') for m in unicode_regex.finditer(data)]
    return strings"""
    ),
    (
        "C.4 Random Forest & Isolation Forest Inference (backend/app/services/ml_engine/model.py)",
        """def predict(self, feature_dict: Dict[str, float]) -> Dict[str, Any]:
    \"\"\"Run transparent inference given extracted file features.\"\"\"
    if not self.rf_model or not self.scaler:
        self._load_or_train_models()
    df_in = feature_extractor.to_df(feature_dict)
    vec_scaled = self.scaler.transform(df_in)

    prob_malicious = float(self.rf_model.predict_proba(vec_scaled)[0, 1])
    is_malicious = bool(prob_malicious >= 0.5)

    raw_anomaly = float(self.if_model.decision_function(df_in)[0])
    anomaly_score = round(max(0.0, min(1.0, 0.5 - (raw_anomaly * 2.0))), 3)
    is_anomaly = bool(self.if_model.predict(df_in)[0] == -1)
    return {
        "prob_malicious": round(prob_malicious, 4),
        "is_malicious": is_malicious,
        "anomaly_score": anomaly_score,
        "is_anomaly": is_anomaly,
    }"""
    ),
    (
        "C.5 Attack-Chain Graph Builder (backend/app/services/attack_graph/graph_builder.py)",
        """def build_attack_graph(forensics: dict, ml_result: dict, telemetry: list = None) -> dict:
    G = nx.DiGraph()
    root_id = "node_file_root"
    G.add_node(root_id, type="INITIAL_EVIDENCE", label=forensics["filename"],
               severity="INFO", status="OBSERVED")
    hash_id = "node_hash"
    G.add_node(hash_id, type="INITIAL_EVIDENCE", label="SHA-256 Digest",
               severity="INFO", status="OBSERVED", desc=forensics["sha256"])
    G.add_edge(root_id, hash_id, relation="GENERATED_HASH", status="OBSERVED")
    if forensics.get("is_packed"):
        entropy_id = "node_entropy"
        G.add_node(entropy_id, type="STATIC_ANALYSIS", label="Packed/High Entropy",
                   severity="HIGH", status="INFERRED")
        G.add_edge(root_id, entropy_id, relation="EXHIBITS_OBFUSCATION", status="INFERRED")
    verdict_id = "node_ml_verdict"
    G.add_node(verdict_id, type="THREAT_INTELLIGENCE", label=f"ML: {ml_result['prediction']}",
               severity="CRITICAL" if ml_result['prediction'] != 'BENIGN' else "LOW",
               status="INFERRED")
    G.add_edge(root_id, verdict_id, relation="CLASSIFIED_BY_MODEL", status="INFERRED")
    return nx.node_link_data(G)"""
    ),
    (
        "C.6 Adaptive Defense Policy Synthesizer (backend/app/services/defense_simulation/engine.py)",
        """def determine_strategy(self, risk_score: float, risk_level: str = None, sample_name: str = "sample") -> dict:
    level = (risk_level or "").upper()
    if risk_score >= 85.0 or level == "CRITICAL":
        return {
            "primary_strategy": "STORE_IN_SANDBOX",
            "strategy_title": "Store in Virtual Sandbox (Isolated Detonation Deck)",
            "strategy_badge": "CRITICAL: STORE IN SANDBOX",
            "actions": ["ACT-ISO-01: Host Sandbox Isolation", "ACT-TERM-02: Terminate Parent-Child Trees"],
        }
    elif risk_score >= 60.0 or level == "HIGH":
        return {
            "primary_strategy": "STOP_ACCESS",
            "strategy_title": "Block Network Egress & Terminate Process",
            "strategy_badge": "HIGH: STOP ACCESS",
            "actions": ["ACT-BLK-01: Block Network Egress"],
        }
    return {
        "primary_strategy": "CONTINUOUS_REVIEW",
        "strategy_title": "Continuous Canary Review (48h Watchlist)",
        "strategy_badge": "LOW_MEDIUM: MONITOR",
        "actions": ["ACT-REV-01: Continuous Canary Review"],
    }"""
    ),
]
