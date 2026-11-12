# ARGUS – AI Cyber Attack & Defense Simulation Platform

**B.Tech Computer Science & Engineering (Data Science & Artificial Intelligence) Capstone Project**  
**Institution:** SRM University Delhi-NCR, Sonipat  
**Academic Session:** 2026–2027  
**Project Guide:** Mr. Rakesh Ahuja  
**Project Team:**
- **Keerat Kaur** (Lead Developer & Machine Learning Engineer)
- **Arushi Gupta** (Forensics Specialist & Backend Developer)
- **Nishant Chandela** (UI/UX & Telemetry Systems Engineer)

**GitHub Repository:** [https://github.com/kaurkeerat1912-dev/ARGUS-AI-Cyber-Defense-Platform](https://github.com/kaurkeerat1912-dev/ARGUS-AI-Cyber-Defense-Platform)  
**Architecture Target:** Apple Silicon (macOS ARM64) & Linux x86_64 Containerized

---

## 1. Project Overview & Vision

Modern cyber threats increasingly exploit benign enterprise communication channels (emails, web portals, cloud storage) to deliver polymorphic payloads, weaponized documents, and living-off-the-land scripts. Traditional antivirus solutions operate as black-boxes, providing little to no forensic explanation regarding *why* an assessment was made.

**ARGUS** is an end-to-end, AI-powered cyber attack reconstruction and defensive simulation platform. It bridges static digital forensics, explainable machine learning, causal attack-chain graphs, and automated host-isolated defensive remediation.

### Key Innovations:
1. **Cryptographic Ingestion & Secure Quarantine:** Non-executable isolated storage, SHA-256 non-repudiation, path-traversal sanitization, and zip-bomb decompression defenses.
2. **Multi-Format Static Digital Forensics:** Non-executing deep parsing for PDF (MuPDF), Windows PE (`.exe`, `.dll`), Microsoft OLE (`.doc`, VBA macros), weaponized ZIPs, and scripts (`.ps1`, `.vbs`, `.sh`). Shannon byte entropy engine and compiled YARA pattern matching.
3. **Dual-Model Machine Learning Engine:** Supervised **Random Forest** classification (97.5% accuracy, 97.87% precision) and unsupervised **Isolation Forest** anomaly detection across a 14-dimensional feature vector.
4. **Graph-Based Threat & Attack-Chain Reconstruction:** NetworkX causal graph modeling rendered in **React Flow** with explicit `OBSERVED`, `INFERRED`, and `SIMULATED` semantic lineage.
5. **Defensive Simulation & Remediation Engine:** Tailored, evidence-driven mitigation playbooks based on risk posture:
   - **Critical Threat ($\ge 85$):** Virtual Sandbox storage and hypervisor isolation.
   - **High Threat ($60 - 84$):** Immediate Access Revocation (`chmod 000` / token detachment) and process termination.
   - **Medium / Low Threat ($< 60$):** Continuous Reviewing Mode with file integrity auditing (`auditctl` / FIM).
6. **Modern Cybersecurity SaaS UI/UX:** Clean, high-contrast white theme with decent color accents and interactive popup cards for instant scan verdicts, forensic deep-dives, and rule inspection.
7. **Publication-Quality Documentation:** One-click PDF generation via ReportLab and comprehensive structured JSON telemetry exports.

---

## 2. Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, `@xyflow/react` (React Flow v12), Lucide React, Recharts.
* **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy (Async), aiosqlite, Greenlet, HTTPX.
* **Machine Learning:** Scikit-learn (Random Forest, Isolation Forest, StandardScaler), NumPy, Pandas, Joblib.
* **Forensic Parsers:** `pymupdf` (PDF AST), `pefile` (PE headers & imports), `oletools` (VBA macros), `yara-python` (byte signatures), `reportlab` (forensic PDF reporting).
* **Graph Modeling:** NetworkX causal engine.
* **Database:** SQLite default (`forensics.sqlite3`), PostgreSQL-ready async configuration.
* **Containerization:** Multi-stage Docker, Docker Compose, Render Blueprint (`render.yaml`), Vercel config.

---

## 3. Verified Machine Learning Performance Metrics

Evaluated on the calibrated SRM CSE-DSAI Forensic Benchmark Corpus ($N = 1,200$ balanced samples):

| Metric | Measured Value | Description |
| :--- | :--- | :--- |
| **Accuracy** | **97.50%** | Overall correct classifications across benign and malicious samples |
| **Precision** | **97.87%** | True positive rate over all predicted threats (minimal false alerts) |
| **Recall** | **95.83%** | Sensitivity in identifying malicious payloads |
| **F1-Score** | **96.84%** | Harmonic mean of precision and recall |
| **False Positive Rate** | **1.39%** | Rate of benign files mistakenly flagged |
| **ROC-AUC** | **0.968** | Area Under Receiver Operating Characteristic Curve |

### 14-Dimensional Feature Importances:
1. `high_evidence_count` (21.4%)
2. `shannon_entropy` (15.1%)
3. `yara_matches_count` (14.6%)
4. `critical_evidence_count` (14.4%)
5. `url_count` (7.2%)
6. `suspicious_api_count` (6.5%)
7. `ip_count` (6.3%)
8. `domain_count` (3.5%)
9. `file_size_kb` (2.5%)
10. `medium_evidence_count` (2.4%)
11. `macro_present` (2.1%)
12. `embedded_objects_count` (1.9%)
13. `script_patterns_count` (1.8%)
14. `double_extension` (0.2%)

---

## 4. Localhost Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js v20+ and npm
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/kaurkeerat1912-dev/ARGUS-AI-Cyber-Defense-Platform.git
cd ARGUS-AI-Cyber-Defense-Platform
```

### Step 2: Backend Setup
```bash
# Create Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 4: Run Services
Start backend (Terminal 1):
```bash
source .venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Start frontend (Terminal 2):
```bash
cd frontend
npm run dev
```

* **Frontend UI:** `http://localhost:5173/`
* **Backend API & Swagger Docs:** `http://localhost:8000/docs`
* **Direct Production Web UI:** `http://localhost:8000/` (FastAPI serves compiled SPA)

---

## 5. Production Deployment

### Option A: 1-Click Docker Deployment
```bash
# Build and run the multi-stage unified production container
docker build -t argus-platform:latest .
docker run -d -p 8000:8000 --name argus-defense argus-platform:latest
```
Access the application at `http://localhost:8000`.

### Option B: Render Web Service Deployment (`render.yaml`)
1. Fork or push this repository to GitHub.
2. Sign in to [Render](https://render.com).
3. Click **New +** $\to$ **Blueprint**.
4. Select `ARGUS-AI-Cyber-Defense-Platform`.
5. Render detects `render.yaml` and deploys the multi-stage Docker container automatically with a free public HTTPS URL (`https://<app-name>.onrender.com`).

### Option C: Vercel Frontend + Render Backend
- **Frontend:** Deploy `frontend/` to Vercel. Set environment variable `VITE_API_BASE_URL=https://<your-backend-api-url>/api/v1`.
- **Backend:** Deploy the root Dockerfile to Render or Railway.

---

## 6. Comprehensive Test Suite

Run the full automated test suite (21 unit and integration tests):
```bash
source .venv/bin/activate
pytest backend/tests/ -v
```

Test coverage includes:
- Input sanitization & directory traversal mitigation (`test_ingestion_and_security.py`)
- Static byte entropy, YARA rules, and regex IOC extraction (`test_static_forensics.py`)
- Random Forest & Isolation Forest inference verification (`test_ml_and_risk.py`)
- NetworkX attack graph construction & deduplication (`test_telemetry_correlation_graph.py`)
- Defensive playbook simulation & risk reduction calculation (`test_defensive_simulation.py`)
- Complete end-to-end API pipeline integration (`test_api_endpoints.py`)

---

## 7. Project Architecture & Directory Structure

```
ARGUS-AI-Cyber-Defense-Platform/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # REST endpoints (files, investigations, defense, metrics, telemetry)
│   │   ├── core/                # Configuration, logging, Pathlib directory setup
│   │   ├── database/            # SQLAlchemy async SQLite session & migrations
│   │   ├── models/              # Investigation, Evidence, Event ORM schemas
│   │   ├── services/
│   │   │   ├── static_analysis/ # PE, PDF, OLE, Entropy, YARA engines
│   │   │   ├── ml_engine/       # Random Forest & Isolation Forest inference
│   │   │   ├── attack_graph/    # NetworkX causal graph reconstruction
│   │   │   ├── defense_simulation/ # Automated playbook synthesis & sandbox execution
│   │   │   └── report_generation/  # ReportLab forensic PDF builder
│   │   └── main.py              # Application entrypoint & SPA static file server
│   ├── requirements.txt         # Production backend dependencies
│   └── tests/                   # 21 automated integration & unit tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, Sidebar, Navigation
│   │   │   ├── modals/          # ScanVerdictModal popup card
│   │   │   └── graph/           # React Flow custom forensic nodes
│   │   ├── pages/
│   │   │   ├── Overview.tsx     # SOC metrics & quick forensic inspect modal
│   │   │   ├── Investigate.tsx  # Drag & drop upload, triage & scan verdicts
│   │   │   ├── ThreatGraph.tsx  # Interactive causal graph & attack progression
│   │   │   └── DefensiveSimulation.tsx # Virtual sandbox remediation deck
│   │   ├── services/api.ts      # Dynamic API base client
│   │   └── index.css            # Tailwind CSS v4 light/white theme
│   ├── package.json
│   └── vite.config.ts
├── ml/
│   ├── artifacts/               # Pre-trained models, scalers, and evaluation metrics
│   ├── datasets/                # Forensic benchmark feature sets
│   └── training/                # Model training and calibration pipelines
├── yara_rules/                  # Compiled YARA signatures
├── Dockerfile                   # Multi-stage production container definition
├── docker-compose.yml           # Production Docker orchestration
├── render.yaml                  # Render deployment blueprint
├── vercel.json                  # Vercel deployment configuration
└── README.md
```

---

## 8. Academic Citation & License

This project is developed as an academic capstone project at **SRM University Delhi-NCR, Sonipat** for the B.Tech Computer Science & Engineering (Data Science & AI) curriculum (Session 2026–2027).  
Licensed under the **MIT License**.
