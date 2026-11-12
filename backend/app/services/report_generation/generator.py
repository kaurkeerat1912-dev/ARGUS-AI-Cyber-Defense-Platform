"""
Professional Digital Forensic Report Generation Service
Builds academic-grade PDF reports (via ReportLab) and comprehensive JSON forensic archives.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch

from backend.app.core.config import settings


class ForensicReportGenerator:
    def __init__(self):
        settings.ensure_directories()
        self.reports_dir = settings.REPORTS_DIR

    def generate_json_report(
        self,
        investigation: Dict[str, Any],
        evidence_items: List[Dict[str, Any]],
        ml_prediction: Dict[str, Any],
        risk_data: Dict[str, Any],
        behavioral_events: List[Dict[str, Any]],
        correlations: List[Dict[str, Any]],
        graph_data: Dict[str, Any],
        xai_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Build full, standardized forensic JSON document.
        """
        return {
            "metadata": {
                "institution": settings.UNIVERSITY,
                "department": settings.DEPARTMENT,
                "project": settings.PROJECT_NAME,
                "session": settings.SESSION,
                "report_generated_at": datetime.now(timezone.utc).isoformat(),
                "report_format_version": "1.0",
            },
            "investigation": investigation,
            "risk_assessment": {
                "risk_score": risk_data.get("risk_score"),
                "risk_level": risk_data.get("risk_level"),
                "confidence_score": risk_data.get("confidence_score"),
                "coverage_score": risk_data.get("coverage_score"),
                "score_breakdown": risk_data.get("breakdown"),
            },
            "machine_learning": ml_prediction,
            "evidence_items": evidence_items,
            "behavioral_telemetry": {
                "coverage": "CONFIRMED_TELEMETRY" if behavioral_events else "STATIC_ONLY_UNOBSERVED",
                "events_count": len(behavioral_events),
                "events": behavioral_events,
            },
            "event_correlations": correlations,
            "attack_graph_summary": {
                "node_count": len(graph_data.get("nodes", [])),
                "edge_count": len(graph_data.get("edges", [])),
                "summary": graph_data.get("summary"),
                "missing_evidence_notes": graph_data.get("missing_evidence_notes"),
            },
            "explainable_ai": xai_data,
            "defensive_playbook": xai_data.get("defensive_actions", []),
            "limitations_and_disclaimer": xai_data.get("limitations_disclaimer", ""),
        }

    def generate_pdf_report(
        self,
        investigation_id: str,
        json_report: Dict[str, Any]
    ) -> str:
        """
        Render a publication-quality PDF forensic report using ReportLab.
        Returns the absolute filesystem path of the generated PDF.
        """
        pdf_filename = f"forensic_report_{investigation_id}.pdf"
        pdf_path = self.reports_dir / pdf_filename

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'H2Style',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155')
        )
        body_bold = ParagraphStyle(
            'BodyBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        elements = []

        # 1. University Header & Banner
        inv = json_report.get("investigation", {})
        risk = json_report.get("risk_assessment", {})
        xai = json_report.get("explainable_ai", {})

        elements.append(Paragraph(f"<b>{settings.UNIVERSITY}</b>", title_style))
        elements.append(Paragraph(
            f"{settings.DEPARTMENT} | B.Tech Live Academic Project ({settings.SESSION})<br/>"
            f"<b>FORENSIC INCIDENT INVESTIGATION REPORT: {inv.get('original_name')}</b>",
            subtitle_style
        ))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=10))

        # 2. Executive Metadata Box
        risk_lvl = risk.get("risk_level", "LOW")
        risk_color = '#ef4444' if risk_lvl in ['CRITICAL', 'HIGH'] else ('#f59e0b' if risk_lvl == 'MEDIUM' else '#10b981')

        meta_data = [
            [Paragraph("<b>Investigation ID:</b>", body_style), Paragraph(inv.get("id", ""), body_style),
             Paragraph("<b>Risk Assessment:</b>", body_style), Paragraph(f"<font color='{risk_color}'><b>{risk.get('risk_score')}/100 ({risk_lvl})</b></font>", body_bold)],
            [Paragraph("<b>File Name:</b>", body_style), Paragraph(inv.get("original_name", ""), body_style),
             Paragraph("<b>File Size:</b>", body_style), Paragraph(f"{inv.get('file_size_bytes', 0):,} bytes", body_style)],
            [Paragraph("<b>SHA-256 Hash:</b>", body_style), Paragraph(inv.get("sha256", ""), body_style),
             Paragraph("<b>Confidence / Coverage:</b>", body_style), Paragraph(f"{risk.get('confidence_score') * 100:.0f}% / {risk.get('coverage_score') * 100:.0f}%", body_style)],
            [Paragraph("<b>Timestamp:</b>", body_style), Paragraph(str(inv.get("created_at", ""))[:19], body_style),
             Paragraph("<b>Analysis Mode:</b>", body_style), Paragraph(json_report.get("behavioral_telemetry", {}).get("coverage", "STATIC"), body_style)]
        ]

        meta_table = Table(meta_data, colWidths=[1.3 * inch, 2.7 * inch, 1.4 * inch, 1.8 * inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 10))

        # 3. AI / XAI Executive Summary
        elements.append(Paragraph("1. Forensic Executive Summary & Attribution Analysis", h2_style))
        elements.append(Paragraph(xai.get("executive_summary", "Summary unavailable."), body_style))
        elements.append(Spacer(1, 10))

        # 4. Key Forensic Evidence Items Table
        elements.append(Paragraph("2. Critical Extracted Forensic Evidence", h2_style))
        evidence_list = json_report.get("evidence_items", [])
        if evidence_list:
            ev_table_data = [
                [Paragraph("<b>Category</b>", body_bold),
                 Paragraph("<b>Severity</b>", body_bold),
                 Paragraph("<b>Finding & Description</b>", body_bold),
                 Paragraph("<b>Source / Offset</b>", body_bold)]
            ]
            for ev in evidence_list[:8]:
                sev = ev.get("severity", "INFO")
                sev_color = '#ef4444' if sev in ['CRITICAL', 'HIGH'] else ('#d97706' if sev == 'MEDIUM' else '#0284c7')
                ev_table_data.append([
                    Paragraph(ev.get("category", ""), body_style),
                    Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", body_style),
                    Paragraph(f"<b>{ev.get('title')}</b><br/>{ev.get('description')}", body_style),
                    Paragraph(f"{ev.get('extraction_source')}<br/>{ev.get('offset_or_location') or ''}", body_style)
                ])

            ev_table = Table(ev_table_data, colWidths=[1.1 * inch, 0.9 * inch, 3.6 * inch, 1.6 * inch])
            ev_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(ev_table)
        else:
            elements.append(Paragraph("No significant anomalies observed in static forensic scan.", body_style))
        elements.append(Spacer(1, 10))

        # 5. Machine Learning & Anomaly Evaluation
        elements.append(Paragraph("3. Machine Learning & Anomaly Risk Quantification", h2_style))
        ml_data = json_report.get("machine_learning", {})
        ml_text = (
            f"Supervised Model: Random Forest (v{ml_data.get('model_version', '1.0.0')}) | "
            f"Malware Probability: <b>{ml_data.get('malware_probability', 0.0) * 100:.1f}%</b> | "
            f"Isolation Forest Anomaly Score: <b>{ml_data.get('anomaly_score', 0.0):.3f}</b> "
            f"({'Anomalous' if ml_data.get('is_anomalous') else 'Within Normal Baseline'})"
        )
        elements.append(Paragraph(ml_text, body_style))
        elements.append(Spacer(1, 8))

        # 6. Behavioral Attack Chain & Telemetry
        elements.append(Paragraph("4. Attack Reconstruction & Correlation Summary", h2_style))
        graph_sum = json_report.get("attack_graph_summary", {})
        elements.append(Paragraph(graph_sum.get("summary", "Graph analysis complete."), body_style))
        if graph_sum.get("missing_evidence_notes"):
            elements.append(Paragraph(f"<i>{graph_sum.get('missing_evidence_notes')}</i>", body_style))
        elements.append(Spacer(1, 10))

        # 7. Recommended Defensive Playbook
        elements.append(Paragraph("5. Recommended Defensive SOC Action Plan", h2_style))
        playbook = json_report.get("defensive_playbook", [])
        for i, act in enumerate(playbook, start=1):
            elements.append(Paragraph(f"• <b>Step {i}:</b> {act}", body_style))
        elements.append(Spacer(1, 10))

        # 8. Forensic Limitations Disclaimer
        elements.append(Paragraph("6. Academic Disclaimer & Forensic Limitations", h2_style))
        elements.append(Paragraph(json_report.get("limitations_and_disclaimer", ""), body_style))
        elements.append(Spacer(1, 12))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceAfter=5))
        elements.append(Paragraph(
            f"Generated automatically by {settings.PROJECT_NAME} • SRM University Sonipat",
            subtitle_style
        ))

        doc.build(elements)
        return str(pdf_path)


forensic_report_generator = ForensicReportGenerator()
