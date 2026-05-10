"""Extract CGM summary stats from a vendor PDF report (Ottai-style).

The PDF is processed in-memory only — the bytes never touch disk.
Returns a stats dict in the same shape the CSV path produces, so downstream
code is format-agnostic.
"""

from __future__ import annotations

import io
import re
from typing import Any

from pypdf import PdfReader


_DATE_RE = re.compile(
    r"(\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}).{0,5}?(\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4})"
)
_DAYS_RE = re.compile(r"\((\d+)\s*days?\)", re.I)
_AVG_RE = re.compile(r"Average\s+(\d{2,3}(?:\.\d+)?)\s*mg/dL", re.I)
_AVG_FALLBACK_RE = re.compile(r"(\d{2,3}(?:\.\d+)?)\s*mg/dL")
_CV_RE = re.compile(r"\bCV\s+(\d{1,2}(?:\.\d+)?)\s*%", re.I)
_EHBA1C_RE = re.compile(r"eHbA1c\s+(\d{1,2}(?:\.\d+)?)\s*%", re.I)
_TIR_RE = re.compile(r"TIR\s*:?\s*(\d{1,3}(?:\.\d+)?)", re.I)
_TAR_RE = re.compile(r"TAR\s*:?\s*(\d{1,3}(?:\.\d+)?)", re.I)
_TBR_RE = re.compile(r"TBR\s*:?\s*(\d{1,3}(?:\.\d+)?)", re.I)


def extract_stats_from_pdf(data: bytes) -> dict[str, Any]:
    reader = PdfReader(io.BytesIO(data))
    text_parts: list[str] = []
    for page in reader.pages[:3]:  # summary lives on first 1-2 pages
        try:
            text_parts.append(page.extract_text() or "")
        except Exception:
            continue
    text = "\n".join(text_parts)

    stats: dict[str, Any] = {
        "avg_mg_dl": _first_float(_AVG_RE, text) or _first_float(_AVG_FALLBACK_RE, text),
        "cv_pct": _first_float(_CV_RE, text),
        "ehba1c_pct": _first_float(_EHBA1C_RE, text),
        "tir_pct": _first_float(_TIR_RE, text),
        "tar_pct": _first_float(_TAR_RE, text),
        "tbr_pct": _first_float(_TBR_RE, text),
        "session_start": None,
        "session_end": None,
        "days_covered": None,
    }

    m = _DATE_RE.search(text)
    if m:
        stats["session_start"] = m.group(1).strip()
        stats["session_end"] = m.group(2).strip()
    d = _DAYS_RE.search(text)
    if d:
        stats["days_covered"] = int(d.group(1))

    return stats


def _first_float(rx: re.Pattern[str], text: str) -> float | None:
    m = rx.search(text)
    if not m:
        return None
    try:
        return float(m.group(1))
    except (ValueError, IndexError):
        return None
