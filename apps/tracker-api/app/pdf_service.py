from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from datetime import date

def generate_history_pdf(travel_data, employment_data, residence_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Title
    elements.append(Paragraph("Immigration History Report", styles['Title']))
    elements.append(Paragraph(f"Generated on: {date.today()}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Helper to add section
    def add_section(title, data, headers):
        elements.append(Paragraph(title, styles['Heading2']))
        elements.append(Spacer(1, 10))
        
        if not data:
            elements.append(Paragraph("No records found.", styles['Normal']))
        else:
            table_data = [headers] + data
            t = Table(table_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(t)
        
        elements.append(Spacer(1, 20))

    # Travel History
    travel_rows = [
        [t.country, str(t.entry_date), str(t.exit_date or "Present"), t.purpose]
        for t in travel_data
    ]
    add_section("Travel History", travel_rows, ["Country", "Entry Date", "Exit Date", "Purpose"])

    # Employment History
    employment_rows = [
        [e.employer, e.title, f"{e.city}, {e.state}", str(e.start_date), str(e.end_date or "Present")]
        for e in employment_data
    ]
    add_section("Employment History", employment_rows, ["Employer", "Title", "Location", "Start", "End"])

    # Residence History
    residence_rows = [
        [r.address, f"{r.city}, {r.country}", str(r.start_date), str(r.end_date or "Present")]
        for r in residence_data
    ]
    add_section("Residence History", residence_rows, ["Address", "Location", "Start", "End"])

    doc.build(elements)
    buffer.seek(0)
    return buffer
