"""
Machine Learning Training Pipeline
Supervised Random Forest Classifier and Unsupervised Isolation Forest Anomaly Detector.
Trains models on calibrated feature distributions and persists joblib artifacts.
"""

import sys
from pathlib import Path

# Ensure project root is on sys.path
BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))

from backend.app.services.ml_engine.model import ml_engine


def main():
    print("=" * 70)
    print("AI-POWERED FORENSIC ML ENGINE: REPRODUCIBLE TRAINING PIPELINE")
    print("SRM University Delhi-NCR, Sonipat - 2026-2027")
    print("=" * 70)
    print("[*] Generating calibrated benchmark dataset...")
    report = ml_engine.train_and_evaluate(is_synthetic=True)
    print("\n[+] Model Training and Validation Complete:")
    print(f"  • Model Name:            {report['model_name']}")
    print(f"  • Model Version:         {report['model_version']}")
    print(f"  • Dataset Provenance:    {report['dataset_provenance']}")
    print(f"  • Training Sample Count: {report['dataset_size']}")
    print(f"  • Accuracy:              {report['accuracy'] * 100:.2f}%")
    print(f"  • Precision:             {report['precision'] * 100:.2f}%")
    print(f"  • Recall:                {report['recall'] * 100:.2f}%")
    print(f"  • F1-Score:              {report['f1_score'] * 100:.2f}%")
    print(f"  • False Positive Rate:   {report['false_positive_rate'] * 100:.2f}%")
    print(f"  • ROC-AUC Metric:        {report['roc_auc']:.4f}")
    print("\n[+] Confusion Matrix:")
    cm = report['confusion_matrix']
    print(f"  TN: {cm['true_negative']} | FP: {cm['false_positive']}")
    print(f"  FN: {cm['false_negative']} | TP: {cm['true_positive']}")
    print("\n[+] Top Feature Importances:")
    for feat, imp in list(report['feature_importances'].items())[:6]:
        print(f"  • {feat:25s}: {imp:.4f}")
    print("\n[✓] Artifacts saved to ml/artifacts/")


if __name__ == "__main__":
    main()
