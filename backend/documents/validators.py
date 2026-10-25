from pathlib import Path

from django.core.exceptions import ValidationError


MAX_RESUME_SIZE = 5 * 1024 * 1024


def validate_pdf_file(uploaded_file):
    if Path(uploaded_file.name).suffix.lower() != ".pdf":
        raise ValidationError("Only PDF files are allowed.")
    if uploaded_file.size > MAX_RESUME_SIZE:
        raise ValidationError("PDF files must be 5 MB or smaller.")

    position = uploaded_file.tell()
    header = uploaded_file.read(5)
    uploaded_file.seek(position)
    if header != b"%PDF-":
        raise ValidationError("The uploaded file does not contain a valid PDF header.")
