#!/usr/bin/env python3
"""Chrome Web Store global assets: screenshot, promo tiles (RGB PNG, no alpha)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "store" / "assets"

GREEN = (16, 163, 127)
GREEN_DARK = (13, 140, 109)
GREEN_LIGHT = (20, 192, 142)
BG_PAGE = (248, 250, 252)
BG_BROWSER = (226, 232, 240)
TEXT = (15, 23, 42)
MUTED = (100, 116, 139)
WHITE = (255, 255, 255)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    paths = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/SFCompact.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()


def save_rgb(img: Image.Image, path: Path) -> None:
    if img.mode != "RGB":
        img = img.convert("RGB")
    img.save(path, format="PNG", optimize=True)
    print(f"Wrote {path} ({img.size[0]}x{img.size[1]})")


def draw_rounded_rect(draw: ImageDraw.ImageDraw, xy, radius: int, fill) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def draw_extension_panel(draw: ImageDraw.ImageDraw, x0: int, y0: int, w: int, h: int, provider: str = "Google Gemini") -> None:
    draw.rectangle((x0, y0, x0 + w, y0 + h), fill=WHITE)
    draw.line((x0, y0, x0, y0 + h), fill=(226, 232, 240), width=1)

    header_h = 56
    draw.rectangle((x0, y0, x0 + w, y0 + header_h), fill=(255, 255, 255, 255))
    draw.line((x0, y0 + header_h - 1, x0 + w, y0 + header_h - 1), fill=(226, 232, 240))

    f_bold = font(15, True)
    f_sm = font(11)
    draw.text((x0 + 14, y0 + 12), "AI Sidebar Chat", font=f_bold, fill=TEXT)

    pill_x = x0 + 150
    pill_y = y0 + 10
    pill_w = w - 150 - 90
    draw_rounded_rect(draw, (pill_x, pill_y, pill_x + pill_w, pill_y + 34), 8, (248, 250, 252))
    draw.text((pill_x + 10, pill_y + 8), provider, font=f_sm, fill=TEXT)

    for bx, label in ((x0 + w - 78, "⚙"), (x0 + w - 40, "×")):
        draw_rounded_rect(draw, (bx, pill_y, bx + 30, pill_y + 34), 8, (248, 250, 252))
        draw.text((bx + 9, pill_y + 6), label, font=font(14), fill=MUTED)

    ctx_y = y0 + header_h
    ctx_h = 48
    draw.rectangle((x0, ctx_y, x0 + w, ctx_y + ctx_h), fill=(236, 253, 245))
    draw.ellipse((x0 + 14, ctx_y + 19, x0 + 24, ctx_y + 29), fill=GREEN)
    draw.text((x0 + 32, ctx_y + 10), "Wikipedia — Artificial intelligence", font=f_sm, fill=(6, 95, 70))
    draw.text((x0 + 32, ctx_y + 26), "Web · 2,340 chars · " + provider, font=font(9), fill=MUTED)

    chat_y = ctx_y + ctx_h
    chat_h = h - (chat_y - y0)
    draw.rectangle((x0, chat_y, x0 + w, y0 + h), fill=(250, 251, 253))

    # Simulated chat UI
    cx = x0 + w // 2
    draw_rounded_rect(draw, (cx - 80, chat_y + 40, cx + 80, chat_y + 72), 12, GREEN_LIGHT)
    draw.text((cx - 28, chat_y + 52), "Gemini", font=font(16, True), fill=WHITE)

    bubbles = [
        (x0 + 20, chat_y + 100, x0 + w - 60, chat_y + 140, (236, 253, 245), "Summarize this page about AI…"),
        (x0 + 40, chat_y + 155, x0 + w - 20, chat_y + 210, WHITE, "This article covers machine learning, neural networks…"),
    ]
    for x1, y1, x2, y2, col, txt in bubbles:
        draw_rounded_rect(draw, (x1, y1, x2, y2), 10, col)
        draw.text((x1 + 12, y1 + 10), txt, font=font(10), fill=TEXT)

    draw.text((x0 + 14, y0 + h - 28), "Ctrl+V to paste page context", font=font(10), fill=MUTED)


def make_screenshot() -> Image.Image:
    w, h = 1280, 800
    img = Image.new("RGB", (w, h), BG_BROWSER)
    draw = ImageDraw.Draw(img)

    # Browser window
    margin = 40
    bx, by = margin, margin
    bw, bh = w - margin * 2, h - margin * 2
    draw_rounded_rect(draw, (bx, by, bx + bw, by + bh), 12, WHITE)

    tab_h = 44
    draw.rectangle((bx, by, bx + bw, by + tab_h), fill=(241, 245, 249))
    draw_rounded_rect(draw, (bx + 16, by + 10, bx + bw - 16, by + tab_h - 6), 8, WHITE)
    draw.ellipse((bx + 28, by + 20, bx + 40, by + 32), fill=(34, 197, 94))
    draw.text((bx + 50, by + 16), "en.wikipedia.org/wiki/Artificial_intelligence", font=font(12), fill=MUTED)

    content_x = bx
    content_y = by + tab_h
    content_w = bw
    content_h = bh - tab_h
    panel_w = 400

    # Page content
    page_w = content_w - panel_w
    draw.rectangle((content_x, content_y, content_x + page_w, content_y + content_h), fill=BG_PAGE)
    draw.text((content_x + 32, content_y + 28), "Artificial intelligence", font=font(28, True), fill=TEXT)
    lines = [
        "Artificial intelligence (AI) is the capability of computational",
        "systems to perform tasks typically associated with human",
        "intelligence, such as learning, reasoning, and problem-solving.",
        "",
        "Major approaches include machine learning, deep learning,",
        "and large language models used in modern assistants.",
    ]
    ly = content_y + 80
    for line in lines:
        draw.text((content_x + 32, ly), line, font=font(14), fill=(51, 65, 85))
        ly += 26

    # FAB
    fab_x = content_x + page_w - 70
    fab_y = content_y + content_h - 70
    draw.ellipse((fab_x, fab_y, fab_x + 52, fab_y + 52), fill=GREEN_LIGHT)
    draw.text((fab_x + 14, fab_y + 16), "AI", font=font(16, True), fill=WHITE)

    # Extension panel
    draw_extension_panel(draw, content_x + page_w, content_y, panel_w, content_h)

    # Caption bar
    draw.rectangle((0, h - 36, w, h), fill=GREEN)
    draw.text((24, h - 28), "AI Sidebar Chat — page context ready · Alt+Shift+A", font=font(13, True), fill=WHITE)

    return img


def make_promo_tile() -> Image.Image:
    w, h = 440, 280
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = x / w * 0.6 + y / h * 0.4
            r = int(GREEN_LIGHT[0] * (1 - t) + GREEN_DARK[0] * t)
            g = int(GREEN_LIGHT[1] * (1 - t) + GREEN_DARK[1] * t)
            b = int(GREEN_LIGHT[2] * (1 - t) + GREEN_DARK[2] * t)
            px[x, y] = (r, g, b)

    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((24, 24, 160, 120), radius=20, fill=(255, 255, 255, 40), outline=WHITE, width=2)
    draw.text((48, 52), "AI", font=font(42, True), fill=WHITE)

    draw.text((24, 138), "AI Sidebar Chat", font=font(26, True), fill=WHITE)
    draw.text((24, 178), "ChatGPT · Gemini · Claude", font=font(14), fill=(220, 252, 241))
    draw.text((24, 202), "Perplexity · Grok · Copilot", font=font(14), fill=(220, 252, 241))
    draw.text((24, 238), "Auto page context · No API key", font=font(12), fill=(200, 245, 230))

    # Mini sidebar hint
    draw.rounded_rectangle((330, 40, 410, 240), radius=12, fill=(255, 255, 255, 60))
    for i, yy in enumerate((70, 110, 150)):
        draw.rounded_rectangle((350, yy, 390, yy + 24), radius=6, fill=(255, 255, 255, 120 if i == 1 else 80))

    return img


def make_marquee() -> Image.Image:
    w, h = 1400, 560
    img = Image.new("RGB", (w, h), (15, 23, 42))
    draw = ImageDraw.Draw(img)

    # Left gradient panel
    for x in range(720):
        t = x / 720
        r = int(20 * (1 - t) + GREEN[0] * t * 0.3)
        g = int(30 * (1 - t) + GREEN[1] * t * 0.5)
        b = int(45 * (1 - t) + GREEN[2] * t * 0.5)
        draw.line((x, 0, x, h), fill=(r, g, b))

    draw.text((56, 72), "AI Sidebar Chat", font=font(52, True), fill=WHITE)
    draw.text((56, 148), "Your favorite AI assistants in a sidebar", font=font(22), fill=(203, 213, 225))

    features = [
        "✦  ChatGPT, Gemini, Perplexity, Grok, Claude & more",
        "✦  Automatic page context — paste with Ctrl+V",
        "✦  Floating button · Alt+Shift+A shortcut",
        "✦  Web mode — no API key required",
    ]
    fy = 210
    for feat in features:
        draw.text((56, fy), feat, font=font(18), fill=(220, 252, 241))
        fy += 42

    draw.text((56, h - 56), "Chrome · Edge · Brave · Opera", font=font(14), fill=MUTED)

    # Right: mini browser mock
    mock = Image.new("RGB", (580, 460), BG_BROWSER)
    md = ImageDraw.Draw(mock)
    md.rounded_rectangle((0, 0, 579, 459), radius=16, fill=WHITE)
    md.rectangle((0, 0, 579, 40), fill=(241, 245, 249))
    draw_extension_panel(md, 200, 40, 380, 420, "ChatGPT")
    img.paste(mock, (760, 50))

    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    save_rgb(make_screenshot(), OUT / "screenshot-1-1280x800.png")
    save_rgb(make_promo_tile(), OUT / "promo-tile-440x280.png")
    save_rgb(make_marquee(), OUT / "marquee-1400x560.png")


if __name__ == "__main__":
    main()
