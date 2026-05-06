from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import io
from PIL import Image
import numpy as np

def generate_pdf_report(input_image_bytes, output_image_bytes, analysis_data):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # --- THEME COLORS ---
    INDIGO = colors.HexColor("#6366f1")
    DARK = colors.HexColor("#0f172a")
    TEXT_GRAY = colors.HexColor("#4b5563")

    # Header Background
    p.setFillColor(DARK)
    p.rect(0, height - 120, width, 120, fill=True, stroke=False)

    # Title & Logo
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 28)
    p.drawString(50, height - 60, "Color")
    p.setFillColor(INDIGO)
    p.drawString(120, height - 60, "SAR")
    
    p.setFillColor(colors.white)
    p.setFont("Courier-Bold", 10)
    p.drawString(50, height - 85, "SAR COLORIZATION & LAND ANALYSIS // ARCHIVE V2.0")

    # Metadata Column
    p.setFont("Helvetica", 9)
    p.drawRightString(width - 50, height - 55, f"DATE: {np.datetime64('now')}")
    p.drawRightString(width - 50, height - 70, f"JOB_ID: {np.random.randint(1000, 9999)}")

    # --- IMAGE COMPARISON ---
    p.setFillColor(DARK)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, height - 160, "1. RADIOMETRIC COMPARISON")
    
    # Grid lines
    p.setStrokeColor(INDIGO)
    p.setLineWidth(1)
    p.line(50, height - 165, width - 50, height - 165)

    # Original Image
    input_img = Image.open(io.BytesIO(input_image_bytes))
    input_reader = ImageReader(input_img)
    p.setFillColor(TEXT_GRAY)
    p.setFont("Courier", 9)
    p.drawString(50, height - 180, "[ INPUT: SAR_L_BAND ]")
    p.drawImage(input_reader, 50, height - 380, width=240, height=180, preserveAspectRatio=True)
    
    # Enhanced Image
    output_img = Image.open(io.BytesIO(output_image_bytes))
    output_reader = ImageReader(output_img)
    p.drawString(310, height - 180, "[ OUTPUT: AI_RECONSTRUCTION ]")
    p.drawImage(output_reader, 310, height - 380, width=240, height=180, preserveAspectRatio=True)

    # --- AI ANALYSIS ---
    y_pos = height - 420
    p.setFillColor(DARK)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y_pos, "2. GENERATIVE ANALYSIS")
    p.line(50, y_pos-5, width-50, y_pos-5)

    # Land Type Badge
    y_pos -= 35
    p.setFillColor(INDIGO)
    p.rect(50, y_pos - 5, 120, 20, fill=True, stroke=False)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 10)
    p.drawCentredString(110, y_pos, analysis_data.get("land_type", "UNKNOWN").upper())

    # Description
    y_pos -= 30
    p.setFillColor(DARK)
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y_pos, "SCENE DESCRIPTION")
    
    y_pos -= 15
    p.setFont("Helvetica", 10)
    p.setFillColor(TEXT_GRAY)
    desc = analysis_data.get("description", "")
    
    # Smart wrap using reportlab's canvas width aware wrapping
    y_pos = draw_wrapped_text(p, desc, 50, y_pos, width - 100, 14)

    # Insights
    y_pos -= 25
    p.setFillColor(DARK)
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y_pos, "AI PREDICTIONS / INSIGHTS")
    
    y_pos -= 20
    p.setFont("Courier", 10)
    insights = analysis_data.get("insights", [])
    for insight in insights:
        p.setFillColor(INDIGO)
        p.drawString(55, y_pos, ">")
        p.setFillColor(TEXT_GRAY)
        y_pos = draw_wrapped_text(p, insight, 70, y_pos, width - 120, 14, font="Courier")
        y_pos -= 5

    # Footer
    p.setStrokeColor(colors.lightgrey)
    p.line(50, 40, width - 50, 40)
    p.setFont("Helvetica-Oblique", 7)
    p.setFillColor(colors.grey)
    p.drawString(50, 25, "GENEO_ANALYSIS // COLOR_SAR_PROJECT")
    p.drawRightString(width-50, 25, "RESEARCH DATA EXPORT")

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()

def draw_wrapped_text(canvas, text, x, y, max_width, leading, font="Helvetica", size=10):
    canvas.setFont(font, size)
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        test_line = " ".join(current_line + [word])
        if canvas.stringWidth(test_line, font, size) <= max_width:
            current_line.append(word)
        else:
            lines.append(" ".join(current_line))
            current_line = [word]
    lines.append(" ".join(current_line))
    
    for line in lines:
        canvas.drawString(x, y, line)
        y -= leading
        if y < 50: # Simple page overflow protection
            break
            
    return y
