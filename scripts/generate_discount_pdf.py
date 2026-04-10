#!/usr/bin/env python3
"""Build docs/discount-codes-reference.pdf from gitignored js/discount-codes.secret.js.

Requires: pip install fpdf2 (use project venv: see SETUP.txt)
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "discount-codes-reference.pdf"
SECRET_JS = ROOT / "js" / "discount-codes.secret.js"


def load_rows_from_secret() -> list[tuple[str, str]]:
    if not SECRET_JS.is_file():
        raise SystemExit(
            f"Missing {SECRET_JS}\n"
            "Copy js/discount-codes.secret.example.js to js/discount-codes.secret.js "
            "and add your codes, then re-run this script."
        )
    text = SECRET_JS.read_text(encoding="utf-8")
    pairs: list[tuple[str, int]] = []
    for m in re.finditer(r'"([A-Z0-9][A-Z0-9\-]*)"\s*:\s*(\d+)', text):
        pairs.append((m.group(1), int(m.group(2))))
    if not pairs:
        raise SystemExit(f"No code entries found in {SECRET_JS}")
    pairs.sort(key=lambda x: x[1])
    return [(code, f"{pct}% off priced subtotal") for code, pct in pairs]


def main() -> None:
    from fpdf import FPDF

    rows = load_rows_from_secret()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "SEC - Cart discount codes", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(
        0,
        6,
        "Private reference - do not publish. Each code applies to the priced line-item "
        "subtotal (JMD) on the cart page. Case-insensitive.",
    )
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(55, 8, "Code", border="B")
    pdf.cell(0, 8, "Discount", border="B", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    for code, desc in rows:
        pdf.cell(55, 9, code)
        pdf.cell(0, 9, desc, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(
        0,
        5,
        "Generated from js/discount-codes.secret.js - do not commit that file or this PDF.",
    )
    pdf.output(str(OUT))
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
