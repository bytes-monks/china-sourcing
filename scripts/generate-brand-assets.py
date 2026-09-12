#!/usr/bin/env python3
"""Render every brand mark in ``public/`` from one source of truth: the font.

    public/favicon.svg           32x32    tab favicon, scalable
    public/favicon-32.png        32x32    fallback favicon
    public/apple-touch-icon.png  180x180  iOS home screen
    public/icon-192.png          192x192  PWA manifest
    public/icon-512.png          512x512  PWA manifest / JSON-LD logo
    public/og-image.png          1200x630 Open Graph + Twitter card

Run it by hand — the output is committed, so it is deliberately NOT part of
``npm run build``:

    python3 scripts/generate-brand-assets.py

The mark is the one from the design canvas and from the header lockup in
``src/components/SiteHeader.tsx``: a #C0392F square with a 3/38 corner radius,
rotated -3deg, carrying a cream serif "B".

The SVG used to be hand-authored, which is exactly how it drifted — its "B" was
a drawn approximation while the PNGs rendered a real font, and the two stopped
looking like the same logo. Both now come from the same file on disk: the PNGs
rasterise it through Pillow, and ``favicon.svg`` carries the glyph's own outline
extracted with fontTools, so the SVG needs no web font and cannot drift again.

The canvas asks for 'Instrument Serif'. It is not installed system-wide, so the
first run downloads it from the google/fonts repo into ``.cache/fonts`` (git
ignored) and every later run reuses that copy. If the download fails the run
still completes on the next serif in the list — and the SVG follows the same
fallback, so the marks stay consistent with each other either way.

Requires Pillow, and fontTools for the SVG.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover - operator-facing
    sys.exit("Pillow is required:  python3 -m pip install --user Pillow")

try:
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.ttLib import TTFont
except ImportError:  # pragma: no cover - operator-facing
    TTFont = None

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public"

# ---------------------------------------------------------------------------
# Palette — the design canvas values, verbatim. Do not invent shades.
# ---------------------------------------------------------------------------
PARCHMENT = (244, 240, 232)  # #F4F0E8  page ground
INK = (26, 22, 20)           # #1A1614  near-black
BODY = (58, 51, 46)          # #3A332E  muted body text
MUTED = (107, 98, 89)        # #6B6259  muted mono
RED = (192, 57, 47)          # #C0392F  signal red

PARCHMENT_HEX = "#F4F0E8"
RED_HEX = "#C0392F"

# 1px rgba(26,22,20,.12) hairline from the canvas, flattened onto parchment.
HAIRLINE = tuple(round(0.12 * i + 0.88 * p) for i, p in zip(INK, PARCHMENT))

# The mark's geometry, as authored: a 38px tile with a 3px radius, rotated -3
# degrees, holding a 24px "B". Everything below is expressed as a ratio of the
# tile side so it scales to any output size.
RADIUS_RATIO = 3 / 38
TILT_DEG = -3.0
CAP_RATIO = 0.46  # cap height of the "B" as a fraction of the tile side

SS = 4  # supersampling factor: draw big, downsample with LANCZOS

# ---------------------------------------------------------------------------
# Fonts
# ---------------------------------------------------------------------------
# The site sets 'Instrument Serif' / Archivo / 'JetBrains Mono'. Every face this
# script needs is fetched into the project's own cache on first run.
#
# An earlier version read the mono — and the serif fallback — straight out of
# /home/<user>/bytes-monks/.cache/fonts, an absolute path into a different
# project on one developer's machine. Anywhere else, including CI, those
# candidates simply did not exist and the mono silently degraded to Pillow's
# bitmap default. SHARED_CACHE survives only as an optional local shortcut and
# is never required.
FONT_CACHE = ROOT / ".cache" / "fonts"
SHARED_CACHE = Path.home() / "bytes-monks" / ".cache" / "fonts"

_GF = "https://raw.githubusercontent.com/google/fonts/main/ofl"
FONT_SOURCES = {
    "InstrumentSerif-Regular.ttf": f"{_GF}/instrumentserif/InstrumentSerif-Regular.ttf",
    "InstrumentSerif-Italic.ttf": f"{_GF}/instrumentserif/InstrumentSerif-Italic.ttf",
    # Variable fonts; Pillow renders their default instance, which is what the
    # marks want anyway.
    "JetBrainsMono.ttf": f"{_GF}/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
    "EBGaramond.ttf": f"{_GF}/ebgaramond/EBGaramond%5Bwght%5D.ttf",
}
UA = "Mozilla/5.0 (X11; Linux x86_64) brand-assets/1.0"
SFNT_MAGIC = (b"\x00\x01\x00\x00", b"OTTO", b"true", b"ttcf")

SERIF_CANDIDATES = [
    FONT_CACHE / "InstrumentSerif-Regular.ttf",
    FONT_CACHE / "EBGaramond.ttf",
    SHARED_CACHE / "EBGaramond-SemiBold.ttf",
    SHARED_CACHE / "EBGaramond-Medium.ttf",
]
SERIF_ITALIC_CANDIDATES = [
    FONT_CACHE / "InstrumentSerif-Italic.ttf",
    SHARED_CACHE / "EBGaramond-MediumItalic.ttf",
    *SERIF_CANDIDATES,
]
MONO_CANDIDATES = [
    FONT_CACHE / "JetBrainsMono.ttf",
    SHARED_CACHE / "JetBrainsMono-Medium.ttf",
]

_warned: set[str] = set()


def ensure_fonts() -> None:
    """Fill the project font cache. A cached file is reused, never refetched.

    A failed download is not fatal: ``font()`` simply walks on to the next
    candidate, and ``favicon.svg`` is built from whichever face that turns out
    to be, so the SVG and the PNGs still agree.
    """
    for name, url in FONT_SOURCES.items():
        dest = FONT_CACHE / name
        if dest.is_file() and dest.stat().st_size > 4096:
            continue
        print(f"  fetching {name} ...", end=" ", flush=True)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                blob = resp.read()
        except Exception as exc:  # noqa: BLE001 - any failure means "fall back"
            print(f"failed ({exc.__class__.__name__}: {exc})")
            continue
        if not blob.startswith(SFNT_MAGIC):
            print(f"failed (not a font, starts {blob[:4]!r})")
            continue
        FONT_CACHE.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_name(dest.name + ".part")
        tmp.write_bytes(blob)
        tmp.replace(dest)
        print(f"{len(blob):,} B -> {dest.relative_to(ROOT)}")


def _fc_match(pattern: str) -> Path | None:
    """Ask fontconfig for a family, e.g. 'serif' or 'monospace'."""
    if not shutil.which("fc-match"):
        return None
    try:
        out = subprocess.run(
            ["fc-match", "-f", "%{file}", pattern],
            capture_output=True, text=True, timeout=10, check=False,
        ).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return None
    p = Path(out) if out else None
    return p if p and p.is_file() else None


def font_file(candidates: list[Path], fc: str) -> Path | None:
    """The file ``font()`` will actually open, so the SVG can read the same one."""
    for path in candidates:
        if path.is_file():
            return path
    return _fc_match(fc)


def font(candidates: list[Path], fc: str, size: int) -> ImageFont.ImageFont:
    """First candidate that loads, else fontconfig, else Pillow's default."""
    for path in candidates:
        if path.is_file():
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                continue
    found = _fc_match(fc)
    if found:
        if fc not in _warned:
            _warned.add(fc)
            print(f"  ! no cached {fc} font; falling back to {found.name}")
        try:
            return ImageFont.truetype(str(found), size)
        except OSError:
            pass
    if fc not in _warned:
        _warned.add(fc)
        print(f"  ! no {fc} font found at all; using Pillow's bitmap default")
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10.1
    except TypeError:
        return ImageFont.load_default()


serif = lambda size: font(SERIF_CANDIDATES, "serif", size)              # noqa: E731
serif_i = lambda size: font(SERIF_ITALIC_CANDIDATES, "serif:italic", size)  # noqa: E731
mono = lambda size: font(MONO_CANDIDATES, "monospace", size)            # noqa: E731

# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------


def ink_box(text: str, f) -> tuple[int, int, int, int]:
    """Bounding box of the drawn pixels, origin at the (0, 0) draw point.

    Not ``textbbox``: that reports the *layout* box, whose x range is 0..advance
    and so is both wider than the glyph and off-centre against it — centring a
    lone "B" by it leans the letter left. Rasterise once and read the true
    extents, which is also what the SVG's outline bbox measures.
    """
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    left, top, right, bottom = probe.textbbox((0, 0), text, font=f)
    pad = 64
    canvas = Image.new("L", (int(right - left) + 2 * pad, int(bottom - top) + 2 * pad))
    ImageDraw.Draw(canvas).text((pad - left, pad - top), text, font=f, fill=255)
    box = canvas.getbbox()
    if box is None:  # whitespace, or a font with nothing to draw
        return (left, top, right, bottom)
    return (box[0] - pad + left, box[1] - pad + top,
            box[2] - pad + left, box[3] - pad + top)


def text_width(text: str, f) -> float:
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    return probe.textlength(text, font=f)


def tracked(draw, xy, text: str, f, fill, track: float, anchor: str = "ls") -> float:
    """Draw letterspaced text. Pillow has no tracking, so step glyph by glyph.

    Returns the advance width. Pass draw=None to measure without drawing.
    """
    width = sum(text_width(ch, f) for ch in text) + track * max(len(text) - 1, 0)
    if draw is None:
        return width
    x, y = xy
    if anchor.startswith("m"):
        x -= width / 2
    elif anchor.startswith("r"):
        x -= width
    vert = anchor[1] if len(anchor) > 1 else "s"
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill, anchor="l" + vert)
        x += text_width(ch, f) + track
    return width


# ---------------------------------------------------------------------------
# The mark
# ---------------------------------------------------------------------------


def mark(side: int) -> Image.Image:
    """The rotated red tile with its cream "B", as RGBA with a clear surround.

    `side` is the *unrotated* tile side in output pixels; the returned image is
    slightly larger than that, because tilting a square grows its bounding box.
    """
    s = side * SS
    tile = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * RADIUS_RATIO, fill=RED + (255,))

    # Size the "B" by its measured cap height, not by nominal font size, so the
    # mark looks identical whichever serif we ended up with.
    target_cap = CAP_RATIO * s
    size = max(int(target_cap * 1.4), 8)
    for _ in range(24):
        f = serif(size)
        x0, y0, x1, y1 = ink_box("B", f)
        cap = y1 - y0
        if cap <= 0:
            break
        if abs(cap - target_cap) <= max(1.0, target_cap * 0.01):
            break
        size = max(8, int(round(size * target_cap / cap)))
    f = serif(size)
    x0, y0, x1, y1 = ink_box("B", f)
    # Centre the glyph's ink, not its metric box.
    d.text((s / 2 - (x0 + x1) / 2, s / 2 - (y0 + y1) / 2), "B", font=f, fill=PARCHMENT + (255,))

    # CSS rotate(-3deg) turns clockwise on a y-down axis; PIL turns the other
    # way, so the sign flips.
    tile = tile.rotate(-TILT_DEG, resample=Image.BICUBIC, expand=True)
    out = max(1, round(tile.width / SS))
    return tile.resize((out, out), Image.LANCZOS)


def icon(size: int, scale: float) -> Image.Image:
    """An opaque parchment square carrying the mark at `scale` of its width."""
    img = Image.new("RGB", (size, size), PARCHMENT)
    m = mark(max(1, round(size * scale)))
    img.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
    return img


# ---------------------------------------------------------------------------
# The SVG favicon — the same mark, the same glyph, as an outline
# ---------------------------------------------------------------------------

VIEW = 32.0            # viewBox side
INSET = 1.5            # gap from the viewBox to the tile, room for the tilt
SVG_BUDGET = 2048      # keep the file trivially inlineable


def _n(value: float, places: int = 3) -> str:
    """Fixed-point, trailing zeros stripped. Never scientific notation."""
    text = f"{value:.{places}f}".rstrip("0").rstrip(".")
    return "0" if text in ("", "-", "-0") else text


def favicon_svg() -> str:
    """The mark as a self-contained SVG: no <text>, no web font, real outline."""
    if TTFont is None:
        raise RuntimeError("fontTools is required for favicon.svg:  "
                           "python3 -m pip install --user fonttools")
    path = font_file(SERIF_CANDIDATES, "serif")
    if path is None:
        raise RuntimeError("no serif font available to extract a 'B' outline from")

    ttf = TTFont(str(path))
    glyphs = ttf.getGlyphSet()
    name = ttf.getBestCmap()[ord("B")]

    bounds = BoundsPen(glyphs)
    glyphs[name].draw(bounds)
    if bounds.bounds is None:
        raise RuntimeError(f"the 'B' in {path.name} has no outline")
    x0, y0, x1, y1 = bounds.bounds

    pen = SVGPathPen(glyphs, ntos=lambda v: _n(v, 1))
    glyphs[name].draw(pen)
    d = pen.getCommands()

    # Same sizing rule as mark(): ink cap height is CAP_RATIO of the tile side,
    # ink bbox centred on the tile. Font units are y-up, so the scale flips y.
    side = VIEW - 2 * INSET
    k = (CAP_RATIO * side) / (y1 - y0)
    mid = VIEW / 2
    tx = mid - (x1 - x0) * k / 2 - x0 * k
    ty = mid + (y1 - y0) * k / 2 + y0 * k

    family = ttf["name"].getDebugName(1) or path.stem
    ttf.close()

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_n(VIEW)} {_n(VIEW)}"'
        f' width="{_n(VIEW)}" height="{_n(VIEW)}" role="img"'
        f' aria-label="Bachar — The China Guy">\n'
        f"  <!-- Generated by scripts/generate-brand-assets.py - do not hand-edit.\n"
        f"       The logo mark from the design canvas: a {RED_HEX} square, radius 3/38\n"
        f"       of the side, rotated -3deg, carrying a cream \"B\" in {family}.\n"
        f"       The letter is the font's own outline rather than <text>, because a\n"
        f"       favicon rasteriser has no web fonts and would substitute whatever\n"
        f"       serif it happens to hold. The PNG icons render the same face. -->\n"
        f'  <g transform="rotate({_n(TILT_DEG)} {_n(mid)} {_n(mid)})">\n'
        f'    <rect x="{_n(INSET)}" y="{_n(INSET)}" width="{_n(side)}" height="{_n(side)}"'
        f' rx="{_n(side * RADIUS_RATIO, 2)}" fill="{RED_HEX}"/>\n'
        f'    <path fill="{PARCHMENT_HEX}"'
        f' transform="translate({_n(tx, 4)} {_n(ty, 4)}) scale({_n(k, 6)} {_n(-k, 6)})"\n'
        f'          d="{d}"/>\n'
        f"  </g>\n"
        f"</svg>\n"
    )


# ---------------------------------------------------------------------------
# The Open Graph card
# ---------------------------------------------------------------------------

W, H = 1200, 630
COLUMN = 880  # left edge of the ink column

HEADLINE = [
    ("I find your factory,", INK, False),
    ("walk the floor,", INK, False),
    ("and get it shipped.", RED, True),
]
EYEBROW = "Sourcing agent · Guangzhou"
STEPS = [("01", "FIND THE FACTORY"), ("02", "WALK THE FLOOR"), ("03", "GET IT SHIPPED")]
FOOTER_L = "bacharthechinaguy.com"
FOOTER_R = "GUANGZHOU · FOSHAN · YIWU · SHENZHEN"

# rgba(244,240,232,.22) and .55 over ink, flattened.
BAR_DIM = tuple(round(0.22 * p + 0.78 * i) for p, i in zip(PARCHMENT, INK))
ON_INK_MUTED = tuple(round(0.55 * p + 0.45 * i) for p, i in zip(PARCHMENT, INK))


def og_card() -> Image.Image:
    """A designed card, not a bare logo: the lockup, the hero line, and the
    ink column that echoes the dark process card on the home page."""
    img = Image.new("RGB", (W, H), PARCHMENT)
    d = ImageDraw.Draw(img)

    x = 96
    right = COLUMN - 64  # right edge of the parchment column's text

    # --- ink column, full bleed -------------------------------------------
    d.rectangle([COLUMN, 0, W, H], fill=INK)
    cx = COLUMN + 40
    tracked(d, (cx, 200), "HOW IT WORKS", mono(12), ON_INK_MUTED, track=12 * 0.18)
    y = 272
    for num, label in STEPS:
        tracked(d, (cx, y), num, mono(13), RED, track=13 * 0.10)
        tracked(d, (cx + 44, y), label, mono(13), PARCHMENT, track=13 * 0.12)
        y += 58
    # The four-segment progress motif from the hero card: three done, one open.
    bx, bw, gap = cx, (W - 40 - cx), 10
    seg = (bw - gap * 3) / 4
    for i in range(4):
        left = bx + i * (seg + gap)
        d.rectangle([left, 440, left + seg, 444], fill=RED if i < 3 else BAR_DIM)

    # --- lockup ------------------------------------------------------------
    m = mark(84)
    img.paste(m, (x, 80), m)
    wx = x + m.width + 22
    d.text((wx, 138), "Bachar", font=serif(60), fill=INK, anchor="ls")
    tracked(d, (wx + 2, 164), "THE CHINA GUY", mono(14), RED, track=14 * 0.18)

    # --- eyebrow + red rule ------------------------------------------------
    tracked(d, (x, 244), EYEBROW.upper(), mono(13), RED, track=13 * 0.16)
    d.rectangle([x, 264, x + 96, 268], fill=RED)

    # --- headline ----------------------------------------------------------
    size = 68
    while size > 40 and max(text_width(t, serif(size)) for t, _, _ in HEADLINE) > right - x:
        size -= 2
    head, head_i = serif(size), serif_i(size)
    y = 348
    for line, colour, italic in HEADLINE:
        d.text((x, y), line, font=head_i if italic else head, fill=colour, anchor="ls")
        y += round(size * 1.12)

    # --- footer ------------------------------------------------------------
    d.rectangle([x, 540, right, 541], fill=HAIRLINE)
    tracked(d, (x, 580), FOOTER_L, mono(15), BODY, track=15 * 0.06)
    tracked(d, (right, 580), FOOTER_R, mono(12), MUTED, track=12 * 0.14, anchor="rs")
    return img


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

JOBS = [
    ("favicon.svg", favicon_svg),
    ("favicon-32.png", lambda: icon(32, 0.90)),
    ("apple-touch-icon.png", lambda: icon(180, 0.72)),
    ("icon-192.png", lambda: icon(192, 0.72)),
    ("icon-512.png", lambda: icon(512, 0.72)),
    ("og-image.png", og_card),
]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    ensure_fonts()
    face = font_file(SERIF_CANDIDATES, "serif")
    print(f"serif       -> {face if face else 'none (Pillow bitmap default)'}")
    print(f"brand assets -> {OUT}")
    failed = []
    for name, build in JOBS:
        dest = OUT / name
        try:
            art = build()
        except RuntimeError as exc:
            print(f"  {name:<22} SKIPPED: {exc}")
            failed.append(name)
            continue
        if isinstance(art, str):
            dest.write_text(art, encoding="utf-8")
            shape = f"{_n(VIEW)}x{_n(VIEW)}"
        else:
            art.save(dest, "PNG", optimize=True)
            shape = f"{art.width}x{art.height}"
        n = dest.stat().st_size
        flag = ""
        if n <= 512:
            flag = "   << suspiciously small"
        elif name.endswith(".svg") and n > SVG_BUDGET:
            flag = f"   << over the {SVG_BUDGET} B budget"
        if flag:
            failed.append(name)
        print(f"  {name:<22} {shape:>9} {n:>8,} B{flag}")
    if failed:
        print(f"\nFAILED: {', '.join(failed)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
