#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
הקופסה — גיליון מגע לסקירת התמונות

מרכיב את כל תמונות המנות לגיליונות גדולים עם מספור,
כדי לעבור עליהן במבט אחד ולאתר תמונות שסותרות את רשימת האלרגנים.

    python tools/contact-sheet.py

הפלט נשמר ל-  .review/sheet-N.jpg  (תיקייה זמנית, לא חלק מהאתר)
"""
import os, glob, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, ".review")
os.makedirs(OUT, exist_ok=True)

CELL = 300          # גודל תא
COLS = 5
ROWS = 4            # 20 תמונות בגיליון
LABEL = 26
PAD = 6

def sheets(paths, prefix):
    per = COLS * ROWS
    made = []
    for s in range((len(paths) + per - 1) // per):
        chunk = paths[s * per:(s + 1) * per]
        W = COLS * (CELL + PAD) + PAD
        H = ROWS * (CELL + LABEL + PAD) + PAD
        sheet = Image.new("RGB", (W, H), (244, 241, 234))
        d = ImageDraw.Draw(sheet)
        for i, p in enumerate(chunk):
            c, r = i % COLS, i // COLS
            x = PAD + c * (CELL + PAD)
            y = PAD + r * (CELL + LABEL + PAD)
            try:
                im = Image.open(p).convert("RGB").resize((CELL, CELL), Image.LANCZOS)
                sheet.paste(im, (x, y))
            except Exception as e:
                d.rectangle([x, y, x + CELL, y + CELL], fill=(220, 210, 200))
                d.text((x + 8, y + 8), "ERR", fill=(180, 0, 0))
            n = os.path.splitext(os.path.basename(p))[0]
            idx = s * per + i + 1
            d.rectangle([x, y + CELL, x + CELL, y + CELL + LABEL], fill=(2, 20, 42))
            d.text((x + 6, y + CELL + 7), f"{idx}. {n[:36]}", fill=(255, 255, 255))
        out = os.path.join(OUT, f"{prefix}-{s+1}.jpg")
        sheet.save(out, quality=88)
        made.append(out)
    return made

meals = sorted(glob.glob(os.path.join(ROOT, "assets/img/meals/*.jpg")))
hero = sorted(glob.glob(os.path.join(ROOT, "assets/img/hero/*.jpg")))

made = sheets(meals, "meals") + sheets(hero, "hero")
print(f"meals: {len(meals)}  hero: {len(hero)}")
for m in made:
    print("  " + os.path.relpath(m, ROOT))
