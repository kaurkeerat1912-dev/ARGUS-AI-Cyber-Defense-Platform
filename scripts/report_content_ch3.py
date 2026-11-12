"""
ARGUS Live Project Report - Chapter 3: System Design
Institution: SRM University Delhi-NCR, Sonepat
"""

CHAPTER_3 = {
    "title": "Chapter 3: System Design",
    "sections": [
        {
            "num": "3.1",
            "title": "Introduction",
            "paragraphs": [
                "This chapter presents the architectural and technical system design of the ARGUS Cyber Defense Platform. The system design establishes the foundational blueprint for all frontend user interactions, API endpoints, forensic parsers, machine learning classification services, graph-based event correlation, and defensive policy synthesis. A robust system design ensures that ARGUS achieves high modularity, deterministic security boundaries, sub-second execution latency, fault tolerance, and horizontal scalability."
            ]
        },
        {
            "num": "3.2",
            "title": "Overall System Architecture",
            "paragraphs": [
                "ARGUS follows a decoupled, multi-tiered enterprise architecture partitioned into five primary tiers: the Presentation Tier (React/Vite SPA), the Ingestion & Gateway Tier (FastAPI Asynchronous Gateway), the Forensic & Analytics Tier (Static Binary Parsers, YARA Engine, and Scikit-learn ML Pipelines), the Graph Correlation Tier (NetworkX DAG Attack-Chain Engine), and the Automated Defense Tier (Policy Synthesizer and Sandbox Controller)."
            ]
        },
        {
            "num": "3.2.1",
            "title": "Architectural Block Diagram",
            "paragraphs": [
                "The high-level data and control flow across the architectural layers is structured as follows:"
            ],
            "diagram_text": """
+---------------------------------------------------------------------------------------------------+
|                                  ARGUS PRESENTATION LAYER (SPA)                                   |
|   [ File Drop-Zone ]   [ Live SOC Dashboard ]   [ Attack Graph Canvas ]   [ Defense Playbooks ]   |
+-------------------------------------------------+-------------------------------------------------+
                                                  | HTTPS / REST JSON
+-------------------------------------------------v-------------------------------------------------+
|                                 FASTAPI ASYNCHRONOUS API GATEWAY                                  |
|   [ CORS Middleware ]   [ Pydantic Ingestion Sanitizer ]   [ Rate Limiter ]   [ Auth Controller ] |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
         +----------------------------------------+---------------------------------------+
         |                                        |                                       |
+--------v-----------------------+   +------------v------------------+   +----------------v---------------+
| STATIC FORENSIC ENGINE         |   | MACHINE LEARNING ENGINE       |   | ATTACK GRAPH RECONSTRUCTION    |
| - pefile (PE32/64 Headers)     |   | - 2,381 EMBER Feature Vectors |   | - NetworkX DAG Builder         |
| - Shannon Entropy Analyzer     |   | - Random Forest Classifier    |   | - Temporal Sequence Engine     |
| - oletools (VBA Macro Parser)  |   | - LightGBM Boosted Ensembles  |   | - MITRE ATT&CK Tactic Mapper   |
| - PyMuPDF (PDF Exploit Engine) |   | - Calibrated Probability Score|   | - Node Observation Classifier  |
| - YARA Signature Matcher       |   | - Ransomware Heuristics       |   |   (OBSERVED / INFERRED / SIM)  |
+--------+-----------------------+   +------------+------------------+   +----------------+---------------+
         |                                        |                                       |
         +----------------------------------------+---------------------------------------+
                                                  |
+-------------------------------------------------v-------------------------------------------------+
|                                AUTOMATED DEFENSE SIMULATION ENGINE                                |
|   - Threat Posture Calculator (CRITICAL, HIGH, MEDIUM, LOW)                                       |
|   - Playbook Synthesizer (Sandbox Isolation, Process Termination, Network Egress Blocking)        |
|   - Differentiated Per-Artifact Remediation Engine                                                |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
+-------------------------------------------------v-------------------------------------------------+
|                                  PERSISTENCE & AUDIT LOGGING LAYER                                |
|   [ In-Memory Investigation Store ]   [ SQLite Forensic DB ]   [ Structured Audit Log Feeds ]     |
+---------------------------------------------------------------------------------------------------+
"""
        },
        {
            "num": "3.3",
            "title": "Module Descriptions",
            "paragraphs": [
                "The core capabilities of ARGUS are distributed across six specialized modules:"
            ],
            "subsections": [
                {
                    "num": "3.3.1",
                    "title": "User Interface Module",
                    "paragraphs": [
                        "Built using React 18 and Tailwind CSS, this module delivers an analyst-friendly cybersecurity SaaS dashboard. It provides drag-and-drop file upload zones, dynamic analysis status spinners, interactive threat verdict badges, modal popup inspect cards (ScanVerdictModal, QuickInspectModal), and an interactive SVG attack-chain visualizer supporting pan, zoom, node drag, and filtering."
                    ]
                },
                {
                    "num": "3.3.2",
                    "title": "Backend API Gateway Module",
                    "paragraphs": [
                        "Implemented with FastAPI and Uvicorn, this module exposes RESTful endpoints for file ingestion (/api/v1/scan), attack-graph retrieval (/api/v1/graph/{id}), defensive action simulation (/api/v1/defense/actions), live SOC telemetry (/api/v1/telemetry), and model evaluation metrics (/api/v1/metrics). It enforces strict payload validation via Pydantic v2 schemas."
                    ]
                },
                {
                    "num": "3.3.3",
                    "title": "Static Forensic Extraction Module",
                    "paragraphs": [
                        "A deterministic analysis service that inspects binary files without execution. It extracts MD5, SHA-1, SHA-256 cryptographic hashes, validates magic byte signatures (python-magic), calculates byte-level and section-level Shannon entropy, parses PE import/export tables (pefile), extracts embedded OLE/VBA macros (oletools), and runs compiled YARA rules for malware family signature matching."
                    ]
                },
                {
                    "num": "3.3.4",
                    "title": "Machine Learning Service Module",
                    "paragraphs": [
                        "Executes high-speed inference on extracted numerical feature vectors using pre-trained scikit-learn and LightGBM models. The service computes a continuous maliciousness probability (0.0 to 1.0), assigns categorical classifications (Benign, Suspicious, Malicious, Ransomware), and outputs top contributing feature vectors for explainable AI auditing."
                    ]
                },
                {
                    "num": "3.3.5",
                    "title": "Attack-Chain Reconstruction Engine",
                    "paragraphs": [
                        "Synthesizes isolated forensic evidence and host runtime telemetry into a chronological Directed Acyclic Graph (DAG) using NetworkX. Nodes are categorized across Initial Evidence, Static Analysis, Threat Intelligence, Attack Progression, and Defensive Response, with each node and edge labeled with observation confidence (OBSERVED, INFERRED, SIMULATED)."
                    ]
                },
                {
                    "num": "3.3.6",
                    "title": "Automated Defense Policy Synthesizer",
                    "paragraphs": [
                        "Evaluates overall threat posture and automatically synthesizes differentiated, actionable mitigation workflows. For CRITICAL samples, it provisions immediate sandbox isolation; for HIGH severity samples, it issues process termination and network egress cutoff; for MEDIUM/LOW risks, it initiates continuous canary monitoring and token auditing."
                    ]
                }
            ]
        },
        {
            "num": "3.4",
            "title": "Data Flow and User Request Flow",
            "paragraphs": [
                "3.4.1 User Request Flow: When an analyst uploads an artifact via the web dashboard, the request follows a strict synchronous/asynchronous lifecycle:",
                "Step 1: The browser verifies client-side file size and initiates an asynchronous multipart HTTP POST to /api/v1/scan.",
                "Step 2: The FastAPI gateway validates the binary magic bytes, sanitizes the filename to prevent directory traversal, writes the sample into a temporary isolated buffer, and calculates SHA-256 checksums.",
                "Step 3: The Static Forensic Engine parses file headers, calculates Shannon entropy distributions, inspects section tables, and extracts embedded strings and IOCs.",
                "Step 4: The 2,381 feature vector is fed into the Machine Learning Engine, which returns classification probabilities and confidence scores.",
                "Step 5: The Attack Graph Reconstruction Engine correlates static findings with telemetry events to assemble the directed kill-chain DAG.",
                "Step 6: The Defensive Simulation Engine calculates the composite risk score and synthesizes prioritized mitigation actions.",
                "Step 7: The backend consolidates the results into a unified JSON response, prompting the frontend to display the verdict popup card and render the interactive attack graph."
            ]
        },
        {
            "num": "3.5",
            "title": "Detailed Flowcharts for Each Module",
            "paragraphs": [
                "3.5.1 Frontend Ingestion Flowchart:",
                "User File Drop -> Client-side Extension & Size Check -> Generate Asynchronous Axios POST -> Show Animated Progress Bar -> Receive Consolidated JSON -> Render Verdict Card & Graph Canvas.",
                "3.5.2 Backend Gateway Flowchart:",
                "Receive Multipart Request -> Validate Magic Bytes -> Sanitize Filename (Path Traversal Guard) -> Compute Cryptographic Hashes -> Dispatch Concurrent Workers -> Assemble Aggregated Response -> Return HTTP 200.",
                "3.5.3 Machine Learning Pipeline Flowchart:",
                "Receive Raw Binary Buffer -> Extract Structural & Byte Histogram Features -> Robust Standard Scaling -> Evaluate Random Forest & LightGBM Ensembles -> Soft Voting Aggregation -> Output Maliciousness Probability.",
                "3.5.4 Defensive Simulation Flowchart:",
                "Extract Risk Score & Artifact Capabilities -> Evaluate Policy Decision Matrix -> Select Primary Containment Action (Sandbox Isolation vs Network Cutoff vs Canary Monitoring) -> Generate Synthesized Remediation Plan -> Transmit to SOC Controller."
            ]
        },
        {
            "num": "3.6",
            "title": "Data Model & Forensic Schema",
            "paragraphs": [
                "ARGUS implements strict Pydantic v2 data models for all forensic entities:"
            ],
            "table_data": [
                ["Field Name", "Data Type", "Constraint", "Forensic Description"],
                ["investigation_id", "UUID4 (String)", "Primary Key", "Unique identifier for the forensic session"],
                ["filename", "String", "Max 255 chars", "Sanitized base filename of the analyzed sample"],
                ["file_size_bytes", "Integer", "> 0", "Exact size of the ingested binary in bytes"],
                ["magic_file_type", "String", "Non-empty", "Deterministic libmagic file type identification"],
                ["sha256_hash", "String", "64 Hex chars", "SHA-256 cryptographic hash for threat intel lookup"],
                ["overall_entropy", "Float", "0.0 - 8.0", "Global Shannon entropy score of the binary"],
                ["is_packed", "Boolean", "True/False", "Flag indicating section entropy exceeding 7.2"],
                ["ml_threat_verdict", "Enum", "BENIGN/MALICIOUS/RANSOMWARE", "Machine learning classification output"],
                ["ml_confidence", "Float", "0.0 - 1.0", "Calibrated confidence score of the ML prediction"],
                ["risk_score", "Float", "0.0 - 100.0", "Weighted multi-factor threat posture score"],
                ["attack_graph_nodes", "Array[Node]", "Valid DAG", "Topological forensic and telemetry nodes"],
                ["attack_graph_edges", "Array[Edge]", "Directed", "Evidentiary relationships between graph nodes"],
                ["defense_playbook", "Array[Action]", "Ordered", "Synthesized containment and mitigation actions"]
            ]
        },
        {
            "num": "3.7",
            "title": "Component Interaction Diagram",
            "paragraphs": [
                "Communication between the React frontend and FastAPI backend is handled via asynchronous RESTful HTTP/2 protocols with JSON payload serialization. All forensic state is decoupled: the backend maintains zero state on the filesystem following analysis, persisting investigation records in an in-memory cache or SQLite database. This stateless design permits horizontal scale-out behind load balancers."
            ]
        },
        {
            "num": "3.8",
            "title": "System Design Principles Applied",
            "paragraphs": [
                "1. Single Responsibility Principle (SRP): Each forensic service (pefile parser, PDF analyzer, ML inference engine, graph builder) operates independently with dedicated interfaces.",
                "2. Defense-in-Depth: Multi-layered verification ensures that untrusted uploads cannot exploit the host system: magic byte checks, filename path traversal regexes, buffer size ceilings, and unprivileged worker execution.",
                "3. Fail-Safe Defaults: If a specific forensic parser encounters corrupt or malformed binary headers, the system gracefully catches the exception, logs a warning, and allows the remaining parsers and ML models to complete triage."
            ]
        },
        {
            "num": "3.9",
            "title": "User Interface Design Considerations",
            "paragraphs": [
                "ARGUS provides a clean, modern cybersecurity SaaS interface styled with a light theme. Dark themes commonly used in hobbyist hacker tools induce significant eye strain during 8-hour SOC shifts. ARGUS employs crisp slate typography (#0f172a), subtle borders (#e2e8f0), distinct semantic status badges (Emerald for Benign, Amber for Suspicious, Crimson for Malicious, Purple for Ransomware), and interactive popup inspect cards for swift evidence verification."
            ]
        },
        {
            "num": "3.10",
            "title": "Future Design Improvements",
            "paragraphs": [
                "Planned architectural improvements include integrating an eBPF (Extended Berkeley Packet Filter) kernel-probe service for microsecond runtime syscall interception, transitioning the persistence layer to PostgreSQL with TimescaleDB for multi-year telemetry retention, and embedding Large Language Model (LLM) agents for automated natural-language incident report generation."
            ]
        },
        {
            "num": "3.11",
            "title": "Overview of System Architecture Decomposition",
            "paragraphs": [
                "To provide full clarity into each operational tier, sections 3.12 through 3.33 systematically describe the client-side design, server-side APIs, machine learning model specifications, UML diagrams, DFDs, ER diagrams, security controls, and design patterns."
            ]
        },
        {
            "num": "3.12",
            "title": "Detailed System Design Specifications",
            "paragraphs": [
                "The system design addresses the critical requirement of low-latency triage. Typical enterprise sandboxes require 5 to 15 minutes to spin up virtual machines, execute malware, and capture network pcaps. ARGUS achieves deep static triage, ML inference, and attack graph synthesis in under 1,200 milliseconds, empowering analysts to respond in real time."
            ]
        },
        {
            "num": "3.13",
            "title": "Overall System Architecture Breakdown",
            "paragraphs": [
                "The architecture isolates untrusted binary input at the gateway. Memory buffers are streamed directly into analysis routines using Python tempfile SpooledTemporaryFile constructs, ensuring that malicious executables never receive executable permissions on the server filesystem."
            ]
        },
        {
            "num": "3.14",
            "title": "Frontend (Client-Side) Design",
            "paragraphs": [
                "The React frontend is architected around reusable modular components:",
                "- FileDropZone: Handles drag-and-drop file ingestion, file size checking, and upload progress feedback.",
                "- ThreatScoreCard: Displays the composite risk gauge, threat classification verdict, and high-level status.",
                "- AttackGraphCanvas: Interactive SVG/HTML5 canvas rendering directed attack chains with zoom/pan and node filters.",
                "- DefenseActionPanel: Collapsible cards displaying synthesized remediation playbooks with simulated execution buttons.",
                "- QuickInspectModal & ScanVerdictModal: Accessible popup dialogs presenting granular PE sections, hashes, and IOC details."
            ]
        },
        {
            "num": "3.15",
            "title": "Backend (Server-Side) Design",
            "paragraphs": [
                "The backend is structured into domain services:",
                "- /services/ingestion: Upload handling, cryptographic hashing, and magic byte validation.",
                "- /services/static_analysis: PE parsing (pefile), OLE extraction (oletools), PDF parsing (PyMuPDF), and YARA matching.",
                "- /services/ml_engine: Feature vectorization, model pipeline inference, and probability calibration.",
                "- /services/attack_graph: NetworkX DAG assembly, topological sorting, and timeline generation.",
                "- /services/defense_simulation: Posture scoring and adaptive remediation action synthesis."
            ]
        },
        {
            "num": "3.16",
            "title": "Machine Learning Model Design",
            "paragraphs": [
                "3.16.1 PE Malware Detection: Evaluates 2,381 dimensional numerical vectors representing import functions, header flags, byte entropy distributions, and section characteristics.",
                "3.16.2 PDF & Document Exploit Detection: Identifies malicious JavaScript streams, /OpenAction triggers, embedded executables, and high-entropy stream objects.",
                "3.16.3 Ransomware Heuristics: Evaluates cryptographic API imports (CryptEncrypt, CryptAcquireContext, BCryptEncrypt), mass file enumeration APIs (FindFirstFile, FindNextFile), and entropy cliffs indicative of on-the-fly encryption.",
                "3.16.4 Model Pipeline: Feature Extraction -> Variance Thresholding -> Robust Normalization -> Random Forest (200 trees) / LightGBM Ensembles -> Soft-Voting Aggregator."
            ]
        },
        {
            "num": "3.17",
            "title": "UML Diagrams",
            "paragraphs": [
                "3.17.1 Class Diagram: The object-oriented architecture defines core classes: FileArtifact, ForensicReport, StaticAnalysisService, MLEngineService, AttackGraphService, DefensePolicySynthesizer, and InvestigationController.",
                "3.17.2 Sequence Diagram: Captures the chronological interaction sequence: User Browser -> FileDropZone -> FastAPI Gateway -> IngestionValidator -> StaticForensicEngine -> MLEngine -> AttackGraphBuilder -> DefenseSynthesizer -> JSON Response -> Browser Render."
            ]
        },
        {
            "num": "3.18",
            "title": "Data Flow Diagrams (DFD)",
            "paragraphs": [
                "3.18.1 Level 0 – Context Diagram: External Entity (Security Analyst) -> Ingests Suspicious File -> [ARGUS Cyber Defense System] -> Outputs Threat Verdict, Attack Graph & Defensive Actions.",
                "3.18.2 Level 1 – Process Breakdown: Decomposes the system into Process 1.0 (File Ingestion & Hashing), Process 2.0 (Static Structural Extraction), Process 3.0 (ML Feature Vectorization & Scoring), Process 4.0 (Attack Chain Graph Synthesis), and Process 5.0 (Defensive Mitigation Synthesis)."
            ]
        },
        {
            "num": "3.19",
            "title": "Entity-Relationship (ER) Diagram",
            "paragraphs": [
                "The persistence model captures entities and relationships: Investigation (1:1 with FileArtifact, 1:1 with ForensicVerdict, 1:N with GraphNodes, 1:N with GraphEdges, 1:N with DefenseActions). Each relationship maintains strict referential integrity."
            ]
        },
        {
            "num": "3.20",
            "title": "Technology Stack Used",
            "paragraphs": [
                "Comprehensive comparative summary of the technologies utilized across the ARGUS platform:"
            ],
            "tech_table": [
                ["Layer / Category", "Technology Used", "Version", "Specific Role in ARGUS"],
                ["Frontend Framework", "React.js", "18.3.1", "Component-based reactive UI rendering and state management"],
                ["Frontend Build Tool", "Vite", "5.4.2", "Ultra-fast development server, HMR, and Rollup production bundling"],
                ["Styling Framework", "Tailwind CSS", "3.4.1", "Utility-first CSS styling, responsive layout, and semantic tokens"],
                ["Icons & Visual Assets", "Lucide React", "0.344.0", "Security and forensic iconography for dashboard and graph views"],
                ["Backend Web Framework", "FastAPI", "0.110.0", "High-performance asynchronous REST API framework with OpenAPI docs"],
                ["ASGI Web Server", "Uvicorn", "0.28.0", "Asynchronous server implementation handling concurrent file streams"],
                ["Data Validation", "Pydantic", "2.6.4", "Strict schema enforcement and data serialization for forensic payloads"],
                ["PE Forensic Parser", "pefile", "2023.2.7", "Parsing Windows PE32/64 headers, imports, exports, and sections"],
                ["OLE Macro Parser", "oletools (olevba)", "0.60.2", "Extraction and analysis of VBA macros in MS Office documents"],
                ["PDF Forensic Parser", "PyMuPDF (fitz)", "1.24.1", "Extraction of PDF binary streams, JavaScript actions, and metadata"],
                ["File Signature ID", "python-magic", "0.4.27", "Deterministic magic-byte file type identification"],
                ["Machine Learning", "Scikit-learn", "1.4.1", "Random Forest, LightGBM, and SVM classifier implementations"],
                ["Pipeline Serialization", "Joblib", "1.3.2", "Optimized persistence and zero-latency loading of pre-trained weights"],
                ["Graph Engine", "NetworkX", "3.2.1", "Directed Acyclic Graph (DAG) construction and topological sorting"],
                ["Automated Testing", "Pytest", "9.1.1", "Asynchronous unit, integration, and security test suite"],
                ["Containerization", "Docker & Compose", "24.0.7", "Multi-stage production build and isolated deployment environment"],
                ["Documentation", "ReportLab & python-docx", "5.0.1 / 1.2.0", "Programmatic generation of comprehensive university project reports"]
            ]
        },
        {
            "num": "3.21",
            "title": "Security and Privacy Considerations",
            "paragraphs": [
                "Handling untrusted malware samples requires extreme security vigilance. ARGUS implements non-execution sandboxing: files are inspected purely as static byte buffers. Uploaded files are assigned random UUID filenames to prevent overwrite collisions, stripped of execution flags (chmod 600), stored in temporary memory-backed directories, and automatically purged upon analysis completion. Filenames are sanitized with strict regular expressions to eliminate path traversal vulnerabilities (e.g., ../../etc/passwd)."
            ]
        },
        {
            "num": "3.22",
            "title": "Future-Proof Design Features",
            "paragraphs": [
                "The architecture utilizes abstract base classes for forensic parsers and ML evaluators, allowing security teams to register new file parsers (e.g., Mach-O for Apple macOS, APK for Android) by implementing a standardized BaseParser interface without modifying core API controllers."
            ]
        },
        {
            "num": "3.23",
            "title": "Detailed Module Interactions",
            "paragraphs": [
                "Module communication is mediated through strictly typed Pydantic transfer objects. For example, the StaticForensicEngine emits an ExtractedArtifacts object, which is fed directly into the FeatureExtractor, ensuring compile-time type verification and zero runtime serialization mismatches."
            ]
        },
        {
            "num": "3.24",
            "title": "Component-Level Breakdown",
            "paragraphs": [
                "3.24.1 File Ingestion Component: Streams bytes asynchronously in 64 KB chunks, calculating streaming SHA-256 digests in memory to avoid high RAM spikes on multi-megabyte samples.",
                "3.24.2 DAG Graph Renderer: Computes layout coordinates using hierarchical topological rank assignment, ensuring clear top-to-bottom visual flow from initial ingress to defensive response.",
                "3.24.3 Telemetry Correlator: Matches synthetic and live host events (Process IDs, Socket connections) against extracted static strings using Levenshtein distance and exact hash matching."
            ]
        },
        {
            "num": "3.25",
            "title": "Model Management and Scalability",
            "paragraphs": [
                "ML model artifacts are loaded as singletons during FastAPI startup using the lifespan event handler, preventing redundant disk reads on incoming requests. In-memory models execute thread-safe predictions across multiple Uvicorn worker threads."
            ]
        },
        {
            "num": "3.26",
            "title": "Error Handling and Edge Case Management",
            "paragraphs": [
                "Edge cases such as zero-byte files, corrupted PE section headers, truncated PDF streams, and password-protected Office files are handled gracefully: specialized exception catchers log forensic anomalies, assign elevated risk flags for corrupted obfuscation, and prevent application crashes."
            ]
        },
        {
            "num": "3.27",
            "title": "UX-Focused Features",
            "paragraphs": [
                "ARGUS includes thoughtful usability features: one-click copy buttons for SHA-256 hashes, interactive modal dialogs for inspecting PE sections and raw hex strings, keyboard escape listeners for modal dismissal, and responsive SVG graph controls."
            ]
        },
        {
            "num": "3.28",
            "title": "Scalability and Extensibility",
            "paragraphs": [
                "The stateless design of the FastAPI application allows ARGUS to scale horizontally across Kubernetes pods or AWS ECS tasks behind an Application Load Balancer. Shared forensic state can be persisted to a Redis cache or AWS S3 bucket for enterprise-scale deployments."
            ]
        },
        {
            "num": "3.29",
            "title": "Advanced Design Patterns Used",
            "paragraphs": [
                "3.29.1 Singleton Pattern: Applied to the MLModelManager and YARARuleCompiler to ensure pre-trained models and compiled signature rule sets are instantiated exactly once in memory.",
                "3.29.2 Observer Pattern: Used in the live telemetry feed where incoming host events notify active dashboard subscribers.",
                "3.29.3 Factory Pattern: Utilized in the ParserFactory to dynamically instantiate the appropriate forensic parser (PEParser, PDFParser, OLEParser) based on verified magic bytes.",
                "3.29.4 Strategy Pattern: Implemented in the DefensePolicyEngine to select specific mitigation strategies (RansomwareContainmentStrategy, TrojanEgressBlockStrategy) based on calculated risk classifications."
            ]
        },
        {
            "num": "3.30",
            "title": "Security Considerations",
            "paragraphs": [
                "Strict CORS (Cross-Origin Resource Sharing) middleware limits API consumption to authorized origin domains. Standard security headers (Content-Security-Policy, X-Content-Type-Options: nosniff, X-Frame-Options: DENY) protect against cross-site scripting and clickjacking."
            ]
        },
        {
            "num": "3.31",
            "title": "Deployment Design",
            "paragraphs": [
                "The application is packaged into a multi-stage Docker container: the first stage builds the optimized React frontend distribution with Vite; the second stage installs Python dependencies in a slim Debian environment, copies the frontend static assets, and runs Uvicorn to serve both the REST API and the SPA from a single secure container."
            ]
        },
        {
            "num": "3.32",
            "title": "Accessibility Design",
            "paragraphs": [
                "All UI controls adhere to WCAG 2.1 Level AA standards, incorporating ARIA labels on modal dialogs, accessible color contrast ratios exceeding 4.5:1, and full keyboard navigation support."
            ]
        },
        {
            "num": "3.33",
            "title": "Summary of System Design Goals Achieved",
            "paragraphs": [
                "The system design achieves complete modular separation, sub-second forensic execution, robust defense-in-depth isolation, explainable machine learning predictions, and an intuitive, accessible user experience tailored for high-tempo SOC operations."
            ]
        }
    ]
}
