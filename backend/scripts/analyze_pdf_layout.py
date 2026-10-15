"""Read-only scan-layout audit for protected CET PDFs.

It never modifies source PDFs. For every page it renders a low-resolution
grayscale image, estimates the non-white content bounds, and flags pages that
need a human crop/rotation decision. The JSON output is an approval manifest
for a later, explicit v2 preprocessing step.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import fitz  # PyMuPDF
import numpy as np


@dataclass
class PageFinding:
    source_path: str
    resource_id: int | None
    page: int
    width: float
    height: float
    existing_rotation: int
    content_box: list[float] | None
    margins: dict[str, float] | None
    flags: list[str]
    suggested_rotation: int | None


def content_bounds(page: fitz.Page) -> tuple[float, float, float, float] | None:
    """Return rendered-pixel bounds of non-white content, mapped to page units."""
    scale = 0.35
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csGRAY, alpha=False)
    width, height = pix.width, pix.height
    threshold = 238
    image = np.frombuffer(pix.samples, dtype=np.uint8).reshape(height, pix.stride)[:, :width]
    rows, columns = np.where(image < threshold)

    if columns.size == 0:
        return None
    min_x, max_x = int(columns.min()), int(columns.max())
    min_y, max_y = int(rows.min()), int(rows.max())

    # Ignore isolated scanner dust at extreme edges by requiring usable area.
    if (max_x - min_x) * (max_y - min_y) < width * height * 0.01:
        return None

    return (min_x / scale, min_y / scale, (max_x + 1) / scale, (max_y + 1) / scale)


def analyze_page(source: Path, resource_id: int | None, page_number: int, page: fitz.Page) -> PageFinding:
    rect = page.rect
    bounds = content_bounds(page)
    flags: list[str] = []
    margins = None

    if rect.width / rect.height > 1.2:
        flags.append("landscape_aspect")
    if page.rotation % 360:
        flags.append("existing_rotation")

    if bounds:
        left = max(0, bounds[0] / rect.width)
        top = max(0, bounds[1] / rect.height)
        right = max(0, (rect.width - bounds[2]) / rect.width)
        bottom = max(0, (rect.height - bounds[3]) / rect.height)
        margins = {"left": round(left, 3), "top": round(top, 3), "right": round(right, 3), "bottom": round(bottom, 3)}
        if max(left, right) >= 0.28:
            flags.append("large_side_margin")
        if max(top, bottom) >= 0.22:
            flags.append("large_vertical_margin")
    else:
        flags.append("content_not_detected")

    # Do not auto-rotate handwriting. Landscape pages are only flagged for review.
    return PageFinding(
        source_path=str(source),
        resource_id=resource_id,
        page=page_number,
        width=round(rect.width, 1),
        height=round(rect.height, 1),
        existing_rotation=page.rotation % 360,
        content_box=[round(value, 1) for value in bounds] if bounds else None,
        margins=margins,
        flags=flags,
        suggested_rotation=None,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a read-only PDF crop/rotation review report.")
    parser.add_argument("--pdf-root", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True, help="Verified upload manifest used only to map resource IDs.")
    parser.add_argument("--output", type=Path, required=True, help="Output JSON approval manifest.")
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    resource_ids = {str(Path(entry["sourcePath"]).resolve()).lower(): entry["resourceId"] for entry in manifest}
    findings: list[PageFinding] = []

    for source in sorted(args.pdf_root.rglob("*.pdf")):
        resource_id = resource_ids.get(str(source.resolve()).lower())
        try:
            with fitz.open(source) as document:
                for page_number, page in enumerate(document, start=1):
                    finding = analyze_page(source, resource_id, page_number, page)
                    if finding.flags:
                        findings.append(finding)
        except (fitz.FileDataError, OSError) as error:
            findings.append(PageFinding(str(source), resource_id, 0, 0, 0, 0, None, None, [f"unreadable: {error}"], None))

    output = {
        "format": "cet-pdf-layout-review-v1",
        "instructions": "Review each entry. Set approved_rotation to 0, 90, 180, or 270 and approved_crop_box to [x0, y0, x1, y1] only after visual review. This report does not change PDFs.",
        "flagged_page_count": len(findings),
        "pages": [asdict(finding) for finding in findings],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Wrote {len(findings)} flagged-page review entries to {args.output}")


if __name__ == "__main__":
    main()
