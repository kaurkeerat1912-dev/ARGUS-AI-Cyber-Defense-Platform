"""
Feature Engineering Pipeline
Extracts structured numerical feature vectors from forensic evidence and structural metadata.
Ensures deterministic ordering and feature scaling for ML classification and anomaly detection.
"""

from typing import List, Dict, Any
import numpy as np

FEATURE_NAMES = [
    "file_size_kb",
    "shannon_entropy",
    "url_count",
    "ip_count",
    "domain_count",
    "embedded_objects_count",
    "yara_matches_count",
    "critical_evidence_count",
    "high_evidence_count",
    "medium_evidence_count",
    "suspicious_api_count",
    "macro_present",
    "double_extension",
    "script_patterns_count",
]


class FeatureExtractor:
    @staticmethod
    def extract_features(file_size_bytes: int, evidence_items: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Extract numerical features from file size and observed evidence list.
        """
        feats: Dict[str, float] = {k: 0.0 for k in FEATURE_NAMES}
        feats["file_size_kb"] = round(file_size_bytes / 1024.0, 3)

        for item in evidence_items:
            cat = item.get("category", "").upper()
            sev = item.get("severity", "").upper()
            title = item.get("title", "").lower()
            obs = item.get("observed_value", "").lower()

            # Entropy
            if cat == "ENTROPY":
                try:
                    feats["shannon_entropy"] = float(item.get("observed_value", 0.0))
                except ValueError:
                    feats["shannon_entropy"] = 4.0

            # Severities
            if sev == "CRITICAL":
                feats["critical_evidence_count"] += 1.0
            elif sev == "HIGH":
                feats["high_evidence_count"] += 1.0
            elif sev == "MEDIUM":
                feats["medium_evidence_count"] += 1.0

            # Network indicators
            if cat == "NETWORK":
                if "url" in title:
                    feats["url_count"] += float(len(obs.split(";")) if obs else 1.0)
                if "ip" in title:
                    feats["ip_count"] += float(len(obs.split(";")) if obs else 1.0)
                if "domain" in title:
                    feats["domain_count"] += float(len(obs.split(";")) if obs else 1.0)

            # Embedded & YARA
            if cat == "EMBEDDED":
                feats["embedded_objects_count"] += 1.0
                if "macro" in title or "vba" in title or "vba" in obs:
                    feats["macro_present"] = 1.0

            if cat == "YARA":
                feats["yara_matches_count"] += 1.0

            # APIs
            if "api" in title or "import" in title:
                feats["suspicious_api_count"] += float(len(obs.split(";")) if obs else 1.0)

            # Double extension
            if "double extension" in title:
                feats["double_extension"] = 1.0

            # Script patterns
            if "script" in title or cat == "STRINGS":
                if any(k in title for k in ["download", "hidden", "base64", "cradle"]):
                    feats["script_patterns_count"] += 1.0

        return feats

    @staticmethod
    def to_vector(feature_dict: Dict[str, float]) -> np.ndarray:
        """Convert feature dictionary to 2D numpy array in predefined order."""
        return np.array([[feature_dict[name] for name in FEATURE_NAMES]], dtype=np.float32)

    @staticmethod
    def to_df(feature_dict: Dict[str, float]):
        """Convert feature dictionary to DataFrame with exact column names."""
        import pandas as pd
        return pd.DataFrame([[feature_dict[name] for name in FEATURE_NAMES]], columns=FEATURE_NAMES)


feature_extractor = FeatureExtractor()
