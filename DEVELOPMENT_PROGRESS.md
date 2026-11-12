# Project ARGUS: System Development Progress & Milestone Architecture

**Project Title:** ARGUS — AI-Powered Digital Forensics, Attack Reconstruction & Defensive Simulation System  
**Academic Session:** 2026–2027 • Final Year B.Tech Capstone Project  
**Institution:** SRM University Delhi-NCR, Sonipat • Department of Computer Science & Engineering (Data Science & AI)  
**Target Environment:** macOS (ARM64) & Linux (x86_64 / POSIX Compliant)  
**Current Milestone:** Milestone 1 (Working Prototype) • Submission: Upcoming Monday  
**Final Submission:** Milestone 2 (Complete Platform) • Submission: Following Monday  

---

## 1. Milestone Architecture & Strategy

ARGUS is engineered around a clean, decoupled, milestone-based architecture designed for university evaluations:
- **Milestone 1 (Demonstrable Working Prototype)**: Delivers a rock-solid, demonstrable digital forensics, evidence extraction, attack reconstruction, and defensive simulation platform. Every button, route, model, and visualization is operational and verified by automated test suites.
- **Milestone 2 (Final System Expansion)**: Extends Milestone 1 with advanced threat intelligence (STIX/TAXII, MITRE ATT&CK mapping), automated incident response (SOAR playbooks), live hypervisor telemetry hooks, and distributed database deployment.
- **Architectural Scalability**: The core forensic engine, database schema, REST API, and React frontend share clean contracts (Pydantic v2 schemas and TypeScript types) so that no Milestone 1 code needs to be thrown away or rewritten for Milestone 2.

```mermaid
flowchart TD
    subgraph Presentation["Presentation Layer (React 19 + TypeScript + Tailwind CSS v4)"]
        UI_Dash["SOC Overview Dashboard"]
        UI_Ingest["File Ingestion & Cryptographic Quarantine"]
        UI_Evidence["Forensic Evidence & Findings Feed"]
        UI_Graph["Attack-Chain Reconstruction (React Flow + NetworkX)"]
        UI_Defense["Defensive Countermeasure Simulation & Live Console"]
        UI_ML["ML Evaluation & Benchmark Visualizer"]
        UI_Reports["Forensic Report Viewer & PDF Exporter"]
    end

    subgraph Gateway["API Gateway (FastAPI 0.115+ / Pydantic v2)"]
        API_Files["/api/v1/files/analyze"]
        API_Invs["/api/v1/investigations/*"]
        API_Telem["/api/v1/telemetry/*"]
        API_Defense["/api/v1/defense/*"]
        API_Metrics["/api/v1/metrics/* & /api/v1/models/*"]
        API_Health["/api/v1/health"]
    end

    subgraph CoreEngine["Forensic & AI Pipeline"]
        Ingestion["Secure Quarantine & Nonce SHA-256"]
        StaticEng["Multi-Format Parsers (PDF, DOCX, OLE, PE, Scripts, YARA)"]
        FeatureEng["14-Dimensional Vector Extractor"]
        MLEngine["Random Forest (Supervised) & Isolation Forest (Anomaly)"]
        Correlator["Causal Lineage & Behavioral Correlator"]
        DefenseEng["ARGUS Automated Countermeasure Engine"]
        XAI["Expert Synthesis Fallback + Local Ollama LLM"]
    end

    subgraph Storage["Persistence Layer"]
        DB[(SQLite / PostgreSQL Async via SQLAlchemy 2.0)]
        QuarantineFS[("data/quarantine/ (UUID Vault)")]
        ReportsFS[("reports/generated/ (*.pdf, *.json)")]
        MLFS[("ml/artifacts/ (*.joblib)")]
    end

    UI_Dash --> Gateway
    UI_Ingest --> Gateway
    UI_Evidence --> Gateway
    UI_Graph --> Gateway
    UI_Defense --> Gateway
    Gateway --> Ingestion
    Ingestion --> StaticEng
    StaticEng --> FeatureEng
    FeatureEng --> MLEngine
    MLEngine --> Correlator
    Correlator --> DefenseEng
    DefenseEng --> Storage
    CoreEngine --> Storage
```

---

## 2. Completed Modules (Tested & Verified)

All items listed below have been implemented, executed, and validated via automated pytest suites and frontend build checks.

### Module 1: Cryptographic Ingestion & Secure Quarantine
- **Status:** Complete (Tested)
- **Files:** `backend/app/services/ingestion/quarantine.py`, `backend/app/api/v1/endpoints/files.py`
- **Capabilities:**
  - Strict path traversal prevention using `os.path.basename` and secure UUID-based non-executable storage.
  - Zip-bomb defense with uncompressed size limits and recursive depth limits.
  - Streaming SHA-256 calculation for non-repudiation and cryptographic evidence integrity.
  - Magic-byte MIME detection validating real file headers vs. declared extensions.
  - Tested in `backend/tests/test_ingestion_and_security.py`.

### Module 2: Multi-Format Static Digital Forensics Engine
- **Status:** Complete (Tested)
- **Files:** `backend/app/services/static_analysis/analyzer.py`, `yara_rules/malware_rules.yar`
- **Capabilities:**
  - Non-executing parsing for PE binaries (via `pefile`), PDF streams (via `PyMuPDF`), Office XML DOCX, and legacy OLE VBA macros (via `oletools`).
  - Byte-level Shannon entropy calculation over 256-byte histograms detecting encrypted/packed segments.
  - Automated extraction of IPv4 addresses, hostnames, domains, and suspicious Win32 APIs (`VirtualAlloc`, `WriteProcessMemory`, `CreateRemoteThread`).
  - Precompiled YARA rule matching against signature definitions in `malware_rules.yar`.
  - Tested in `backend/tests/test_static_forensics.py`.

### Module 3: Dual Machine Learning Risk Quantification Engine
- **Status:** Complete (Tested)
- **Files:** `backend/app/services/feature_engineering/extractor.py`, `backend/app/services/ml_engine/model.py`, `backend/app/services/ml_engine/risk_scorer.py`
- **Capabilities:**
  - 14-dimensional normalized structural feature extraction.
  - Supervised Random Forest Classifier (Gini splitting, balanced class weights) predicting malware probability.
  - Unsupervised Isolation Forest Anomaly Detector identifying zero-day anomalies and packing artifacts.
  - Transparent 0–100 risk scoring algorithm with weighted breakdowns across static evidence, ML inference, and dynamic telemetry.
  - Tested in `backend/tests/test_ml_and_risk.py`.

### Module 4: Dynamic Telemetry & Causal Event Correlator
- **Status:** Complete (Tested)
- **Files:** `backend/app/services/behavioral_analysis/telemetry.py`, `backend/app/services/event_correlation/correlator.py`, `backend/app/api/v1/endpoints/telemetry.py`
- **Capabilities:**
  - Normalized JSON event ingestion (`PROCESS_CREATE`, `FILE_WRITE`, `FILE_DELETE`, `NETWORK_CONNECT`, `DNS_QUERY`, `REGISTRY_SET`).
  - Causal relation correlation (`SPAWNED`, `DROPPED_FILE`, `CONNECTED_OUTBOUND`, `CORRELATED_HASH`).
  - Live simulation endpoint (`POST /api/v1/telemetry/simulate/{id}`) generating realistic behavioral event traces.
  - Tested in `backend/tests/test_telemetry_correlation_graph.py`.

### Module 5: Graph-Based Attack Reconstruction
- **Status:** Complete (Tested)
- **Files:** `backend/app/services/attack_graph/builder.py`, `frontend/src/pages/ThreatGraph.tsx`, `frontend/src/components/graph/CustomNodes.tsx`
- **Capabilities:**
  - NetworkX directed causal graph generation.
  - React Flow (v12 / `@xyflow/react`) interactive visualization with custom node components.
  - Standardized entity taxonomy: `Initial Evidence`, `Simulated Process` / `Executed Process`, `Network Connection`, `Suspicious Activity`, and `Persistence Indicator`.
  - Connection styling distinguishing observed telemetry (solid line), simulated sandbox events (dashed line), and static inferred heuristic links (dotted line).
  - Explicit telemetry provenance badges (`OBSERVED`, `SIMULATED`, `INFERRED`).
  - Topology filtering by subsystem (Processes, Network C2, Filesystem) and real-time entity inspector drawer.
  - Dynamic sample switcher allowing quick toggling across active investigations.

### Module 6: Explainable AI (XAI) & Audit-Ready Report Generation
- **Status:** Complete (Tested)
- **Files:** `backend/app/services/explainable_ai/explainer.py`, `backend/app/services/report_generation/generator.py`
- **Capabilities:**
  - Deterministic expert synthesis engine translating forensic findings into plain-English explanations.
  - Local Ollama LLM integration (`mistral:latest`) with prompt-injection sanitization.
  - Academic-quality PDF generation via ReportLab with tables, risk badges, and playbooks.
  - Comprehensive structured JSON export for SIEM/SOAR ingestion.

### Module 7: ARGUS Defensive Simulation & Countermeasure Engine
- **Status:** Complete (Tested)
- **Files:** `backend/app/models/investigation.py` (`DefensiveAction`), `backend/app/schemas/defense.py`, `backend/app/services/defense_simulation/engine.py`, `backend/app/api/v1/endpoints/defense.py`, `frontend/src/pages/DefensiveSimulation.tsx`
- **Capabilities:**
  - Isolated memory sandbox architecture guaranteeing zero modification of physical host firewall tables or OS process states.
  - Clear quantification showing **Initial Threat Score**, **Recommended Defensive Action**, **Simulation Status**, **Residual Risk**, and **Mitigation Effectiveness**.
  - Side-by-side **Before vs. After Risk Comparison** widget showing initial score, mitigated residual score, and net threat neutralization delta.
  - Multi-select checkbox controls with **Select All / Deselect All** and **Simulate Selected Countermeasures** for targeted batch containment.
  - Automated synthesis of tailored countermeasures based on forensic findings:
    * **Network Containment:** Egress `iptables` drop rules, macOS `pf.conf` rules, and DNS sinkhole entries targeting active C2 IPs and domains.
    * **Process Termination:** Process tree revocation scripts (PowerShell `Stop-Process` and POSIX `pkill -9`).
    * **Adaptive Signature Immunization:** Dynamic compilation of custom YARA rules from observed byte patterns and strings.
    * **Host Artifact Revocation:** DACL permission stripping and immutable quarantine file locks.
  - Interactive single-action execution simulation, targeted batch simulation, and "Simulate Full Containment (Execute All)".
  - Real-time Monospace Containment Console streaming kernel filter and EDR kill telemetry with one-click log copy.
  - Complete ruleset export modal bundling production-ready bash firewall scripts, YARA rule definitions, and PowerShell playbooks.
  - Tested in `backend/tests/test_defensive_simulation.py` and `backend/tests/test_full_system_verification.py`.

### Module 8: Refined ARGUS Product Identity & Dark Cybersecurity UI
- **Status:** Complete (Tested)
- **Files:** `frontend/src/components/layout/Navbar.tsx`, `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/pages/Overview.tsx`, `frontend/src/pages/Investigate.tsx`, `frontend/src/pages/InvestigationDetail.tsx`, `frontend/src/pages/MlEvaluation.tsx`, `frontend/src/pages/Reports.tsx`, `frontend/src/pages/Settings.tsx`
- **Capabilities:**
  - **Product Identity:** Unified branding as *ARGUS – AI Cyber Attack & Defense Simulation Platform* with subtitle *Digital Forensics, Threat Intelligence and Adaptive Defense*.
  - **Academic Integration:** University metadata housed in an interactive "About ARGUS" modal rather than cluttered across the main header.
  - **Clean Cybersecurity Aesthetic:** Deep navy backgrounds (`#070b14`), subtle cyan accents, consistent typography, professional tables, and elimination of distracting neon glows or animations.
  - **Dashboard:** Standardized metrics (*Evidence Files Analyzed*, *Detected Threats*, *Critical Incidents*, *High-Risk Findings*, *Investigation Activity*, *Recent Security Events*) with informative tooltips and interactive click-to-filter capability.
  - **Forensic Investigation:** Drag-and-drop ingestion with supported formats list, 50MB limit, file integrity hashing, evaluation sample fixture presets, analysis progress bar, and expandable technical evidence drawers.
  - **Investigation Detail & Attribution:** Copyable SHA-256 header, complete file metadata, structured **Risk Attribution & Scoring Decomposition** card (Evidence pts, ML prob pts, Behavioral pts, Anomaly pts), and **Export Evidence JSON** button.
  - **Scientific ML Presentation:** Dataset parameters, 80/20 train/test split, Random Forest vs. Isolation Forest, confusion matrix (TP, FP, TN, FN), error rates, Gini feature importance, and explicit synthetic benchmark disclaimer.
  - **Formal Case Reports:** Case archives featuring Evidence ID tags (`ARG-XXXXXXXX`), cryptographic digests with one-click copy, chain of custody timestamps, deduplicated records, formal case dossier modal, and PDF export.

---

## 3. Partially Implemented Modules

These modules have functioning baseline capabilities in Milestone 1 and are slated for extended depth in Milestone 2:

| Module | Current Status in Milestone 1 | Milestone 2 Extension Plan |
|---|---|---|
| **Live Hypervisor Agent Hooks** | Ingestion via normalized JSON API (`POST /api/v1/telemetry/import`) & synthetic generator (`POST /api/v1/telemetry/simulate/{id}`) | Direct agent daemon hooks into KVM/QEMU, VMware Guest Tools, or Windows Sysmon event forwarders |
| **Local LLM Forensic Synthesis** | Deterministic Expert System fallback is 100% operational; Ollama client configured for `mistral:latest` | Fine-tuned cybersecurity LoRA adapter for local Ollama, automated hypothesis generation, and conversational Q&A over forensic evidence |

---

## 4. Pending Modules (Milestone 2 Roadmap)

The following modules will be developed and integrated for the final project submission:

1. **Threat Intelligence Feed Ingestion (STIX 2.1 / TAXII / MISP)**
   - Continuous ingestion of external threat intelligence feeds.
   - Indicator matching against AlienVault OTX, AbuseIPDB, and VirusTotal v3 API.
   - Interactive MITRE ATT&CK Matrix Navigator mapping observed TTPs to Enterprise matrix techniques.

2. **Automated Incident Response (SOAR) Integration**
   - Webhook dispatchers for Slack, Microsoft Teams, and PagerDuty incident alerting.
   - Active Directory LDAP account disablement and Kerberos ticket revocation simulation.
   - Forensic chain of custody cryptographic verification with Merkle tree audit logging.

3. **Multi-Node Distributed Architecture & Cloud Deployment**
   - Asynchronous worker queues powered by Celery & Redis for high-throughput concurrent sample ingestion.
   - PostgreSQL 16 async migration with TimescaleDB extension for high-velocity telemetry events.
   - Production Docker Compose and Kubernetes Helm chart configurations.

---

## 5. API Endpoints Catalogue

All endpoints run under prefix `/api/v1` and are fully interactive via Swagger docs at `http://localhost:8000/docs`.

### File Ingestion & Analysis
- `POST /api/v1/files/analyze`: Multipart file upload. Ingests, quarantines, parses static forensics, extracts 14-dim features, executes ML inference, correlates attack graph, and returns `InvestigationSummary`.

### Investigations & Evidence
- `GET /api/v1/investigations`: Query investigations with optional filters (`risk_level`, `search`, `limit`).
- `GET /api/v1/investigations/{id}`: Detailed investigation record with metadata, risk score, and coverage.
- `GET /api/v1/investigations/{id}/evidence`: Categorized forensic evidence items (`METADATA`, `ENTROPY`, `STRINGS`, `NETWORK`, `EMBEDDED`, `YARA`, `STRUCTURE`).
- `GET /api/v1/investigations/{id}/events`: Behavioral telemetry events associated with the investigation.
- `GET /api/v1/investigations/{id}/graph`: React Flow nodes and edges representing causal attack graph.
- `GET /api/v1/investigations/{id}/report`: Structured JSON forensic report.
- `GET /api/v1/investigations/{id}/report/pdf`: Download compiled ReportLab PDF document.

### Behavioral Telemetry
- `POST /api/v1/telemetry/import`: Ingest normalized dynamic JSON telemetry from sandboxes.
- `POST /api/v1/telemetry/simulate/{id}`: Generate synthetic behavioral telemetry and re-correlate graph.

### Defensive Simulation (New in Milestone 1)
- `GET /api/v1/defense/plan/{investigation_id}`: Synthesizes or retrieves automated defensive countermeasure plan.
- `POST /api/v1/defense/action/{investigation_id}/{action_id}/execute`: Simulates execution of a single countermeasure and updates residual posture.
- `POST /api/v1/defense/{investigation_id}/execute-all`: Simulates full execution of all proposed countermeasures.
- `POST /api/v1/defense/{investigation_id}/reset`: Resets all countermeasures to PROPOSED state.

### Metrics & ML Evaluation
- `GET /api/v1/metrics/overview`: Aggregated SOC KPIs, risk distributions, and recent telemetry activity.
- `GET /api/v1/models/evaluation`: Performance metrics for Random Forest and Isolation Forest (Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix).
- `POST /api/v1/models/retrain`: Retrain ML benchmark models on updated dataset.

### System Health
- `GET /api/v1/health`: System health status, database connection, YARA engine, and Ollama status.

---

## 6. Database Schema Specification

Database engine: SQLite default (local development) / PostgreSQL ready (async SQLAlchemy 2.0).

```mermaid
erDiagram
    INVESTIGATIONS ||--o{ EVIDENCE_ITEMS : "has many"
    INVESTIGATIONS ||--o{ BEHAVIORAL_EVENTS : "logs"
    INVESTIGATIONS ||--o{ EVENT_CORRELATIONS : "identifies"
    INVESTIGATIONS ||--|| ATTACK_GRAPHS : "constructs"
    INVESTIGATIONS ||--|| FORENSIC_REPORTS : "generates"
    INVESTIGATIONS ||--o{ DEFENSIVE_ACTIONS : "contains"

    INVESTIGATIONS {
        string id PK "UUID"
        string original_name "Original filename"
        string stored_name "Randomized quarantine filename"
        string file_path "Absolute path in quarantine"
        string sha256 "SHA-256 cryptographic hash (Index)"
        int file_size_bytes "Size in bytes"
        string file_type "MIME / Format type"
        string status "QUEUED, PROCESSING, COMPLETED, FAILED"
        float risk_score "Quantified risk 0 to 100"
        string risk_level "LOW, MEDIUM, HIGH, CRITICAL"
        float confidence_score "0.0 to 1.0"
        float coverage_score "0.0 to 1.0"
        boolean is_synthetic "Synthetic indicator"
        datetime created_at "UTC timestamp (Index)"
        datetime completed_at "Completion timestamp"
    }

    EVIDENCE_ITEMS {
        string id PK "UUID"
        string investigation_id FK "References investigations.id"
        string category "METADATA, ENTROPY, STRINGS, NETWORK, YARA"
        string title "Finding title"
        text description "Detailed description"
        string severity "INFO, LOW, MEDIUM, HIGH, CRITICAL"
        text observed_value "Observed byte / string / indicator"
        string extraction_source "Parser / module name"
        string offset_or_location "Byte offset or section"
        text explanation "Forensic rationale"
        float confidence "Confidence score 0.0 - 1.0"
        text limitations "Known analysis limitations"
    }

    BEHAVIORAL_EVENTS {
        string id PK "UUID"
        string investigation_id FK "References investigations.id"
        string event_type "PROCESS_CREATE, FILE_WRITE, NETWORK_CONNECT"
        datetime timestamp "Event timestamp"
        int process_id "PID"
        string process_name "Process executable name"
        int parent_process_id "PPID"
        string parent_process_name "Parent executable"
        text command_line "CLI invocation"
        string target_path "Target filesystem path"
        string destination_ip "Remote IP"
        int destination_port "Remote Port"
        string domain "Queried domain"
        boolean is_simulated "Simulation flag"
    }

    EVENT_CORRELATIONS {
        string id PK "UUID"
        string investigation_id FK "References investigations.id"
        string relation_type "SPAWNED, DROPPED_FILE, CONNECTED_OUTBOUND"
        string source_entity "Source node"
        string target_entity "Target node"
        text reason "Causal explanation"
        float confidence "Correlation confidence"
    }

    ATTACK_GRAPHS {
        string id PK "UUID"
        string investigation_id FK "Unique FK to investigations.id"
        text nodes_json "Serialized React Flow nodes"
        text edges_json "Serialized React Flow edges"
        text summary "High-level attack summary"
        text missing_evidence_notes "Hypothesis gaps"
    }

    FORENSIC_REPORTS {
        string id PK "UUID"
        string investigation_id FK "Unique FK to investigations.id"
        text executive_summary "Executive summary narrative"
        string pdf_path "Filesystem path to generated PDF"
        text json_data "Full JSON export"
        text defensive_actions "Serialized action playbook"
        string generated_by "DETERMINISTIC_EXPERT_SYSTEM or OLLAMA"
    }

    DEFENSIVE_ACTIONS {
        string id PK "UUID"
        string investigation_id FK "References investigations.id"
        string category "NETWORK_CONTAINMENT, PROCESS_TERMINATION, SIGNATURE_DEPLOYMENT, HOST_ISOLATION"
        string title "Action title"
        text description "Action description"
        string target "Target IP, domain, process, or file"
        text rule_syntax "Generated iptables / pf / PowerShell / YARA syntax"
        string status "PROPOSED, SIMULATING, VERIFIED_BLOCKED, FAILED"
        float risk_reduction "Risk points mitigated"
        text simulated_output "Simulated terminal execution output"
        datetime created_at "Creation timestamp"
        datetime executed_at "Execution timestamp"
    }
```

---

## 7. Known Bugs & System Limitations

| Item | Description | Severity | Current Mitigation |
|---|---|---|---|
| **Defensive Simulation Data Mismatch** | Uploading safe sample (`ARGUS_safe_test_sample.txt`, 6.2/100, LOW) resulted in Defensive Simulation defaulting to `urgent_action_document.pdf` (90.6/100, CRITICAL) due to client-side risk score auto-sort selection. | Critical (Resolved) | **Fixed:** Removed auto-sort fallback in `DefensiveSimulation.tsx` and `ThreatGraph.tsx`. Added persistent `sessionStorage` synchronization in `App.tsx`, active investigation metadata banner with copyable SHA-256, dedicated "Select an Investigation" empty state, dynamic targeted fallback, and verified residual risk calculation. Backend residual floor cap adjusted from 5.0 to 0.0. Full verification passed for both `ARGUS_safe_test_sample.txt` (6.2/100) and `urgent_action_document.pdf` (90.6/100). |
| **Python 3.14 Upstream SWIG Warnings** | Python 3.14 deprecation warnings appear in third-party C-bindings (`yara-python` and `oletools.olevba`). | Low (Cosmetic) | Non-fatal warnings captured cleanly by pytest. All parsers execute successfully without runtime errors. |
| **Sandboxed Socket Loopback** | Direct TCP socket curl to `127.0.0.1:8000` is restricted by terminal sandbox proxy policies. | Low (Environment) | Resolved via in-process ASGI test harness (`httpx.ASGITransport(app=app)`) providing 100% test coverage inside the sandbox. Unsandboxed browser and Vite dev server access operate normally. |
| **Pydantic V2 Config Deprecation** | Deprecation warnings originally surfaced from legacy class-based `Config` declarations. | Resolved | Migrated all schemas in `backend/app/schemas/` to `model_config = ConfigDict(from_attributes=True)`. |

### Defensive Simulation Investigation Consistency Verification Report

Comprehensive validation was performed across the dual test cases specified:

1. **Test Case 1: Low-Risk Safe Sample (`ARGUS_safe_test_sample.txt`)**
   - **Investigation ID:** `608cec34-2cf2-4ae1-bc47-92786af5c7ec`
   - **SHA-256:** `f91a295d1441a8c49de03b664b21aed04d7247aa206faeb92d311b9432412fd2`
   - **Initial Threat Score:** `6.2 / 100` (`LOW`)
   - **Defensive Simulation Initial Posture:** Exactly matches `6.2 / 100` (`LOW`) with Emerald badge styling.
   - **Countermeasures Generated:** 4 tailored actions with proportional risk reductions:
     - *Block Egress & Ingress C2 Traffic (192.0.2.55):* `-2.2 pts`
     - *Host Memory Scanner & Thread Suspension:* `-1.4 pts`
     - *Compile & Deploy Adaptive YARA Rule:* `-1.6 pts`
     - *Host Artifact Revocation & Access Lockdown:* `-1.1 pts`
   - **Execution Simulation:** Single action execution drops risk to `4.0 / 100` (`LOW`, 35.5% efficacy). Full fleet containment drops residual risk to `0.0 / 100` (`LOW`, 100% efficacy).
   - **Reset Posture Verification:** Successfully restores initial score to `6.2 / 100` (`LOW`).

2. **Test Case 2: High-Risk Malicious Document (`urgent_action_document.pdf`)**
   - **Investigation ID:** `10ea3234-354c-4b51-8d66-2e9341b2b3fe`
   - **SHA-256:** `47b693094713d8f4bab0982895af7c4478efab7606a05039e0c6b0c38c1000fa`
   - **Initial Threat Score:** `90.6 / 100` (`CRITICAL`)
   - **Defensive Simulation Initial Posture:** Exactly matches `90.6 / 100` (`CRITICAL`) with Crimson badge styling.
   - **Countermeasures Generated:** 4 high-severity containment actions:
     - *Block Egress & Ingress C2 Traffic (185.196.11.42):* `-28.0 pts`
     - *Terminate Process Tree (AcroRd32.exe):* `-25.0 pts`
     - *Compile & Deploy Adaptive YARA Rule:* `-20.0 pts`
     - *Host Artifact Revocation & Access Lockdown:* `-14.0 pts`
   - **Execution Simulation:** Single action execution drops risk to `62.6 / 100` (`HIGH`, 30.9% efficacy). Full fleet containment drops residual risk to `3.6 / 100` (`LOW`, 96.0% efficacy).
   - **Reset Posture Verification:** Successfully restores initial score to `90.6 / 100` (`CRITICAL`).

3. **Cross-Module Consistency:**
   - Filename, SHA-256 hash, risk score, and severity level are synchronized and identical across *Evidence Details*, *Attack Reconstruction*, *Defensive Simulation*, and *Forensic Reports*.
   - When no investigation is selected, *Defensive Simulation* and *Attack Reconstruction* render a clean "Select an Investigation" prompt with dropdown selectors, eliminating arbitrary fallback to sample data.

---

## 8. Next Development Tasks (Milestone 2 Action Plan)

The following development tasks are scheduled for execution following the Milestone 1 evaluation:

1. **Task M2-1 (Threat Intel Integration):** Create `backend/app/services/threat_intelligence/` with AlienVault OTX, VirusTotal v3, and AbuseIPDB indicator lookup caches.
2. **Task M2-2 (MITRE ATT&CK Matrix):** Map extracted evidence categories and correlation relations to Enterprise ATT&CK matrix technique IDs (e.g., T1059.001 for PowerShell, T1071.001 for Web Protocols).
3. **Task M2-3 (Automated Incident Response Workflows):** Implement bidirectional webhook dispatchers and automated SOAR response ticketing.
4. **Task M2-4 (High-Throughput Ingestion Queue):** Implement Celery task workers with Redis broker for asynchronous background file batch processing.
5. **Task M2-5 (Live VM Hypervisor Connector):** Build lightweight Python guest agent for automated VM snapshot, sample execution, and telemetry streaming via WebSocket.
6. **Task M2-6 (Deployment Packaging):** Assemble production Docker Compose multi-stage builds, Nginx reverse proxy configuration, and deployment documentation.
