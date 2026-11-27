"""Rebuild first-paint WOFF2 subsets: python with fonttools[woff] and brotli.

The original local fonts remain the fallback for all other characters.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
fonts = root / "public/fonts"
out = fonts / "de-v1"
out.mkdir(exist_ok=True)
chars = "U+0020-007E,U+00A0,U+00A7,U+00B0,U+00B2-00B3,U+00B7,U+00C0-00FF,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+20AC,U+2212"
points = subset.parse_unicodes(chars)
for font in sorted([*fonts.glob("barlow-*.woff2"), *fonts.glob("bsc-*.woff2")]):
    subset.main([str(font), f"--unicodes={chars}", "--layout-features=kern,liga,clig,locl",
                 "--no-hinting", "--name-IDs=*", "--flavor=woff2", f"--output-file={out / font.name}"])
    with TTFont(font) as original, TTFont(out / font.name) as small:
        old, new = original.getBestCmap(), small.getBestCmap()
        assert set(new) == set(points).intersection(old)
        for cp in new:
            assert original["hmtx"].metrics[old[cp]] == small["hmtx"].metrics[new[cp]]
        assert (out / font.name).stat().st_size < font.stat().st_size * .65
