#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
הקופסה — הכנת תמונות המנות השקופות לאתר

לוקח את קובצי ה-PNG השקופים שיצאו מ-Qwen (רקע הוסר),
חותך את השוליים השקופים, ממרכז כל מנה על ריבוע אחיד עם מרווח קבוע,
ושומר WebP 800×800 עם ערוץ אלפא ב-assets/img/meals/.

כך כל המנות מוצגות באותו גודל בכרטיס, בלי קשר למיקום שלהן בתמונה המקורית.

    python tools/finalize-webp.py <תיקיית ה-PNG>
"""
import os, sys, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else None
DST = os.path.join(ROOT, "assets", "img", "meals")
SIZE = 800
FILL = 0.86          # המנה תופסת 86% מהצלע הארוכה — שוליים אחידים לצל
ALPHA_CUT = 12       # פיקסלים כמעט שקופים לא נחשבים לגבולות המנה

if not SRC or not os.path.isdir(SRC):
    sys.exit("usage: python tools/finalize-webp.py <png-folder>")

ok, warn = 0, []
for p in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    mid = os.path.splitext(os.path.basename(p))[0]
    im = Image.open(p).convert("RGBA")
    a = im.getchannel("A").point(lambda v: 255 if v > ALPHA_CUT else 0)
    box = a.getbbox()
    if not box:
        warn.append(f"{mid}: ריק לגמרי"); continue
    crop = im.crop(box)
    w, h = crop.size
    # אזהרה אם המודל השאיר כמעט את כל הפריים (רקע לא הוסר)
    covered = (w * h) / (im.size[0] * im.size[1])
    if covered > 0.97:
        warn.append(f"{mid}: הרקע כנראה לא הוסר ({covered:.0%} מהפריים)")
    scale = (SIZE * FILL) / max(w, h)
    crop = crop.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    # מעט מתחת למרכז, כדי להשאיר מקום לצל ה-CSS מתחת
    x = (SIZE - crop.size[0]) // 2
    y = (SIZE - crop.size[1]) // 2 - round(SIZE * 0.015)
    canvas.alpha_composite(crop, (x, max(0, y)))
    canvas.save(os.path.join(DST, f"{mid}.webp"), "WEBP", quality=84, method=6)
    ok += 1

print(f"wrote {ok} webp files to assets/img/meals/")
for w in warn:
    print("  ⚠", w)
