#!/usr/bin/env python3
"""
Script to create high-fidelity mock documents for Lighthouse Smart Vault testing.
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import black, lightgrey, white, blue
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os
import textwrap
from datetime import datetime

# Create documents directory
os.makedirs('documents', exist_ok=True)

def create_life_insurance_policy():
    """Create a Life Insurance Policy document"""
    filename = 'documents/Life_Insurance_Policy.pdf'
    doc = SimpleDocTemplate(filename, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=blue
    )

    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        alignment=TA_CENTER
    )

    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        alignment=TA_LEFT
    )

    # Title
    story.append(Paragraph("Legacy Life & Casualty", header_style))
    story.append(Paragraph("Permanent Life Policy", header_style))
    story.append(Spacer(1, 20))

    # Policy details
    policy_data = [
        ['<b>Policy Holder:</b>', 'John Robert Smith'],
        ['<b>Policy Number:</b>', 'LH-99887766'],
        ['<b>Benefit Amount:</b>', '$500,000.00'],
        ['<b>Primary Beneficiary:</b>', 'Sarah Smith-Jones'],
        ['<b>Policy Date:</b>', datetime.now().strftime('%B %d, %Y')],
        ['<b>Policy Type:</b>', 'Whole Life Insurance'],
        ['<b>Monthly Premium:</b>', '$275.00'],
        ['<b>Cash Value:</b>', '$45,230.50'],
    ]

    table = Table(policy_data, colWidths=[2*inch, 3*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('GRID', (0, 0), (-1, -1), 1, black)
    ]))

    story.append(table)
    story.append(Spacer(1, 30))

    # Policy terms
    story.append(Paragraph("<b>Policy Terms and Conditions:</b>", header_style))

    terms_text = """
    This policy is a permanent life insurance policy providing coverage for the entire lifetime of the insured person.
    The policy includes a death benefit of $500,000.00 payable to the named primary beneficiary, Sarah Smith-Jones.

    Premiums are due on the 1st of each month and can be paid through various methods including electronic funds transfer,
    credit card, or automatic withdrawal from a bank account.

    The policy accumulates cash value over time, which can be borrowed against or surrendered if needed.
    For more information about policy benefits and terms, please contact our customer service department.
    """

    story.append(Paragraph(terms_text, normal_style))
    story.append(Spacer(1, 30))

    # Watermark
    watermark_style = ParagraphStyle(
        'Watermark',
        parent=styles['Normal'],
        fontSize=36,
        spaceAfter=0,
        alignment=TA_CENTER,
        textColor=lightgrey
    )
    story.append(Paragraph("Watermark: TEST DOCUMENT", watermark_style))

    doc.build(story)
    print(f"Created: {filename}")

def create_will_and_testament():
    """Create a Last Will and Testament document"""
    filename = 'documents/Last_Will_and_Testament.pdf'
    doc = SimpleDocTemplate(filename, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'WillTitle',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=black
    )

    normal_style = ParagraphStyle(
        'WillNormal',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=8,
        alignment=TA_LEFT,
        firstLineIndent=20
    )

    clause_style = ParagraphStyle(
        'ClauseStyle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12,
        alignment=TA_LEFT,
        firstLineIndent=20
    )

    # Title
    story.append(Paragraph("LAST WILL AND TESTAMENT", title_style))
    story.append(Paragraph("OF JOHN ROBERT SMITH", title_style))
    story.append(Spacer(1, 30))

    # Executor information
    story.append(Paragraph("<b>EXECUTOR:</b>", normal_style))
    story.append(Paragraph("I hereby appoint my daughter, Sarah Smith-Jones, as the Executor of this Will.", normal_style))
    story.append(Spacer(1, 20))

    # Will clauses
    story.append(Paragraph("<b>CLAUSE 1: REAL PROPERTY</b>", normal_style))
    story.append(Paragraph("I give, devise, and bequeath all my real property located at 123 Compassion Way, Anytown, ST 12345, to my daughter, Sarah Smith-Jones, absolutely and without conditions.", clause_style))

    story.append(Spacer(1, 15))

    story.append(Paragraph("<b>CLAUSE 2: PERSONAL PROPERTY</b>", normal_style))
    story.append(Paragraph("I give, devise, and bequeath all my personal property, including but not limited to furniture, clothing, jewelry, and household items, to my daughter, Sarah Smith-Jones.", clause_style))

    story.append(Spacer(1, 15))

    story.append(Paragraph("<b>CLAUSE 3: FINANCIAL ASSETS</b>", normal_style))
    story.append(Paragraph("I give, devise, and bequeath all my financial assets, including bank accounts, investments, and retirement accounts, to be divided equally among my children.", clause_style))

    story.append(Spacer(1, 15))

    story.append(Paragraph("<b>CLAUSE 4: FUNERAL ARRANGEMENTS</b>", normal_style))
    story.append(Paragraph("It is my wish that my remains be cremated and that my ashes be scattered in the Pacific Ocean at a location to be determined by my Executor.", clause_style))

    story.append(Spacer(1, 30))

    # Signature section
    story.append(Paragraph("<b>SIGNATURE</b>", normal_style))

    signature_lines = [
        "_______________________________________",
        "John Robert Smith",
        "Testator",
        "",
        "Date: _______________",
        "",
        "_______________________________________",
        "Sarah Smith-Jones",
        "Witness",
        "",
        "Date: _______________",
        "",
        "_______________________________________",
        "Notary Public",
        "My Commission Expires: _______________"
    ]

    for line in signature_lines:
        story.append(Paragraph(line, normal_style))

    doc.build(story)
    print(f"Created: {filename}")

def create_state_id():
    """Create a State ID document"""
    filename = 'documents/State_ID_Card.pdf'
    doc = SimpleDocTemplate(filename, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    header_style = ParagraphStyle(
        'IDHeader',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=10,
        alignment=TA_CENTER,
        textColor=black
    )

    label_style = ParagraphStyle(
        'IDLabel',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=2,
        alignment=TA_LEFT
    )

    value_style = ParagraphStyle(
        'IDValue',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=8,
        alignment=TA_LEFT,
        fontWeight='bold'
    )

    # Create ID card layout
    story.append(Paragraph("State of Example", header_style))
    story.append(Paragraph("Driver License", header_style))
    story.append(Spacer(1, 20))

    # ID information in a table format
    id_data = [
        ['<b>CLASS:</b>', 'C', '<b>RESTRICTIONS:</b>', 'None'],
        ['<b>SEX:</b>', 'Male', '<b>HEIGHT:</b>', "5'10\""],
        ['<b>EYES:</b>', 'Blue', '<b>WEIGHT:</b>', '185 lbs'],
        ['<b>HAIR:</b>', 'Brown', '<b>ORGAN DONOR:</b>', 'YES'],
        ['<b>NAME:</b>', 'John R. Smith', ''],
        ['<b>DOB:</b>', '05/12/1955', ''],
        ['<b>ADDRESS:</b>', '123 Compassion Way', ''],
        ['', 'Anytown, ST 12345', ''],
        ['<b>ISSUE DATE:</b>', '01/10/2020', '<b>EXPIRES:</b>', '01/10/2025']
    ]

    table = Table(id_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('GRID', (0, 0), (-1, -1), 0.5, black)
    ]))

    story.append(table)
    story.append(Spacer(1, 20))

    # Additional information
    story.append(Paragraph("<b>DOCUMENT NUMBER:</b> EX-1987654321", value_style))
    story.append(Paragraph("<b>ISSUING AUTHORITY:</b> State of Example Department of Motor Vehicles", value_style))

    story.append(Spacer(1, 30))

    # Security features notice
    security_style = ParagraphStyle(
        'Security',
        parent=styles['Normal'],
        fontSize=9,
        spaceAfter=4,
        alignment=TA_CENTER,
        textColor=lightgrey
    )
    story.append(Paragraph("This document contains security features to prevent counterfeiting.", security_style))
    story.append(Paragraph("Unauthorized reproduction is a criminal offense.", security_style))

    doc.build(story)
    print(f"Created: {filename}")

if __name__ == "__main__":
    print("Creating mock documents for Lighthouse Smart Vault...")

    try:
        create_life_insurance_policy()
        create_will_and_testament()
        create_state_id()

        print("\nDocuments created successfully!")
        print("Documents directory:")
        os.system('ls -la documents/')

    except Exception as e:
        print(f"Error creating documents: {e}")
        print("Please ensure ReportLab is installed: pip install reportlab")