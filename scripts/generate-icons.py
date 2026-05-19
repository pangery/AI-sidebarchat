#!/usr/bin/env python3
"""Generate extension icons (16–128px) for package and Chrome Web Store."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "icons"
STORE_ASSETS = ROOT / "store" / "assets"

SIZES = (16, 32, 48, 128)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def gradient_bg(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size))
    px = img.load()
    c1 = (20, 192, 142)   # #14c08e
    c2 = (13, 140, 109)   # #0d8c6d
    c3 = (16, 163, 127)   # #10a37f
    for y in range(size):
        for x in range(size):
            t = (x / max(size - 1, 1) * 0.55) + (y / max(size - 1, 1) * 0.45)
            t = max(0.0, min(1.0, t))
            if t < 0.5:
                u = t * 2
                r = lerp(c1[0], c3[0], u)
                g = lerp(c1[1], c3[1], u)
                b = lerp(c1[2], c3[2], u)
            else:
                u = (t - 0.5) * 2
                r = lerp(c3[0], c2[0], u)
                g = lerp(c3[1], c2[1], u)
                b = lerp(c3[2], c2[2], u)
            px[x, y] = (r, g, b, 255)
    return img


def rounded_mask(size: int, radius: float) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/SFCompactRounded.ttf",
        "/System/Library/Fonts/SFNSRounded.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    img = gradient_bg(size)
    radius = size * 0.22
    mask = rounded_mask(size, radius)
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg.paste(img, (0, 0), mask)

    draw = ImageDraw.Draw(bg)
    pad = size * 0.14

    # Sidebar hint (right strip)
    bar_w = max(2, int(size * 0.2))
    bar_x = int(size - pad - bar_w)
    bar_top = int(pad + size * 0.08)
    bar_bot = int(size - pad - size * 0.08)
    draw.rounded_rectangle(
        (bar_x, bar_top, size - pad, bar_bot),
        radius=max(1, int(size * 0.04)),
        fill=(255, 255, 255, 70),
    )
    # Chat dots in sidebar
    dot_r = max(1, int(size * 0.025))
    cx = bar_x + bar_w // 2
    for i, dy in enumerate((0.0, 0.09, 0.18)):
        cy = int(bar_top + (bar_bot - bar_top) * (0.28 + dy))
        draw.ellipse(
            (cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r),
            fill=(255, 255, 255, 180 if i == 1 else 120),
        )

    # "AI" label
    font_size = max(7, int(size * 0.38))
    font = load_font(font_size)
    text = "AI"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = int(pad + (bar_x - pad - tw) / 2)
    ty = int((size - th) / 2 - size * 0.02)
    draw.text((tx + 1, ty + 1), text, font=font, fill=(0, 60, 45, 90))
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))

    if size >= 48:
        shine = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shine)
        sd.ellipse(
            (int(size * 0.08), int(size * 0.05), int(size * 0.55), int(size * 0.42)),
            fill=(255, 255, 255, 35),
        )
        bg = Image.alpha_composite(bg, shine)

    return bg


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    STORE_ASSETS.mkdir(parents=True, exist_ok=True)

    for s in SIZES:
        icon = draw_icon(s)
        out = ICONS / f"icon{s}.png"
        icon.save(out, format="PNG", optimize=True)
        print(f"Wrote {out}")

    store = draw_icon(128)
    store_path = STORE_ASSETS / "store-icon-128.png"
    store.save(store_path, format="PNG", optimize=True)
    print(f"Wrote {store_path}")


if __name__ == "__main__":
    main()
