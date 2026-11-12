# System Architecture & Technical Specifications

**Project Title:** AI-Powered Malicious File Forensics and Threat Reconstruction System  
**Academic Session:** 2026–2027 • SRM University Delhi-NCR, Sonipat  
**Department:** Computer Science & Engineering (Data Science & AI)  

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Presentation Layer (React 19 + TypeScript)"]
        UI_Dashboard["SOC Overview Dashboard"]
        UI_Investigate["File Ingestion & Progress"]
        UI_Details["Forensic Evidence & Findings"]
        UI_Graph["React Flow Threat Graph"]
        UI_MLEval["ML Performance & Metrics"]
        UI_Reports["PDF / JSON Report Exporters"]
    end

    subgraph Gateway["API Gateway (FastAPI + Pydantic v2)"]
        API_Files["/api/v1/files/analyze"]
        API_Invs["/api/v1/investigations"]
        API_Telem["/api/v1/telemetry/import"]
        API_Metrics["/api/v1/metrics/overview"]
        API_Health["/api/v1/health"]
    end

    subgraph Pipeline["Forensic & AI Pipeline"]
        Ingestion["Secure Ingestion & SHA-256 Quarantine"]
        Static["Non-Executing Static Parsers (PyMuPDF, pefile, oletools, YARA)"]
        FeatureEng["Feature Extractor (14-dim Vector)"]
        MLEngine["Random Forest & Isolation Forest"]
        RiskScore["Transparent 0-100 Risk Engine"]
        Correlator["Defensible Event Correlator"]
        GraphBuilder["NetworkX Graph Builder"]
        XAI["Local Ollama LLM + Deterministic Fallback"]
        ReportGen["ReportLab PDF & JSON Generator"]
    end

    subgraph Storage["Persistence & Quarantine Layer"]
        DB[(SQLite / PostgreSQL Async)]
        QuarantineStore[("data/quarantine/ (UUID Naming)")]
        ReportStore[("reports/generated/ (*.pdf, *.json)")]
        MLArtifacts[("ml/artifacts/ (*.joblib, metrics.json)")]
    end

    UI_Dashboard --> Gateway
    UI_Investigate --> Gateway
    UI_Graph --> Gateway
    Gateway --> Ingestion
    Ingestion --> Static
    Static --> FeatureEng
    FeatureEng --> MLEngine
    MLEngine --> RiskScore
    RiskScore --> Correlator
    Correlator --> GraphBuilder
    GraphBuilder --> XAI
    XAI --> ReportGen
    ReportGen --> Storage
    Storage --> Gateway
```

---

## 2. Database Schema (Entity-Relationship)

```mermaid
erDiagram
    INVESTIGATIONS ||--o{ EVIDENCE_ITEMS : contains
    INVESTIGATIONS ||--o{ BEHAVIORAL_EVENTS : logs
    INVESTIGATIONS ||--o{ EVENT_CORRELATIONS : identifies
    INVESTIGATIONS ||--|| ATTACK_GRAPHS : constructs
    INVESTIGATIONS ||--|| FORENSIC_REPORTS : generates

    INVESTIGATIONS {
        string id PK
        string original_name
        string stored_name
        string file_path
        string sha256
        int file_size_bytes
        string file_type
        string status
        float risk_score
        string risk_level
        float confidence_score
        float coverage_score
        boolean is_synthetic
        datetime created_at
        datetime completed_at
    }

    EVIDENCE_ITEMS {
        string id PK
        string investigation_id FK
        string category
        string title
        string severity
        string observed_value
        string extraction_source
        string offset_or_location
        string explanation
        float confidence
        string limitations
    }

    BEHAVIORAL_EVENTS {
        string id PK
        string investigation_id FK
        string event_type
        datetime timestamp
        int process_id
        string process_name
        int parent_process_id
        string parent_process_name
        string command_line
        string target_path
        string destination_ip
        int destination_port
        string domain
        boolean is_simulated
    }

    EVENT_CORRELATIONS {
        string id PK
        string investigation_id FK
        string relation_type
        string source_entity
        string target_entity
        string reason
        float confidence
        string supporting_evidence_ids
    }

    ATTACK_GRAPHS {
        string id PK
        string investigation_id FK
        text nodes_json
        text edges_json
        text summary
        text missing_evidence_notes
    }

    FORENSIC_REPORTS {
        string id PK
        string investigation_id FK
        text executive_summary
        string pdf_path
        text json_data
        text defensive_actions
        text limitations_disclaimer
        string generated_by
    }
```

---

## 3. Machine Learning Methodology

### 3.1 Feature Vector Architecture (14 Dimension Predictors)
1. `file_size_kb`: Total file size in kilobytes.
2. `shannon_entropy`: Byte randomness ($0.0 \le H \le 8.0$).
3. `url_count`: Extracted HTTP/HTTPS URLs.
4. `ip_count`: Extracted non-loopback IPv4 indicators.
5. `domain_count`: Extracted domain indicators.
6. `embedded_objects_count`: Count of embedded streams, binaries, or objects.
7. `yara_matches_count`: Matched rule signatures from `malware_rules.yar`.
8. `critical_evidence_count`: Count of critical-severity forensic findings.
9. `high_evidence_count`: Count of high-severity forensic findings.
10. `medium_evidence_count`: Count of medium-severity forensic findings.
11. `suspicious_api_count`: Count of dangerous Win32 API imports (`VirtualAlloc`, `WriteProcessMemory`, `CreateRemoteThread`).
12. `macro_present`: Binary flag indicating presence of VBA macros (`vbaProject.bin`, `AutoOpen`).
13. `double_extension`: Binary flag indicating masquerading (`.pdf.exe`).
14. `script_patterns_count`: Count of download cradles, hidden execution styles, or base64 decode primitives.

### 3.2 Dual-Model Inference Strategy
- **Supervised Random Forest**: Learns complex decision boundaries with Gini impurity splitting and balanced class weighting. Provides explicit feature importances and calibrated class probability.
- **Unsupervised Isolation Forest**: Fitted exclusively on benign reference baselines. Measures path length to isolate an observation. Anomalous zero-day samples or novel packers require fewer splits and produce high anomaly scores.
