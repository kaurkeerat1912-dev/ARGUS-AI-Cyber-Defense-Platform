"""
Machine Learning Evaluation and Inference Verification Script
Tests trained models against sample benign and suspicious fixtures.
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))

from backend.app.services.static_analysis.analyzer import static_forensics_engine
from backend.app.services.feature_engineering.extractor import feature_extractor
from backend.app.services.ml_engine.model import ml_engine


def evaluate_fixture(file_path: Path):
    print(f"\n--- Evaluating Fixture: {file_path.name} ---")
    if not file_path.exists():
        print(f"[!] File not found: {file_path}")
        return

    file_size = file_path.stat().st_size
    file_type = "application/octet-stream"
    if file_path.suffix == ".pdf":
        file_type = "application/pdf"
    elif file_path.suffix == ".ps1":
        file_type = "text/x-script"

    evidence = static_forensics_engine.analyze_file(str(file_path), file_path.name, file_type)
    print(f"  • Evidence Items Extracted: {len(evidence)}")
    for ev in evidence[:3]:
        print(f"    - [{ev['severity']}] {ev['title']}")

    features = feature_extractor.extract_features(file_size, evidence)
    prediction = ml_engine.predict(features)
    print(f"  • Malware Probability:      {prediction['malware_probability'] * 100:.1f}%")
    print(f"  • Prediction Classification: {'MALICIOUS' if prediction['is_malicious_prediction'] else 'BENIGN'}")
    print(f"  • Anomaly Indicator Score:   {prediction['anomaly_score']:.3f} ({'ANOMALY' if prediction['is_anomalous'] else 'NORMAL'})")
    print("  • Top Feature Contributions:")
    for contrib in prediction['top_contributions']:
        print(f"    - {contrib['feature']}: value={contrib['observed_value']}, contribution={contrib['contribution_score']:.4f}")


def main():
    print("=" * 70)
    print("EVALUATING MODEL PREDICTIONS ON LOCAL TEST FIXTURES")
    print("=" * 70)
    sample_dir = BASE_DIR / "sample_data"
    evaluate_fixture(sample_dir / "benign" / "clean_research_note.pdf")
    evaluate_fixture(sample_dir / "suspicious" / "urgent_action_document.pdf")
    evaluate_fixture(sample_dir / "suspicious" / "system_update_cradle.ps1")
    print("\n[✓] Inference evaluation completed successfully.")


if __name__ == "__main__":
    main()
