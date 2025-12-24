from __future__ import annotations

import io
import re
from dataclasses import dataclass
from typing import Iterable, List, Tuple


def _clean(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


@dataclass
class ExtractResult:
    full_text: str
    chunks: List[str]


def chunk_text(text: str, chunk_size: int = 600) -> List[str]:
    text = _clean(text)
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(len(text), start + chunk_size)
        chunks.append(text[start:end])
        start = end
    return chunks


def extract_text_from_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        parts: List[str] = []
        for p in reader.pages:
            t = p.extract_text() or ""
            if t.strip():
                parts.append(t)
        return _clean("\n".join(parts))
    except Exception as e:
        print(f"Error reading PDF with pypdf: {e}")
        return ""

def extract_text_from_scanned_pdf(data: bytes) -> str:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
        
        images = convert_from_bytes(data)
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img) + "\n"
        return _clean(text)
    except Exception as e:
        print(f"Error OCRing scanned PDF: {e}")
        return ""


def extract_text_from_image(data: bytes) -> str:
    try:
        from PIL import Image
        import pytesseract

        img = Image.open(io.BytesIO(data)).convert("RGB")
        txt = pytesseract.image_to_string(img)
        return _clean(txt)
    except Exception:
        return ""


def extract_text(content_type: str, data: bytes) -> ExtractResult:
    ct = (content_type or "").lower()
    text = ""
    if "pdf" in ct:
        text = extract_text_from_pdf(data)
        if not text or len(text) < 50:  # Fallback if text is empty or very short
            print("PDF text extraction yielded little/no text. Attempting OCR...")
            ocr_text = extract_text_from_scanned_pdf(data)
            if ocr_text:
                text = ocr_text
    elif any(x in ct for x in ["png", "jpeg", "jpg", "image"]):
        text = extract_text_from_image(data)

    if not text:
        # Safe fallback to avoid a dead demo.
        text = "No readable text was extracted from this file."

    return ExtractResult(full_text=text, chunks=chunk_text(text))
