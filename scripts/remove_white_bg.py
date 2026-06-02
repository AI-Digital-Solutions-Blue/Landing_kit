"""Quita el fondo blanco de una PNG dejándolo transparente.

Usa flood-fill desde las 4 esquinas con un color marcador improbable y luego
convierte esos píxeles en transparentes. Suaviza el borde detectando blancos
casi puros (>= white_min) para evitar halo.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw


def remove_white_background(
    input_path: Path,
    output_path: Path,
    threshold: int = 25,
    white_min: int = 240,
) -> None:
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    rgb = img.convert("RGB").copy()
    marker = (1, 254, 1)

    for corner in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        ImageDraw.floodfill(rgb, corner, marker, thresh=threshold)

    pixels_rgb = rgb.load()
    pixels_rgba = img.load()
    for y in range(height):
        for x in range(width):
            if pixels_rgb[x, y] == marker:
                pixels_rgba[x, y] = (0, 0, 0, 0)
            else:
                r, g, b, a = pixels_rgba[x, y]
                if r >= white_min and g >= white_min and b >= white_min:
                    pixels_rgba[x, y] = (r, g, b, 0)

    img.save(output_path, format="PNG", optimize=True)


def main() -> int:
    if len(sys.argv) < 3:
        print("uso: remove_white_bg.py <input.png> <output.png> [threshold] [white_min]")
        return 1
    inp = Path(sys.argv[1])
    out = Path(sys.argv[2])
    thr = int(sys.argv[3]) if len(sys.argv) >= 4 else 25
    wmin = int(sys.argv[4]) if len(sys.argv) >= 5 else 240
    remove_white_background(inp, out, threshold=thr, white_min=wmin)
    print(f"ok: {out} (threshold={thr}, white_min={wmin})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
