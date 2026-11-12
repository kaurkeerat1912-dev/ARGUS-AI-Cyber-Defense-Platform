# ARGUS — AI-Powered Malicious File Forensics & Threat Reconstruction System
## Capstone Live Project: 2nd Evaluation Submission Report

**Academic Session:** 2026–2027  
**Institution:** SRM University Delhi-NCR, Sonipat  
**Department:** Computer Science & Engineering (Data Science & Artificial Intelligence)  
**Degree:** Bachelor of Technology (B.Tech) - 4th Year  
**Project Title:** AI-Powered Malicious File Forensics and Threat Reconstruction System (ARGUS)  
**Student Name:** Keerat Kaur  
**Evaluation Stage:** 2nd Evaluation (Mid-Term Architecture, ML Models & Working Prototype)  

---

## 1. Executive Summary & Problem Statement

Modern cyber threats increasingly exploit untrusted files (weaponized PDFs with `/JavaScript` and `/Launch` actions, macro-enabled Office documents, masqueraded executables like `invoice.pdf.exe`, and polymorphic scripts) distributed via WhatsApp, Telegram, email, and web downloads.

Conventional endpoint defenses and commercial antivirus suites present two major limitations:
1. **Black-box decisions:** Antivirus alerts flag files with arbitrary signatures or opaque verdicts without reproducible forensic artifacts required for forensic admissibility in court or enterprise incident response.
2. **Generative AI hallucination & prompt injection:** Naively asking LLMs to classify raw files introduces severe vulnerabilities to indirect prompt injection (where malicious text inside the document commands the AI to declare the file benign).

### The ARGUS Solution
**ARGUS** is an end-to-end, host-safe defensive digital forensics platform engineered for complete transparency, explainability, and defensibility:
- **Zero Host Execution:** Safely parses untrusted binaries and documents strictly in memory using static byte parsers without executing hostile code.
- **Dual-Engine Machine Learning:** Combines a supervised **Balanced Random Forest** (100 estimators) with an unsupervised **Isolation Forest** on a 14-dimensional normalized forensic feature vector.
- **Causal Threat Graph Reconstruction:** Employs **NetworkX** to build causal entity-relationship attack graphs distinguishing between `OBSERVED`, `INFERRED`, and `SIMULATED` threat actions.
- **Defensive Simulation & Automated Remediation:** Interactive cyber range calculating residual risk reduction and generating one-click SOC remediation scripts (firewall rules, process termination, hash blacklisting) and incident response playbooks.
- **Cryptographic Admissibility:** Every investigation generates immutable SHA-256 hashes, byte entropy metrics, extraction offsets, and downloadable court-admissible PDF forensic reports.

---

## 2. Evaluation 2 Deliverables & Implementation Checklist

| Deliverable Component | Status | Academic & Technical Implementation |
| :--- | :---: | :--- |
| **Secure Quarantine & Ingestion** | ✅ Complete | Path traversal sanitization, zip-bomb expansion ratio defense (>100:1 cutoff), SHA-256 cryptographic hashing, UUID quarantine isolation |
| **Multi-Format Static Forensics** | ✅ Complete | Parsers for PDF (PyMuPDF), Office (oletools/olevba), PE Binaries (pefile), Scripts (regex, AST), Shannon entropy calculation |
| **YARA Signature Matching** | ✅ Complete | Native compiled YARA rule engine (`yara_rules/malware_rules.yar`) detecting shellcode, dropper patterns, and suspicious imports |
| **14-Dimensional ML Feature Vector** | ✅ Complete | Extracted feature vector bridging structural properties, byte randomness, IOC counts, API risks, and macro presence |
| **Hybrid ML Classification** | ✅ Complete | Balanced Random Forest (100% test accuracy on benchmark corpus) + Isolation Forest (unsupervised anomaly detection) |
| **Multi-Layer Forensic Coverage** | ✅ Complete | 92%–94% baseline coverage for static forensics, expanding to 100% when dynamic sandbox telemetry is attached |
| **Dynamic Telemetry & Lineage Correlation** | ✅ Complete | Ingestion of sandbox JSON events; parent-child process tree (`SPAWNED`), network sockets (`CONNECTED`), and file drops (`DROPPED`) |
| **Threat Reconstruction Graph** | ✅ Complete | Interactive Directed Causal Graph rendered via React Flow with state synchronization and evidence provenance |
| **Defensive Simulation Engine** | ✅ Complete | Dynamic residual risk calculation, 4 SOC remediation action pillars, 1-click executable shell scripts, and downloadable playbooks |
| **Forensic Report Generator** | ✅ Complete | Production ReportLab PDF compiler with forensic integrity seals and raw JSON export |
| **Interactive SOC Dashboard** | ✅ Complete | Dark-mode modern cybersecurity console built with React 19, TypeScript, Tailwind CSS, Lucide icons, and Recharts |
| **Automated Test Suite** | ✅ Complete | 21 comprehensive pytest unit/integration tests passing in ~3s; Vite TypeScript build zero errors |

---

## 3. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Presentation Layer (React 19 + TypeScript + Vite)"]
        UI_Dash["SOC Overview Dashboard"]
        UI_Inv["Secure Ingestion & Analysis"]
        UI_Det["Evidence & IOC Inspector"]
        UI_Graph["Attack Reconstruction Graph (React Flow)"]
        UI_Sim["Defensive Simulation & Remediation"]
        UI_Rep["Forensic Report & Audit Exporter"]
    end

    subgraph API["FastAPI Application Gateway (Port 8000)"]
        R_Files["/api/v1/files/analyze"]
        R_Invs["/api/v1/investigations"]
        R_Telem["/api/v1/telemetry"]
        R_Sim["/api/v1/simulations"]
        R_Health["/api/v1/health"]
    end

    subgraph Core["Core Forensic & ML Engines"]
        Ingest["Quarantine & Integrity Handler"]
        Static["Non-Executing Static Parsers (PDF, OLE, PE, Scripts, YARA)"]
        Entropy["Shannon Byte Entropy Calculator"]
        FeatExt["14-Dimensional Feature Vector Extractor"]
        ML_RF["Random Forest Supervised Classifier"]
        ML_IF["Isolation Forest Anomaly Detector"]
        RiskEngine["Transparent Multi-Factor Risk Scorer"]
        GraphEngine["NetworkX Causal Lineage Correlator"]
        DefenseEngine["Defensive Posture & Residual Risk Calculator"]
    end

    subgraph Storage["Storage & Evidence Persistence"]
        DB[(SQLite Async Database: forensics.sqlite3)]
        QuarantineStore[("data/quarantine/ (UUID Sandboxed)")]
        ReportStore[("reports/generated/ (PDF & JSON)")]
        MLStore[("ml/artifacts/ (Trained Models & Metrics)")]
    end

    Client -->|REST & JSON API| API
    API --> Ingest
    Ingest --> Static
    Static --> Entropy
    Static --> FeatExt
    FeatExt --> ML_RF & ML_IF
    ML_RF & ML_IF --> RiskEngine
    RiskEngine --> GraphEngine
    RiskEngine --> DefenseEngine
    GraphEngine --> DB
    DefenseEngine --> DB
    RiskEngine --> ReportStore
    DB --> API
```

---

## 4. Machine Learning & Risk Quantification Methodology

### 4.1 The 14-Dimensional Forensic Feature Vector
Raw files cannot be directly fed into tabular machine learning algorithms. ARGUS extracts a specialized 14-dimensional feature vector:

$$\vec{x} = \begin{bmatrix}
x_1: \text{file\_size\_kb} \\
x_2: \text{shannon\_entropy} \\
x_3: \text{url\_count} \\
x_4: \text{ip\_count} \\
x_5: \text{domain\_count} \\
x_6: \text{embedded\_objects\_count} \\
x_7: \text{yara\_matches\_count} \\
x_8: \text{critical\_evidence\_count} \\
x_9: \text{high\_evidence\_count} \\
x_{10}: \text{medium\_evidence\_count} \\
x_{11}: \text{suspicious\_api\_count} \\
x_{12}: \text{macro\_present} \\
x_{13}: \text{double\_extension} \\
x_{14}: \text{script\_patterns\_count}
\end{bmatrix}$$

### 4.2 Shannon Byte Entropy Formulation
Shannon entropy measures byte-level randomness across 256 possible byte values ($0 \le H(X) \le 8.0$):
$$H(X) = -\sum_{i=0}^{255} P(b_i) \log_2 P(b_i)$$
- **Benign plaintext & code:** $H(X) \approx 3.5 - 5.2$
- **Compressed data (ZIP, JPEG):** $H(X) \approx 6.8 - 7.6$ (legitimate high entropy)
- **Packed or Encrypted Malware (UPX, Ransomware payloads):** $H(X) \ge 7.4$ (correlated with absent digital signatures or missing section headers)

### 4.3 Dual-Model Inference Strategy
1. **Supervised Balanced Random Forest (`ml/artifacts/random_forest_model.joblib`):**
   - 100 decision trees with balanced class weighting to handle minority class malicious samples.
   - Evaluates non-linear boundaries across multi-dimensional indicator spaces.
2. **Unsupervised Isolation Forest (`ml/artifacts/isolation_forest_model.joblib`):**
   - Trained on benign reference baselines with contamination factor $\alpha = 0.08$.
   - Quantifies zero-day novelty and structural anomalies that bypass static signatures.

---

## 5. Defensive Simulation & Automated Remediation Solutions

The Defensive Simulation module (`backend/app/services/defense_simulation/engine.py` & `frontend/src/pages/DefensiveSimulation.tsx`) addresses post-analysis incident response:
1. **State Synchronization:** Eliminates arbitrary fallbacks; strictly binds to the active forensic investigation ID, preserving file metadata, SHA-256, and initial threat score.
2. **Dynamic Residual Risk Formula:**
   $$\text{Residual Risk} = \max\left(0.0, \; \text{Initial Risk} \times \prod_{i \in \text{Applied}} (1.0 - \text{Mitigation Factor}_i) \right)$$
3. **Four Concrete Remediation Pillars:**
   - **Network Containment:** Auto-generates `iptables` / `pfctl` rules blocking extracted malicious C2 IPs and domains.
   - **Process Neutralization:** Auto-generates commands to terminate malicious child PIDs and revoke runtime privileges.
   - **Fleet Immunization:** Emits enterprise EDR commands and PowerShell/Bash scripts to push SHA-256 blacklists across the subnet.
   - **Lateral Lockdown:** Isolates network adapter configurations to halt internal lateral movement.
4. **Actionable Deliverables for Incident Responders:**
   - **One-Click Script Copy:** Instant copy of complete Bash remediation script tailored to the exact investigation IOCs.
   - **Downloadable IR Playbook (.txt):** Standalone, auditable incident response checklist for SOC analysts.

---

## 6. Project Directory & Codebase Structure

```
malicious-file-forensics/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & middleware
│   │   ├── core/
│   │   │   ├── config.py               # Global settings, paths & thresholds
│   │   │   ├── security.py             # File quarantine, SHA-256 & sanitization
│   │   │   └── database.py             # Async SQLAlchemy SQLite/PostgreSQL engine
│   │   ├── models/
│   │   │   └── forensics.py            # ORM schemas (Investigations, Evidence, Graphs)
│   │   ├── routers/
│   │   │   ├── files.py                # Upload & asynchronous analysis endpoints
│   │   │   ├── investigations.py       # Investigation query & state management
│   │   │   ├── telemetry.py            # Dynamic sandbox telemetry ingestion
│   │   │   ├── simulation.py           # Defensive simulation & remediation endpoints
│   │   │   └── reports.py              # PDF and JSON report generation endpoints
│   │   └── services/
│   │       ├── static_engine/          # Deep byte parsers (PDF, PE, OLE, Scripts)
│   │       ├── ml_engine/              # Feature extraction & Random Forest/Isolation Forest
│   │       ├── graph_engine/           # NetworkX causal attack graph reconstruction
│   │       ├── defense_simulation/     # Countermeasure evaluation & residual risk
│   │       └── report_engine/          # ReportLab court-admissible PDF compiler
│   ├── requirements.txt                # Python backend dependencies
│   └── tests/                          # 21 automated pytest test suites
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                     # Routing & global investigation state synchronization
│   │   ├── pages/
│   │   │   ├── Overview.tsx            # SOC home dashboard, threat metrics & quick-test files
│   │   │   ├── Investigate.tsx         # File drag-and-drop & live analysis progress
│   │   │   ├── InvestigationDetail.tsx # Granular evidence, IOC table & coverage gauge
│   │   │   ├── ThreatGraph.tsx         # Interactive React Flow threat reconstruction graph
│   │   │   ├── DefensiveSimulation.tsx # Interactive cyber defense & remediation playbook
│   │   │   └── Reports.tsx             # Audit report preview, PDF & JSON downloaders
│   │   ├── services/
│   │   │   └── api.ts                  # Axios API client binding with backend
│   │   └── types/
│   │       └── forensics.ts            # TypeScript interfaces for forensic contracts
│   ├── package.json                    # Frontend dependencies & scripts
│   └── vite.config.ts                  # Vite build configuration
│
├── ml/
│   ├── artifacts/                      # Serialized models (.joblib) & evaluation metrics
│   ├── datasets/                       # Feature matrix training datasets
│   └── training/                       # Training & validation scripts
│
├── docs/
│   ├── ARCHITECTURE.md                 # Detailed technical specifications & database schema
│   ├── VIVA_PREPARATION.md             # Theoretical questions & comprehensive viva answers
│   └── EVALUATION_2_SUBMISSION_REPORT.md # This official evaluation document
│
├── sample_data/                        # Safe, suspicious, and dynamic telemetry test samples
├── yara_rules/                         # Compiled YARA threat detection rules
├── scripts/                            # One-click startup scripts
├── forensics.sqlite3                   # Persistent SQLite investigation database
├── conftest.py                         # Pytest configuration & environment hooks
└── README.md                           # Master project manual & setup instructions
```

---

## 7. How to Execute & Verify the Project

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### Method 1: Using the Startup Scripts (Recommended)

**Terminal 1 (Backend):**
```bash
./scripts/run_backend.sh
```
*Starts FastAPI on `http://localhost:8000` with Swagger documentation at `http://localhost:8000/docs`.*

**Terminal 2 (Frontend):**
```bash
./scripts/run_frontend.sh
```
*Starts the Vite React SOC Console on `http://localhost:5173`.*

---

### Method 2: Manual Terminal Commands

**Terminal 1 (Backend):**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

---

### Running the Test Suite
To demonstrate system stability and test coverage to the evaluator:
```bash
source .venv/bin/activate
pytest backend/tests/ -v
```
*Result: 21 passing tests covering file ingestion, static parsers, ML feature extraction, risk scoring, threat reconstruction graphs, and defensive simulation.*

---

## 8. Key Viva Voce Questions & Answers for 2nd Evaluation

### Q1: What is the primary novelty of ARGUS compared to traditional antivirus tools?
**Answer:**  
Antivirus tools act as closed-source decision engines that output opaque verdicts ("Threat detected: Trojan.Generic"). In contrast, ARGUS is a **forensic-grade explainable platform**:
1. It extracts observable, verifiable evidence (exact byte offsets, Shannon entropy, AST script patterns, YARA rule hits, Win32 API calls).
2. It feeds these features into a calibrated dual-model ML pipeline that separates known threat behaviors from zero-day structural anomalies.
3. It reconstructs dynamic process and network lineage using causal graph modeling (`OBSERVED` vs. `INFERRED`).
4. It outputs actionable defensive countermeasures with executable containment scripts.

### Q2: Why use both Random Forest and Isolation Forest?
**Answer:**  
- **Random Forest (Supervised):** Excels at identifying known malware patterns by learning non-linear feature splits from historical malicious and benign samples.
- **Isolation Forest (Unsupervised):** Fits strictly on benign baseline distributions. Because anomalies are "few and different," novel zero-day malware or newly packed samples require significantly fewer tree partitions to isolate. The combination ensures high precision for known threats and high recall for zero-day threats.

### Q3: How do you guarantee host safety when analyzing potentially hostile files?
**Answer:**  
ARGUS enforces a **Zero-Execution Architecture**:
1. Files are stored in a quarantined sandbox directory (`data/quarantine/`) under randomized UUIDs with execution permissions stripped (`chmod 0600`).
2. Analysis is performed strictly using non-executing byte-level static parsers (`PyMuPDF` for PDF tokenization, `oletools` for OLE macro stream extraction, and `pefile` for PE binary headers).
3. Host system execution (`exec()`, `subprocess.Popen()`, `os.system()`) is strictly prohibited.
4. Path traversal attempts (`../../`) and archive bombs (expansion ratio $> 100:1$) are intercepted and quarantined at ingestion.

---

## 9. Next Steps for Final (3rd) Evaluation
1. Expansion of dynamic sandbox telemetry connectors (automated Cuckoo / CAPE sandbox integration).
2. Integration of local Ollama LLM for automated narrative executive summaries.
3. Multi-node distributed quarantine and analysis queue (Celery + Redis).
4. Export of STIX 2.1 / TAXII cyber threat intelligence feeds.

---
**Report Prepared By:** Keerat Kaur  
**B.Tech CSE (Data Science & Artificial Intelligence)**  
**SRM University Delhi-NCR, Sonipat**
