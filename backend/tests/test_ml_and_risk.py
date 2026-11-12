"""
Unit Tests for Machine Learning Feature Extraction, Model Training, Inference, and Risk Scoring.
"""

from backend.app.services.feature_engineering.extractor import feature_extractor, FEATURE_NAMES
from backend.app.services.ml_engine.model import ml_engine
from backend.app.services.ml_engine.risk_scorer import risk_scorer


def test_feature_extractor_vector_shape():
    """Verify extracted feature dict aligns exactly with FEATURE_NAMES and produces valid 2D array."""
    dummy_evidence = [
        {"category": "ENTROPY", "severity": "HIGH", "observed_value": "7.45", "title": "High Entropy"},
        {"category": "NETWORK", "severity": "MEDIUM", "observed_value": "http://evil.com;http://c2.org", "title": "Extracted URLs"},
        {"category": "YARA", "severity": "HIGH", "observed_value": "Script_Download_Cradle", "title": "YARA Match"},
        {"category": "EMBEDDED", "severity": "CRITICAL", "observed_value": "AutoOpen", "title": "VBA Macro"}
    ]
    feats = feature_extractor.extract_features(file_size_bytes=45000, evidence_items=dummy_evidence)
    for name in FEATURE_NAMES:
        assert name in feats

    assert feats["shannon_entropy"] == 7.45
    assert feats["macro_present"] == 1.0
    assert feats["yara_matches_count"] == 1.0

    df_vec = feature_extractor.to_df(feats)
    assert df_vec.shape == (1, len(FEATURE_NAMES))


def test_ml_engine_inference_predictions():
    """Test supervised Random Forest and unsupervised Isolation Forest prediction bounds."""
    # 1. Benign-like features
    benign_feats = {name: 0.0 for name in FEATURE_NAMES}
    benign_feats["file_size_kb"] = 45.0
    benign_feats["shannon_entropy"] = 4.2
    pred_benign = ml_engine.predict(benign_feats)
    assert 0.0 <= pred_benign["malware_probability"] <= 0.35
    assert pred_benign["is_malicious_prediction"] is False

    # 2. Malicious-like features
    mal_feats = {name: 2.0 for name in FEATURE_NAMES}
    mal_feats["shannon_entropy"] = 7.7
    mal_feats["yara_matches_count"] = 3.0
    mal_feats["critical_evidence_count"] = 3.0
    pred_mal = ml_engine.predict(mal_feats)
    assert pred_mal["malware_probability"] >= 0.60
    assert pred_mal["is_malicious_prediction"] is True


def test_risk_scoring_bounds_and_categories():
    """Verify transparent risk score bounds (0 to 100) and strict categorization."""
    # Critical risk case
    crit_evidence = [
        {"severity": "CRITICAL"}, {"severity": "CRITICAL"}, {"severity": "HIGH"}
    ]
    crit_ml = {"malware_probability": 0.95, "anomaly_score": 0.85}
    crit_beh = [{"event_type": "PROCESS_CREATE"}, {"event_type": "NETWORK_CONNECT"}]
    crit_res = risk_scorer.calculate_risk(crit_evidence, crit_ml, crit_beh, [])

    assert 85.0 <= crit_res["risk_score"] <= 100.0
    assert crit_res["risk_level"] == "CRITICAL"
    assert crit_res["confidence_score"] > 0.8
    assert crit_res["coverage_score"] > 0.6

    # Low risk case
    low_evidence = [{"severity": "INFO"}]
    low_ml = {"malware_probability": 0.05, "anomaly_score": 0.10}
    low_res = risk_scorer.calculate_risk(low_evidence, low_ml, [], [])

    assert 0.0 <= low_res["risk_score"] < 30.0
    assert low_res["risk_level"] == "LOW"
