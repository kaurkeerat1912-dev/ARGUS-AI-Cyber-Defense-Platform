"""
ARGUS Live Project Report - Chapters 1 & 2
Institution: SRM University Delhi-NCR, Sonepat
"""

CHAPTER_1 = {
    "title": "Chapter 1: Introduction",
    "sections": [
        {
            "num": "1.1",
            "title": "Problem Statement",
            "paragraphs": [
                "The rapid proliferation of sophisticated cyber threats, polymorphic malware variants, and nation-state Advanced Persistent Threat (APT) campaigns has exposed fundamental vulnerabilities in contemporary enterprise defense infrastructures. Traditional Security Operations Centers (SOCs) rely heavily on static signature-based detection mechanisms and disparate forensic tools, creating severe operational bottlenecks. Security analysts are inundated with tens of thousands of alerts daily, a phenomenon known as alert fatigue, which delays incident response and allows stealthy adversaries to dwell undetected within corporate networks for an average of 200+ days.",
                "In traditional incident response workflows, when an enterprise user or automated sensor ingests a suspicious file (such as a weaponized PDF document, an obfuscated Portable Executable binary, or a macro-laced Office spreadsheet), security analysts must manually triage the artifact. This triage requires running isolated command-line tools—calculating cryptographic checksums, analyzing PE headers, inspecting import address tables (IAT), extracting suspicious ASCII/Unicode strings, and inspecting entropy curves. Each tool produces unstructured or semi-structured outputs that fail to correlate with live host telemetry or network egress connections. Consequently, threat analysts struggle to reconstruct the complete attack narrative: How did the initial payload execute? What child processes did it spawn? Did it establish outbound command-and-control (C2) communication channels? What registry keys were modified to establish system persistence?",
                "Moreover, existing malware analysis sandboxes frequently operate as 'black boxes' that merely label a binary as benign or malicious without providing actionable, automated defensive countermeasures. When a critical ransomware sample is detected, manual intervention is required to isolate the compromised endpoint, terminate active parent-child process trees, block malicious IP/domain indicators on edge firewalls, and revoke stolen administrative session tokens. In high-speed cyber attacks, the minutes or hours lost to manual decision-making result in catastrophic data exfiltration, service disruption, and massive financial loss.",
                "To resolve these systemic challenges, there is an imperative need for an autonomous, explainable, and multi-tiered cyber defense platform. ARGUS (AI Cyber Attack & Defense Simulation Platform) addresses this critical paradigm shift by unifying static structural parsing, multi-model machine learning classification, automated directed acyclic graph (DAG) attack-chain reconstruction, and dynamic defense policy simulation into a cohesive, high-performance web-based cybersecurity platform."
            ]
        },
        {
            "num": "1.2",
            "title": "Objectives",
            "paragraphs": [
                "The primary objective of the ARGUS platform is to provide enterprise security analysts and incident response teams with an intelligent, end-to-end cyber defense system that automates forensic ingestion, threat detection, attack chain correlation, and risk-adapted mitigation.",
                "The specific technological and architectural objectives of this live project are as follows:"
            ],
            "bullets": [
                "Automated Multi-Format Forensic Ingestion: Develop an asynchronous backend engine capable of ingesting and sanitizing diverse file formats (Portable Executable .exe/.dll, Executable and Linkable Format .elf, Adobe PDF, Microsoft Office Compound File Binary/OOXML, and PowerShell/Shell scripts) with rigorous protection against path traversal and memory exhaustion attacks.",
                "Deep Static Forensic Extraction: Extract rich cryptographic signatures (MD5, SHA-1, SHA-256), section-level Shannon entropy distributions, Import/Export Address Tables, compiler timestamps, suspicious Win32/POSIX API call patterns, and embedded IOCs (IPv4 addresses, URIs, email addresses, cryptocurrency wallets).",
                "Machine Learning Threat & Ransomware Classification: Train and deploy high-performance supervised machine learning models (Random Forest, Gradient Boosted Decision Trees, LightGBM, and Support Vector Machines) trained on the benchmark EMBER malware corpus to classify samples into Benign, Suspicious, Malicious, and Ransomware categories with sub-second inference latency.",
                "Graph-Based Attack-Chain Reconstruction: Implement an automated graph generation algorithm that maps isolated forensic evidence and host runtime telemetry into a chronologically ordered Directed Acyclic Graph (DAG), tagging nodes as OBSERVED, INFERRED, or SIMULATED, and tracing adversary progression across the MITRE ATT&CK framework.",
                "Adaptive Defensive Simulation Engine: Formulate an automated defense policy synthesizer that evaluates overall threat posture and generates targeted, risk-prioritized remediation strategies—such as Sandbox Isolation for CRITICAL ransomware threats, Network Egress Blocking and Process Termination for HIGH severity implants, and Continuous Behavioral Review for LOW/MEDIUM anomalies.",
                "Modern Responsive Security Console: Construct an intuitive, high-contrast cybersecurity SaaS dashboard featuring an interactive file analysis drop-zone, real-time threat verdicts, SVG/Canvas attack-graph visualizer, modal inspection cards, and live audit telemetry feeds."
            ]
        },
        {
            "num": "1.3",
            "title": "Research Methodology",
            "paragraphs": [
                "The ARGUS research and engineering methodology followed a rigorous seven-phase development lifecycle designed to transition theoretical cyber threat models into an empirical, production-grade security architecture:"
            ],
            "phases": [
                ("Phase 1: Threat Modeling & Requirements Analysis", "Conducted an extensive survey of contemporary malware attack vectors, evasion techniques (packing, section obfuscation, living-off-the-land binaries), and existing SOC automation shortfalls. Established formal system requirements and performance thresholds (sub-second API response, >95% ML classification accuracy)."),
                ("Phase 2: Forensic Parser Architecture & Data Pipeline", "Engineered modular static analysis parsers utilizing pefile, oletools, PyMuPDF, and python-magic. Designed normalized JSON forensic data models capturing file metadata, section entropies, cryptographic digests, and suspicious indicators."),
                ("Phase 3: Machine Learning Engineering & Model Optimization", "Extracted 2,381 feature vectors from the EMBER malware benchmark dataset. Implemented robust feature scaling, variance thresholding, and trained ensemble tree models. Evaluated cross-validated performance using Accuracy, Precision, Recall, F1-Score, and ROC-AUC curves."),
                ("Phase 4: Attack-Chain Graph Reconstruction Engine", "Developed a topological graph synthesis engine using NetworkX. Formulated heuristic correlation algorithms to bind static forensic indicators with host-level runtime telemetry (process spawning, registry persistence, outbound sockets) into a coherent MITRE ATT&CK kill-chain."),
                ("Phase 5: Automated Defensive Playbook Synthesizer", "Designed a rule-based expert decision engine that maps calculated threat risk scores and specific malware capabilities to defensive playbooks, providing differentiated containment and recovery steps for each analyzed artifact."),
                ("Phase 6: Full-Stack Integration & API Architecture", "Developed high-throughput asynchronous REST APIs using FastAPI and Uvicorn. Built a component-based single-page application using React 18, Vite, and Tailwind CSS, featuring interactive inspection modals and responsive SVG telemetry graphs."),
                ("Phase 7: Empirical Testing, Benchmarking & Deployment", "Conducted comprehensive automated unit testing (21 Pytest test cases), integration testing, Postman API verification, and security vulnerability testing. Deployed the platform via Docker containers and public HTTPS tunnels.")
            ]
        },
        {
            "num": "1.4",
            "title": "Project Scope",
            "paragraphs": [
                "The functional scope of the ARGUS platform encompasses both defensive security operations and automated threat analysis. In scope are:",
                "1. Support for primary enterprise file types: Windows Portable Executable (PE32/PE64), Linux ELF binaries, Adobe Acrobat PDF documents, Microsoft Office legacy OLE/VBA macros, and shell scripts.",
                "2. Non-destructive static forensic decomposition: All analysis occurs in a strictly isolated, unprivileged sandbox environment without executing untrusted binaries on the host system, eliminating infection risks during triage.",
                "3. Machine learning-driven inference: Evaluation of binary feature vectors to calculate continuous maliciousness probability scores (0.0 to 1.0) and assign categorical risk verdicts (BENIGN, SUSPICIOUS, MALICIOUS, CRITICAL RANSOMWARE).",
                "4. Directional attack graph reconstruction: Mapping up to 100 concurrent forensic and telemetry nodes with directional edge relationships (e.g., GENERATED_HASH, DETECTED_INDICATOR, SPAWNED_PROCESS, CONNECTED_TO, MODIFIED_FILE, MITIGATED_BY).",
                "5. Autonomous defensive policy formulation: Real-time generation of concrete containment actions (Process Kill commands, iptables/Firewall rules, Token Revocations, Sandbox Sandboxing).",
                "Explicitly out of scope for this version is the live kernel-level hypervisor execution of live malware strains, which requires dedicated bare-metal nested virtualization clusters, and automated reverse engineering of encrypted zero-day firmware."
            ]
        }
    ]
}

CHAPTER_2 = {
    "title": "Chapter 2: Methodology",
    "sections": [
        {
            "num": "2.1",
            "title": "Introduction",
            "paragraphs": [
                "This chapter details the comprehensive engineering methodology, technological stack, analytical algorithms, and architectural rationale adopted during the design and development of the ARGUS Cyber Defense Platform. The platform combines deep binary forensic parsing, machine learning inference pipelines, graph-based event correlation, and adaptive defensive simulation. The methodologies chosen prioritize high execution speed, deterministic forensic integrity, modular extensibility, and user-centric security operations."
            ]
        },
        {
            "num": "2.2",
            "title": "Software Tools and Technologies",
            "paragraphs": [
                "The ARGUS system is architected as a decoupled, multi-tiered enterprise application comprising a modern web presentation tier, an asynchronous API gateway, a forensic parsing engine, and machine learning micro-services."
            ],
            "subsections": [
                {
                    "num": "2.2.1",
                    "title": "Frontend Development Stack",
                    "bullets": [
                        "React.js (v18.3): Modern component-based JavaScript framework utilizing declarative UI state management, custom reactive hooks, and virtual DOM diffing for rapid UI updates.",
                        "Vite (v5.4): Next-generation frontend build tooling offering instantaneous Hot Module Replacement (HMR) and optimized Rollup production bundling.",
                        "Tailwind CSS (v3.4): Utility-first CSS framework enabling a sleek, high-contrast, modern cybersecurity SaaS aesthetic with responsive breakpoints and semantic color tokens.",
                        "Lucide React: Scalable vector icon library providing intuitive visual indicators for file statuses, threat severities, forensic indicators, and defensive actions.",
                        "Interactive Graph Canvas: Custom SVG and Canvas-based directed graph visualizer supporting dynamic pan, zoom, node selection, edge inspection, and topology layout algorithms."
                    ]
                },
                {
                    "num": "2.2.2",
                    "title": "Backend API & Server-Side Architecture",
                    "bullets": [
                        "Python (v3.11/3.14): Core backend programming language chosen for its mature ecosystem in systems forensics, binary parsing, and data science.",
                        "FastAPI (v0.110): Asynchronous, high-performance web framework built on Starlette and Pydantic, providing automatic OpenAPI documentation, schema validation, and asynchronous coroutines.",
                        "Uvicorn: Lightning-fast ASGI web server implementation based on uvloop and httptools, handling concurrent asynchronous file uploads with minimal overhead.",
                        "Pydantic (v2.6): Strict data validation and settings management using Python type annotations, ensuring robust schema enforcement across forensic payloads.",
                        "NetworkX (v3.2): High-productivity Python package for the creation, manipulation, and topological analysis of complex directed networks and kill-chain DAGs."
                    ]
                },
                {
                    "num": "2.2.3",
                    "title": "Forensic & Machine Learning Frameworks",
                    "bullets": [
                        "pefile (v2023.2.7): Multi-platform Python module to parse and analyze Windows Portable Executable (PE) headers, sections, imports, exports, and debug directories.",
                        "oletools (v0.60): Specialized suite of python tools to analyze Microsoft OLE2 files, extract embedded VBA macros, and detect malicious code execution patterns.",
                        "PyMuPDF / fitz (v1.24): High-speed PDF parsing engine used to inspect binary streams, JavaScript actions, embedded attachments, and malicious annotations.",
                        "python-magic (v0.4): Libmagic wrapper for deterministic file type identification via file signatures and magic bytes rather than untrusted extensions.",
                        "Scikit-learn (v1.4): Comprehensive machine learning library used for feature extraction, ensemble classifier training, cross-validation, and performance metrics.",
                        "Joblib (v1.3): Optimized pipeline serialization tool for loading pre-trained machine learning weights and feature scalers into memory with zero warm-up penalty."
                    ]
                }
            ]
        },
        {
            "num": "2.3",
            "title": "Hardware Environment",
            "paragraphs": [
                "The ARGUS platform was designed and benchmarked to operate efficiently across both standard analyst workstations and cloud-native containerized environments.",
                "Workstation Development Environment: Apple Silicon / Intel Core i7 8-core CPU, 16 GB unified RAM, 512 GB NVMe SSD storage, macOS Sonoma / Ubuntu 22.04 LTS.",
                "Production / Cloud Runtime Specs: Multi-stage Docker container deployed on Linux x86_64 / arm64 host, 2 vCPU cores, 4 GB RAM, containerized disk volume with 10 GB temporary analysis workspace. The lightweight static analysis and pre-trained inference engines require minimal computational overhead, completing complete forensic triage in under 1.2 seconds per artifact."
            ]
        },
        {
            "num": "2.4",
            "title": "Data Preparation and Preprocessing",
            "paragraphs": [
                "Supervised malware detection models require representative, diverse, and well-labeled datasets to ensure high generalization and low false positive rates.",
                "1. Dataset Ingestion: Training and validation pipelines utilized the benchmark EMBER (Elastic Malware Benchmark for Empowering Researchers) dataset comprising 1.1 million Windows PE binary feature vectors, complemented by curated samples from the Malicia project and benign system binaries extracted from clean Windows 10/11 and Ubuntu distributions.",
                "2. Feature Engineering: For each binary artifact, 2,381 dimensional numerical feature vectors were derived, including byte histogram counts, 2D byte entropy matrices, PE section characteristics (virtual sizes, raw sizes, section names, entropy), import table hashes (ImpHash), and suspicious API token frequencies (e.g., VirtualAllocEx, WriteProcessMemory, CreateRemoteThread, RegSetValueEx, InternetOpenUrl).",
                "3. Normalization and Scaling: Continuous numerical features were transformed using robust standard scaling: z = (x - u) / s. Outlier values in byte counts and file sizes were clipped at the 99th percentile to prevent model bias.",
                "4. Train-Test Splitting: Data was partitioned into 80% training and 20% independent testing sets using stratified k-fold splits (k=5) to preserve label balance across benign, spyware, trojan, and ransomware classes."
            ]
        },
        {
            "num": "2.5",
            "title": "Machine Learning Algorithms",
            "paragraphs": [
                "ARGUS implements a multi-model ensemble strategy combining supervised decision trees, boosted ensembles, and statistical entropy analysis:"
            ],
            "subsections": [
                {
                    "num": "2.5.1",
                    "title": "Random Forest Classifier",
                    "paragraphs": [
                        "The Random Forest algorithm constructs an ensemble of 200 de-correlated decision trees using bootstrap aggregation (bagging) and random feature subspace sampling. At each split, the Gini impurity criterion is minimized to evaluate feature importance. Random Forest is highly resilient to overfitting on high-dimensional forensic feature sets, delivering exceptional stability across diverse malware families."
                    ]
                },
                {
                    "num": "2.5.2",
                    "title": "Gradient Boosted Decision Trees & LightGBM",
                    "paragraphs": [
                        "Gradient Boosting builds trees sequentially, where each successive learner minimizes the pseudo-residuals of the loss function via gradient descent. LightGBM optimizes this process using Histogram-based algorithm splitting and Exclusive Feature Bundling (EFB), enabling sub-10ms inference speeds during live API ingestion."
                    ]
                },
                {
                    "num": "2.5.3",
                    "title": "Support Vector Machines (SVM)",
                    "paragraphs": [
                        "SVM with a Radial Basis Function (RBF) kernel maps non-linear feature interactions into higher-dimensional Hilbert space, identifying an optimal maximum-margin hyperplane separating benign system utilities from stealthy trojan implants."
                    ]
                },
                {
                    "num": "2.5.4",
                    "title": "Shannon Entropy & Heuristic Packing Detection",
                    "paragraphs": [
                        "Shannon Entropy quantifies the average information density and randomness of binary bytes across a file or within individual sections:",
                        "H(X) = - SUM( P(xi) * log2(P(xi)) )",
                        "Unpacked, benign executable code generally exhibits an entropy score between 4.8 and 6.4. Encrypted payloads, packed binaries (UPX, Themida), and encrypted ransomware payloads exhibit entropy values approaching the theoretical maximum of 8.0 (typically H >= 7.2). ARGUS flags high-entropy sections as primary indicators of obfuscation."
                    ]
                }
            ]
        },
        {
            "num": "2.6",
            "title": "Rationale for Methodology Choices",
            "paragraphs": [
                "2.6.1 Technology Stack Rationale: FastAPI was selected over traditional WSGI frameworks (like Flask or Django) because native asynchronous coroutines allow multiple concurrent multi-megabyte file uploads without blocking worker threads. React with Tailwind CSS was chosen to achieve high UI responsiveness, clean contrast, and modular component reusability.",
                "2.6.2 Algorithm Selection Rationale: Tree-based ensemble models (Random Forest and LightGBM) demonstrate superior tabular forensic feature classification compared to deep neural networks, while requiring a fraction of the compute and providing explainable feature importance rankings (SHAP compatibility).",
                "2.6.3 User Experience Rationale: In modern SOC operations, seconds matter. ARGUS provides immediate visual hierarchy: high-severity alerts are badged with clear red semantic tags, quick inspection popups open with a single click, and the attack graph visualizer renders directional relationships rather than static tabular lists."
            ]
        },
        {
            "num": "2.7",
            "title": "Development Process",
            "paragraphs": [
                "The project followed an Agile iterative development methodology structured across bi-weekly sprints:",
                "Sprint 1: Architecture blueprinting, environment provisioning, and synthetic malware sample curation.",
                "Sprint 2: Static analysis parser implementation (pefile, oletools, PyMuPDF) and cryptographic hashing engines.",
                "Sprint 3: Machine learning feature vectorization, model training, cross-validation, and Joblib serialization.",
                "Sprint 4: Graph reconstruction engine design, topological sorting, and MITRE ATT&CK kill-chain mapping.",
                "Sprint 5: Automated defense simulation synthesizer and risk posture scoring implementation.",
                "Sprint 6: Full-stack integration, REST API client hooks, and modern light-theme UI design.",
                "Sprint 7: End-to-end regression testing, unit testing (21 Pytest cases), security audit, and containerized deployment."
            ]
        },
        {
            "num": "2.8",
            "title": "Testing Methodology",
            "paragraphs": [
                "A comprehensive multi-tiered testing strategy was adopted:",
                "1. Unit Testing: Automated Pytest test suite covering input sanitization, cryptographic digests, section entropy calculations, YARA rule matching, feature extraction vector shapes, and defense posture bounds.",
                "2. Integration Testing: Validating end-to-end API workflows from multipart file upload to forensic JSON generation and defense policy synthesis.",
                "3. API Verification: Exhaustive testing of HTTP response codes, JSON schemas, and payload integrity using Postman and HTTPX.",
                "4. User Acceptance Testing (UAT): Operational evaluation of UI navigation, modal cards, and responsive controls across multiple desktop and mobile viewports."
            ]
        },
        {
            "num": "2.9",
            "title": "Summary",
            "paragraphs": [
                "The methodology adopted in ARGUS unifies deterministic binary forensics, high-precision ensemble machine learning, topological graph correlation, and automated incident response into a cohesive, production-grade cybersecurity platform. By grounding architectural decisions in proven industry standards and rigorous empirical testing, ARGUS ensures rapid, explainable, and reliable threat triage."
            ]
        }
    ]
}
