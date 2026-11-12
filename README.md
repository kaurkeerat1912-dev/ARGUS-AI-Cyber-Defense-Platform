# AI-Powered Malicious File Forensics and Threat Reconstruction System

**4th-Year B.Tech CSE (Data Science & Artificial Intelligence) Live Capstone Project**  
**Institution:** SRM University Delhi-NCR, Sonipat  
**Academic Session:** 2026–2027  
**Architecture Target:** Optimized for Apple Silicon M4 (macOS ARM64) & Linux x86_64  

---

## 1. Project Overview & Vision

Modern cyber threats increasingly exploit benign communication channels (WhatsApp, corporate emails, download portals, cloud storage) to deliver polymorphic payloads, malicious documents, and living-off-the-land scripts. Traditional antivirus solutions often operate as proprietary black-boxes, offering little to no forensic explanation regarding *why* an assessment was made.

The **AI-Powered Malicious File Forensics and Threat Reconstruction System** is a university-level, defensive digital forensics platform. It merges:
1. **Cryptographic Ingestion & Secure Quarantine**: Path traversal mitigation, zip-bomb prevention, SHA-256 non-repudiation, and non-executable randomized storage.
2. **Multi-Format Static Digital Forensics**: Non-executing parsing for PDF, DOCX, OLE (`.doc`), ZIP, Windows PE binaries (`.exe`, `.dll`), and scripts (`.ps1`, `.vbs`, `.sh`), Shannon entropy calculations, and YARA signature compilation.
3. **Machine Learning Risk Quantification**: Supervised **Random Forest** classification and unsupervised **Isolation Forest** anomaly detection over a 14-dimensional feature vector.
4. **Controlled Behavioral Telemetry & Event Correlation**: Ingestion of normalized JSON telemetry from isolated virtual machines, lineage reconstruction (`SPAWNED`, `DROPPED_FILE`, `CONNECTED_OUTBOUND`).
5. **Graph-Based Threat Reconstruction**: NetworkX causal graph modeling rendered in **React Flow** with explicit `OBSERVED`, `INFERRED`, and `SIMULATED` tags.
6. **Explainable AI (XAI)**: Local Ollama integration with strict prompt-injection defenses, backed by a deterministic rule-based expert synthesis fallback.
7. **Forensic Report Generation**: One-click publication-quality **PDF generation** (via ReportLab) and comprehensive structured JSON exports.
8. **Interactive Dark SOC Dashboard**: Modern, SOC-inspired cybersecurity console built with React 19, TypeScript, Tailwind CSS v4, and Recharts.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, `@xyflow/react` (React Flow v12).
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy (Async), aiosqlite, Greenlet, HTTPX.
- **Machine Learning**: NumPy, Pandas, Scikit-learn (Random Forest, Isolation Forest, StandardScaler), Joblib.
- **Forensic Parsers**: `PyMuPDF` (PDF parser), `pefile` (PE headers & imports), `oletools` (VBA macros), `yara-python` (signature matching), ReportLab (PDF reporting).
- **Graph Modeling**: NetworkX.
- **Database**: SQLite default (local development), PostgreSQL-ready async configuration.
- **Local AI (Optional)**: Ollama (`http://localhost:11434`, model: `mistral:latest`), with deterministic expert system fallback.

---

## 3. Quickstart & MacBook M4 Setup Guide

### Prerequisites
- macOS on Apple Silicon (M1/M2/M3/M4) or Linux
- Python 3.11, 3.12, 3.13, or 3.14
- Node.js LTS (v20+ or v24+) and npm

### Step 1: Clone Repository & Create Virtual Environment
```bash
cd /Users/keeratkaur/.gemini/antigravity/scratch/malicious-file-forensics

# Verify environment
python3 --version
node --version
npm --version

# Create Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip and install backend dependencies
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 3: Generate Academic Sample Test Fixtures & Pre-train ML Models
```bash
source .venv/bin/activate
# Generate benign and suspicious samples
python scripts/generate_samples.py

# Train baseline benchmark models
python ml/training/train_models.py
```

### Step 4: Run the Complete Application
You can start both frontend and backend concurrently with one command:
```bash
bash scripts/run_all.sh
```

Or run them in separate terminal tabs:

**Terminal 1 (Backend):**
```bash
source .venv/bin/activate
export PYTHONPATH=.
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

- **Frontend SOC Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative Redoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. REST API Endpoints Reference

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/files/analyze` | Ingests sample, hashes, runs static forensics, ML, graph, and PDF report. |
| `GET` | `/api/v1/investigations` | Lists investigations with risk filter (`?risk_level=CRITICAL`) and search. |
| `GET` | `/api/v1/investigations/{id}` | Detailed investigation metadata, counts, and analysis status. |
| `GET` | `/api/v1/investigations/{id}/evidence` | Extracted evidence items with category and severity filters. |
| `GET` | `/api/v1/investigations/{id}/events` | Chronological behavioral telemetry events. |
| `GET` | `/api/v1/investigations/{id}/graph` | React Flow topology nodes and edges with observed/inferred tags. |
| `GET` | `/api/v1/investigations/{id}/report` | Comprehensive machine-readable JSON forensic report. |
| `GET` | `/api/v1/investigations/{id}/report/pdf` | Direct binary download of compiled academic PDF report. |
| `POST` | `/api/v1/telemetry/import` | Ingests normalized JSON events from external sandbox VM. |
| `POST` | `/api/v1/telemetry/simulate/{id}` | Generates simulated sandbox telemetry for demonstration and viva testing. |
| `GET` | `/api/v1/metrics/overview` | Executive SOC dashboard counts, risk distributions, and activity trends. |
| `GET` | `/api/v1/models/evaluation` | Supervised & anomaly model metrics, confusion matrix, and feature hierarchy. |
| `POST` | `/api/v1/models/retrain` | Triggers retraining on calibrated benchmark feature distributions. |
| `GET` | `/api/v1/health` | Diagnostics for backend, database, YARA compiler, and Ollama connection. |

---

## 5. Automated Test Suite Execution

All 16 unit and integration tests execute in under 3 seconds using `pytest`:

```bash
source .venv/bin/activate
PYTHONPATH=. pytest backend/tests -v
```

### Verified Test Suite Results:
- `test_health_and_root_endpoints` — **PASSED**
- `test_metrics_and_model_evaluation` — **PASSED**
- `test_end_to_end_file_forensic_pipeline` — **PASSED**
- `test_sanitize_filename_path_traversal` — **PASSED**
- `test_sanitize_filename_special_characters` — **PASSED**
- `test_sha256_hash_accuracy` — **PASSED**
- `test_detect_file_format_magic_bytes` — **PASSED**
- `test_feature_extractor_vector_shape` — **PASSED**
- `test_ml_engine_inference_predictions` — **PASSED**
- `test_risk_scoring_bounds_and_categories` — **PASSED**
- `test_shannon_entropy_calculation` — **PASSED**
- `test_extract_iocs_regex` — **PASSED**
- `test_yara_rule_matching` — **PASSED**
- `test_telemetry_normalization_and_deduplication` — **PASSED**
- `test_event_correlation_lineage` — **PASSED**
- `test_attack_graph_construction` — **PASSED**

---

## 6. Security Architecture & Safe Sandboxing

1. **Zero Host Execution**: The application never executes untrusted files on macOS. Static analysis inspects binary streams and object dictionaries without executing code.
2. **Cryptographic Quarantine**: Files are renamed with non-executable UUIDs (`f4dfc958...bin`) and stored in `data/quarantine/` with restricted access permissions.
3. **Path Traversal Protection**: Filenames are stripped of directory separators (`/`, `\`, `..`), shell wildcards, and null bytes.
4. **Archive Bomb Defenses**: ZIP files are examined before extraction; archives with expansion ratios above 100:1 or more than 5,000 files are rejected with HTTP 400.
5. **Prompt Injection Hardening**: All file content and strings passed to the optional Ollama LLM are formatted inside strict data delimiters with explicit instructions to ignore embedded user directives.

---

## 7. Viva Voce & Demonstration Instructions

For complete university evaluation notes, examiner questions, and defense rationale, review [docs/VIVA_PREPARATION.md](file:///Users/keeratkaur/.gemini/antigravity/scratch/malicious-file-forensics/docs/VIVA_PREPARATION.md) and [docs/ARCHITECTURE.md](file:///Users/keeratkaur/.gemini/antigravity/scratch/malicious-file-forensics/docs/ARCHITECTURE.md).

### Live Viva Workflow Demo:
1. Open the dashboard at `http://localhost:5173`.
2. Navigate to **File Investigation** and upload `sample_data/suspicious/urgent_action_document.pdf`.
3. Observe real-time progress across all 7 forensic stages.
4. Review the resulting **Critical Risk score (85+)**, YARA matches, and Shannon entropy.
5. Click **Reconstruct Attack Graph** to view the interactive topology.
6. Click **Inject Demo Telemetry** to showcase how dynamic process execution (`AcroRd32.exe` $\rightarrow$ `cmd.exe` $\rightarrow$ `powershell.exe`) and outbound C2 socket beacons connect with the initial PDF sample.
7. Click **PDF Report** to open the academic PDF report.
8. Navigate to **ML Evaluation** to demonstrate the Confusion Matrix, Gini feature importances, and live model retraining.
