#!/usr/bin/env python3
"""
ARGUS Live Project Report Builder (Full University-Level Report)
Produces complete academic submission reports in DOCX and PDF formats.
Institutions: SRM University Delhi-NCR, Sonepat
Session: 2026-2027 (MAY 2026)
Degree: B.Tech CSE (Data Science & Artificial Intelligence)
Supervisor: Mr. Rakesh Ahuja
Team: Keerat Kaur, Arushi Gupta, Nishant Chandela
"""

import os
import sys
from pathlib import Path

# ReportLab imports
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfgen import canvas

# python-docx imports
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# Import content modules
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from scripts.report_data import METADATA
from scripts.report_content_ch1_ch2 import CHAPTER_1, CHAPTER_2
from scripts.report_content_ch3 import CHAPTER_3
from scripts.report_content_ch4 import CHAPTER_4
from scripts.report_content_ch5_ch7 import CHAPTER_5, CHAPTER_6, CHAPTER_7

OUTPUT_DIR = BASE_DIR / "reports" / "final_submission"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
DOCX_PATH = OUTPUT_DIR / "ARGUS_Live_Project_Report.docx"
PDF_PATH = OUTPUT_DIR / "ARGUS_Live_Project_Report.pdf"
LOGO_PATH = BASE_DIR / "srm_logo.png"


# ==============================================================================
# REPORTLAB NUMBERED CANVAS (Header, Footer & Running Page Count)
# ==============================================================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        # Page 1 is the cover page - no header or footer
        if self._pageNumber > 1:
            self.saveState()
            
            # Header
            self.setFont("Times-Roman", 10)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(54, 750, "ARGUS: AI Cyber Attack & Defense Simulation Platform")
            self.drawRightString(558, 750, f"{self._pageNumber}")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 742, 558, 742)
            
            # Footer
            self.line(54, 46, 558, 46)
            self.setFont("Times-Roman", 9)
            self.drawString(54, 34, "SRM University Delhi-NCR, Sonepat — Department of CSE (DSAI)")
            self.drawRightString(558, 34, f"Page {self._pageNumber} of {total_pages}")
            
            self.restoreState()


# ==============================================================================
# PDF REPORT GENERATOR (ReportLab)
# ==============================================================================
def generate_pdf():
    print("[*] Generating Full Academic PDF Report via ReportLab...")
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    style_cover_super = ParagraphStyle('CoverSuper', fontName='Times-Bold', fontSize=18, leading=22, alignment=1, textColor=colors.HexColor('#0f172a'))
    style_cover_title = ParagraphStyle('CoverTitle', fontName='Times-Bold', fontSize=24, leading=28, alignment=1, textColor=colors.HexColor('#1e3a8a'))
    style_cover_sub = ParagraphStyle('CoverSub', fontName='Times-Roman', fontSize=12, leading=16, alignment=1, textColor=colors.HexColor('#334155'))
    style_cover_deg = ParagraphStyle('CoverDeg', fontName='Times-Bold', fontSize=15, leading=19, alignment=1, textColor=colors.HexColor('#0f172a'))
    style_cover_body = ParagraphStyle('CoverBody', fontName='Times-Roman', fontSize=11, leading=15, alignment=1, textColor=colors.HexColor('#475569'))
    
    style_ch_title = ParagraphStyle('ChTitle', fontName='Times-Bold', fontSize=16, leading=20, spaceAfter=14, textColor=colors.HexColor('#0f172a'))
    style_sec_title = ParagraphStyle('SecTitle', fontName='Times-Bold', fontSize=13, leading=17, spaceBefore=12, spaceAfter=8, textColor=colors.HexColor('#1e3a8a'))
    style_subsec_title = ParagraphStyle('SubSecTitle', fontName='Times-Bold', fontSize=11.5, leading=15, spaceBefore=8, spaceAfter=4, textColor=colors.HexColor('#0f172a'))
    
    style_body = ParagraphStyle('BodyTextTimes', fontName='Times-Roman', fontSize=11, leading=15, spaceAfter=8, textColor=colors.HexColor('#1e293b'))
    style_bullet = ParagraphStyle('BulletTimes', fontName='Times-Roman', fontSize=10.5, leading=14.5, leftIndent=18, firstLineIndent=-12, spaceAfter=5, textColor=colors.HexColor('#1e293b'))
    
    style_code = ParagraphStyle('CodeBox', fontName='Courier', fontSize=7.5, leading=10, textColor=colors.HexColor('#f8fafc'))
    style_table_cell = ParagraphStyle('TableCell', fontName='Times-Roman', fontSize=8.5, leading=11, textColor=colors.HexColor('#1e293b'))
    style_table_header = ParagraphStyle('TableHeader', fontName='Times-Bold', fontSize=9, leading=12, textColor=colors.white)

    story = []

    # --------------------------------------------------------------------------
    # COVER PAGE (Matching Reference Page 1 Format)
    # --------------------------------------------------------------------------
    story.append(Spacer(1, 20))
    story.append(Paragraph("LIVE PROJECT REPORT", style_cover_super))
    story.append(Spacer(1, 15))
    story.append(Paragraph("ARGUS – AI Cyber Attack & Defense<br/>Simulation Platform", style_cover_title))
    story.append(Spacer(1, 10))
    story.append(Paragraph("A Graph-Correlated Automated Forensic Triage, Multi-Model Threat Detection,<br/>and Dynamic Mitigation Sandbox Engine", style_cover_sub))
    story.append(Spacer(1, 25))
    
    story.append(Paragraph("Submitted in partial fulfillment of the<br/>requirements for the award of the<br/>degree of", style_cover_body))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Bachelor of Technology", style_cover_deg))
    story.append(Paragraph("Computer Science and Engineering<br/>(Data Science & Artificial Intelligence)", style_cover_sub))
    story.append(Spacer(1, 20))

    # Supervisor & Team Columns Table
    sup_text = f"<b>Supervisor:</b><br/>{METADATA['supervisor']}<br/>{METADATA['supervisor_title']}"
    team_text = "<b>Submitted by:</b><br/>"
    for m in METADATA['team']:
        team_text += f"{m['name']}<br/>Roll No: {m['roll']}<br/>"

    cov_col_table = Table(
        [[Paragraph(sup_text, ParagraphStyle('SupStyle', fontName='Times-Roman', fontSize=10.5, leading=14)),
          Paragraph(team_text, ParagraphStyle('TeamStyle', fontName='Times-Roman', fontSize=10.5, leading=14))]],
        colWidths=[250, 250]
    )
    cov_col_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(cov_col_table)
    story.append(Spacer(1, 25))

    # University Logo
    if LOGO_PATH.exists():
        story.append(Image(str(LOGO_PATH), width=160, height=114))
        story.append(Spacer(1, 15))

    story.append(Paragraph("<b>SRM UNIVERSITY, DELHI-NCR, SONEPAT, HARYANA</b><br/>Plot No. 39, Rajiv Gandhi Education City, Sonepat, Haryana 131029<br/><b>MAY 2026</b>", style_cover_body))
    story.append(PageBreak())

    # --------------------------------------------------------------------------
    # HELPER: ADD CHAPTERS
    # --------------------------------------------------------------------------
    def render_chapter_content(ch):
        story.append(Paragraph(ch["title"], style_ch_title))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3a8a"), spaceAfter=14))
        
        for sec in ch.get("sections", []):
            sec_num = sec.get("num", "")
            sec_title = sec.get("title", "")
            story.append(Paragraph(f"{sec_num} {sec_title}", style_sec_title))
            
            for p in sec.get("paragraphs", []):
                story.append(Paragraph(p, style_body))
                
            for b in sec.get("bullets", []):
                story.append(Paragraph(f"• {b}", style_bullet))
                
            for p_title, p_desc in sec.get("phases", []):
                story.append(Paragraph(f"<b>{p_title}:</b> {p_desc}", style_bullet))
                
            for r in sec.get("references", []):
                story.append(Paragraph(r, style_bullet))

            # Render ASCII Diagram if present
            if "diagram_text" in sec:
                diag_p = Paragraph(sec["diagram_text"].replace(" ", "&nbsp;").replace("\n", "<br/>"),
                                   ParagraphStyle('DiagStyle', fontName='Courier', fontSize=6.5, leading=8.5, textColor=colors.HexColor('#0f172a')))
                diag_table = Table([[diag_p]], colWidths=[500])
                diag_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
                    ('LEFTPADDING', (0,0), (-1,-1), 8),
                    ('RIGHTPADDING', (0,0), (-1,-1), 8),
                    ('TOPPADDING', (0,0), (-1,-1), 8),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ]))
                story.append(Spacer(1, 4))
                story.append(diag_table)
                story.append(Spacer(1, 8))

            # Render Code Snippet if present
            if "code_snippet" in sec:
                code_html = sec["code_snippet"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;").replace("\n", "<br/>")
                code_p = Paragraph(code_html, style_code)
                code_table = Table([[code_p]], colWidths=[500])
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#1e293b')),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('RIGHTPADDING', (0,0), (-1,-1), 10),
                    ('TOPPADDING', (0,0), (-1,-1), 8),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ]))
                story.append(Spacer(1, 4))
                story.append(code_table)
                story.append(Spacer(1, 8))

            # Render Subsections
            for subsec in sec.get("subsections", []):
                sub_num = subsec.get("num", "")
                sub_title = subsec.get("title", "")
                story.append(Paragraph(f"{sub_num} {sub_title}", style_subsec_title))
                
                for p in subsec.get("paragraphs", []):
                    story.append(Paragraph(p, style_body))
                for b in subsec.get("bullets", []):
                    story.append(Paragraph(f"• {b}", style_bullet))
                if "code_snippet" in subsec:
                    c_html = subsec["code_snippet"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;").replace("\n", "<br/>")
                    cp = Paragraph(c_html, style_code)
                    c_table = Table([[cp]], colWidths=[500])
                    c_table.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
                        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#1e293b')),
                        ('LEFTPADDING', (0,0), (-1,-1), 10),
                        ('RIGHTPADDING', (0,0), (-1,-1), 10),
                        ('TOPPADDING', (0,0), (-1,-1), 8),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                    ]))
                    story.append(Spacer(1, 4))
                    story.append(c_table)
                    story.append(Spacer(1, 8))

                # Render Subsection Tables
                if "table_data" in subsec:
                    t_rows = []
                    for row_idx, r in enumerate(subsec["table_data"]):
                        p_row = [Paragraph(cell, style_table_header if row_idx == 0 else style_table_cell) for cell in r]
                        t_rows.append(p_row)
                    sub_t = Table(t_rows, colWidths=[500 / len(t_rows[0])] * len(t_rows[0]))
                    sub_t.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
                        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
                        ('TOPPADDING', (0,0), (-1,-1), 5),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                    ]))
                    story.append(Spacer(1, 4))
                    story.append(sub_t)
                    story.append(Spacer(1, 8))

            # Render Section Tables
            for tbl_key in ["table_data", "tech_table", "frontend_tests", "backend_tests", "uat_table"]:
                if tbl_key in sec:
                    data = sec[tbl_key]
                    t_rows = []
                    col_count = len(data[0])
                    # Intelligent column width calculation
                    col_widths = [500 / col_count] * col_count
                    if col_count == 4 and tbl_key == "table_data":
                        col_widths = [120, 90, 80, 210]
                    elif col_count == 4 and tbl_key == "tech_table":
                        col_widths = [110, 110, 70, 210]
                    elif col_count == 5 and tbl_key == "frontend_tests":
                        col_widths = [55, 110, 115, 160, 60]
                    elif col_count == 5 and tbl_key == "backend_tests":
                        col_widths = [50, 155, 95, 140, 60]
                    elif col_count == 5 and tbl_key == "uat_table":
                        col_widths = [65, 110, 140, 55, 130]

                    for row_idx, r in enumerate(data):
                        p_row = [Paragraph(str(cell), style_table_header if row_idx == 0 else style_table_cell) for cell in r]
                        t_rows.append(p_row)
                    tbl = Table(t_rows, colWidths=col_widths)
                    tbl.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
                        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
                        ('TOPPADDING', (0,0), (-1,-1), 4),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ]))
                    story.append(Spacer(1, 4))
                    story.append(tbl)
                    story.append(Spacer(1, 8))

        story.append(PageBreak())

    # Render Chapters 1 to 7
    render_chapter_content(CHAPTER_1)
    render_chapter_content(CHAPTER_2)
    render_chapter_content(CHAPTER_3)
    render_chapter_content(CHAPTER_4)
    render_chapter_content(CHAPTER_5)
    render_chapter_content(CHAPTER_6)
    render_chapter_content(CHAPTER_7)

    # Build Document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[+] PDF generated successfully at: {PDF_PATH}")


# ==============================================================================
# DOCX REPORT GENERATOR (python-docx)
# ==============================================================================
def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'))

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generate_docx():
    print("[*] Generating Full Academic DOCX Report via python-docx...")
    doc = docx.Document()

    # Set 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.header.paragraphs[0].text = "ARGUS: AI Cyber Attack & Defense Simulation Platform"
        section.footer.paragraphs[0].text = "SRM University Delhi-NCR, Sonepat — Department of CSE (DSAI)"

    # Set Normal Font
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(30, 41, 59)

    # --------------------------------------------------------------------------
    # COVER PAGE
    # --------------------------------------------------------------------------
    p_super = doc.add_paragraph()
    p_super.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_super = p_super.add_run("LIVE PROJECT REPORT\n\n")
    r_super.font.name = 'Times New Roman'
    r_super.font.size = Pt(18)
    r_super.font.bold = True

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("ARGUS – AI Cyber Attack & Defense Simulation Platform\n")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(30, 58, 138)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("A Graph-Correlated Automated Forensic Triage, Multi-Model Threat Detection, and Dynamic Mitigation Sandbox Engine\n\n")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True

    p_req = doc.add_paragraph()
    p_req.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_req = p_req.add_run("Submitted in partial fulfillment of the requirements for the award of the degree of\n")
    r_req.font.size = Pt(11)
    r_deg = p_req.add_run("Bachelor of Technology\n")
    r_deg.font.size = Pt(15)
    r_deg.font.bold = True
    r_spec = p_req.add_run("Computer Science and Engineering (Data Science & Artificial Intelligence)\n\n")
    r_spec.font.size = Pt(12)

    # Supervisor & Team Table
    table_cov = doc.add_table(rows=1, cols=2)
    table_cov.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_cov.autofit = True
    c0, c1 = table_cov.rows[0].cells
    c0.paragraphs[0].add_run(f"Supervisor:\n{METADATA['supervisor']}\n{METADATA['supervisor_title']}\n").font.bold = True
    
    t_text = "Submitted by:\n"
    for m in METADATA['team']:
        t_text += f"{m['name']}\nRoll No: {m['roll']}\n"
    c1.paragraphs[0].add_run(t_text).font.bold = True

    # University Logo
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(24)
    if LOGO_PATH.exists():
        p_logo.add_run().add_picture(str(LOGO_PATH), width=Inches(2.2))

    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(18)
    r_inst = p_inst.add_run("SRM UNIVERSITY, DELHI-NCR, SONEPAT, HARYANA\nPlot No. 39, Rajiv Gandhi Education City, Sonepat, Haryana 131029\nMAY 2026")
    r_inst.font.bold = True
    r_inst.font.size = Pt(11)

    doc.add_page_break()

    # --------------------------------------------------------------------------
    # HELPER: ADD CHAPTER CONTENT TO DOCX
    # --------------------------------------------------------------------------
    def render_docx_chapter(ch):
        h1 = doc.add_paragraph()
        r1 = h1.add_run(ch["title"])
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(18)
        r1.font.bold = True
        r1.font.color.rgb = RGBColor(15, 23, 42)
        h1.paragraph_format.space_after = Pt(12)

        for sec in ch.get("sections", []):
            h2 = doc.add_paragraph()
            r2 = h2.add_run(f"{sec['num']} {sec['title']}")
            r2.font.name = 'Times New Roman'
            r2.font.size = Pt(14)
            r2.font.bold = True
            r2.font.color.rgb = RGBColor(30, 58, 138)
            h2.paragraph_format.space_before = Pt(10)
            h2.paragraph_format.space_after = Pt(6)

            for p_text in sec.get("paragraphs", []):
                p = doc.add_paragraph()
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_after = Pt(6)
                r = p.add_run(p_text)
                r.font.name = 'Times New Roman'

            for b_text in sec.get("bullets", []):
                p = doc.add_paragraph(style='List Bullet')
                p.paragraph_format.space_after = Pt(4)
                r = p.add_run(b_text)
                r.font.name = 'Times New Roman'

            for p_title, p_desc in sec.get("phases", []):
                p = doc.add_paragraph(style='List Bullet')
                p.paragraph_format.space_after = Pt(4)
                r_bt = p.add_run(f"{p_title}: ")
                r_bt.font.bold = True
                p.add_run(p_desc)

            for r_text in sec.get("references", []):
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(4)
                p.add_run(r_text)

            if "diagram_text" in sec:
                p_code = doc.add_paragraph()
                p_code.paragraph_format.left_indent = Inches(0.2)
                p_code.paragraph_format.space_before = Pt(4)
                p_code.paragraph_format.space_after = Pt(6)
                r_c = p_code.add_run(sec["diagram_text"])
                r_c.font.name = 'Courier New'
                r_c.font.size = Pt(8)

            if "code_snippet" in sec:
                p_code = doc.add_paragraph()
                p_code.paragraph_format.left_indent = Inches(0.25)
                p_code.paragraph_format.space_before = Pt(6)
                p_code.paragraph_format.space_after = Pt(8)
                r_c = p_code.add_run(sec["code_snippet"])
                r_c.font.name = 'Courier New'
                r_c.font.size = Pt(8.5)

            for subsec in sec.get("subsections", []):
                h3 = doc.add_paragraph()
                r3 = h3.add_run(f"{subsec['num']} {subsec['title']}")
                r3.font.name = 'Times New Roman'
                r3.font.size = Pt(12)
                r3.font.bold = True
                h3.paragraph_format.space_before = Pt(8)
                h3.paragraph_format.space_after = Pt(4)

                for p_text in subsec.get("paragraphs", []):
                    p = doc.add_paragraph()
                    p.paragraph_format.line_spacing = 1.15
                    p.paragraph_format.space_after = Pt(6)
                    p.add_run(p_text)

                for b_text in subsec.get("bullets", []):
                    p = doc.add_paragraph(style='List Bullet')
                    p.paragraph_format.space_after = Pt(4)
                    p.add_run(b_text)

                if "code_snippet" in subsec:
                    p_code = doc.add_paragraph()
                    p_code.paragraph_format.left_indent = Inches(0.25)
                    r_c = p_code.add_run(subsec["code_snippet"])
                    r_c.font.name = 'Courier New'
                    r_c.font.size = Pt(8.5)

                if "table_data" in subsec:
                    tbl_data = subsec["table_data"]
                    t = doc.add_table(rows=len(tbl_data), cols=len(tbl_data[0]))
                    t.alignment = WD_TABLE_ALIGNMENT.CENTER
                    for ri, row in enumerate(tbl_data):
                        for ci, val in enumerate(row):
                            cell = t.cell(ri, ci)
                            cell.text = str(val)
                            set_cell_margins(cell)
                            if ri == 0:
                                set_cell_background(cell, "1E3A8A")
                                cell.paragraphs[0].runs[0].font.bold = True
                                cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
                            elif ri % 2 == 1:
                                set_cell_background(cell, "F8FAFC")

            for tbl_key in ["table_data", "tech_table", "frontend_tests", "backend_tests", "uat_table"]:
                if tbl_key in sec:
                    tbl_data = sec[tbl_key]
                    t = doc.add_table(rows=len(tbl_data), cols=len(tbl_data[0]))
                    t.alignment = WD_TABLE_ALIGNMENT.CENTER
                    for ri, row in enumerate(tbl_data):
                        for ci, val in enumerate(row):
                            cell = t.cell(ri, ci)
                            cell.text = str(val)
                            set_cell_margins(cell)
                            if ri == 0:
                                set_cell_background(cell, "1E3A8A")
                                cell.paragraphs[0].runs[0].font.bold = True
                                cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
                            elif ri % 2 == 1:
                                set_cell_background(cell, "F8FAFC")

        doc.add_page_break()

    # Render Chapters in DOCX
    render_docx_chapter(CHAPTER_1)
    render_docx_chapter(CHAPTER_2)
    render_docx_chapter(CHAPTER_3)
    render_docx_chapter(CHAPTER_4)
    render_docx_chapter(CHAPTER_5)
    render_docx_chapter(CHAPTER_6)
    render_docx_chapter(CHAPTER_7)

    doc.save(str(DOCX_PATH))
    print(f"[+] DOCX generated successfully at: {DOCX_PATH}")


if __name__ == "__main__":
    generate_pdf()
    generate_docx()
    print("[*] Academic Report Generation Complete!")
