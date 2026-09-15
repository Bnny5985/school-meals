#!/usr/bin/env node
/* ============================================================
   רענון מחירים מ-Cheapersal
   ------------------------------------------------------------
   למה זה רץ כאן ולא בדפדפן:
   ה-API דורש מפתח. אתר סטטי ב-GitHub Pages חושף כל מפתח שמוטמע בו,
   וכל אחד יוכל לשרוף לך את המכסה (100 בקשות ליום).
   לכן המפתח נשאר אצלך במחשב, והסקריפט כותב מחירים
   קבועים לתוך data/products.js. האתר רק קורא אותם.

   הרצה (PowerShell):
     $env:CHEAPERSAL_KEY = "csal_המפתח_שלך"
     node tools/refresh-prices.mjs

   הרצה (Bash):
     CHEAPERSAL_KEY=csal_... node tools/refresh-prices.mjs

   דורש Node 18 ומעלה.
   ============================================================ */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = join(HERE, "..", "data", "products.js");

const KEY = process.env.CHEAPERSAL_KEY;
const BASE = "https://api.cheapersal.co.il/api/v1";

/* המכסה החינמית: 10 בקשות לדקה. משהים 7 שניות בין בקשות. */
const DELAY_MS = 7000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!KEY) {
  console.error(`
✗ חסר מפתח API.

  הגדר משתנה סביבה בשם CHEAPERSAL_KEY והרץ שוב.
  מפתח מקבלים ב: https://cheapersal.co.il/developers

  PowerShell:  $env:CHEAPERSAL_KEY = "csal_..."
  Bash:        export CHEAPERSAL_KEY=csal_...
`);
  process.exit(1);
}

/** שולף את הברקודים מתוך products.js בלי להריץ אותו */
async function readBarcodes(src) {
  const out = [];
  const re = /id:\s*"([^"]+)"[\s\S]*?barcode:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[2]) out.push({ id: m[1], barcode: m[2] });
  }
  return out;
}

async function fetchPrice(barcode) {
  const r = await fetch(`${BASE}/products/${encodeURIComponent(barcode)}/prices`, {
    headers: { "X-API-Key": KEY },
  });

  if (r.status === 404) return { ok: false, reason: "המוצר לא נמצא במאגר" };
  if (r.status === 429) return { ok: false, reason: "חריגה מהמכסה", fatal: true };
  if (!r.ok) return { ok: false, reason: `HTTP ${r.status}` };

  const j = await r.json();
  if (!j.success) return { ok: false, reason: (j.error && j.error.message) || "שגיאה" };

  const rows = (j.data && (j.data.prices || j.data.items)) || [];
  const nums = rows.map((x) => Number(x.price)).filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return { ok: false, reason: "אין מחירים זמינים" };

  return {
    ok: true,
    min: Math.min(...nums),
    max: Math.max(...nums),
    stores: nums.length,
    remaining: j.meta && j.meta.usage ? j.meta.usage.remaining : null,
  };
}

async function main() {
  const src = await readFile(PRODUCTS_FILE, "utf8");
  const targets = await readBarcodes(src);

  if (!targets.length) {
    console.log(`
ℹ  אין אף מוצר עם ברקוד בקובץ data/products.js.

   כדי להשתמש בסקריפט: פתח את הקובץ, ולמוצר שבדקת ואישרת בעצמך
   מלא את שדה barcode בברקוד מהאריזה. למשל:

     { id: "bread-white", ..., barcode: "7290000066677", price: null, ... }

   ואז הרץ את הסקריפט שוב.
`);
    return;
  }

  console.log(`נמצאו ${targets.length} מוצרים עם ברקוד. מתחיל...\n`);

  let updated = src;
  let okCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    process.stdout.write(`[${i + 1}/${targets.length}] ${t.id} (${t.barcode}) … `);

    let res;
    try {
      res = await fetchPrice(t.barcode);
    } catch (e) {
      res = { ok: false, reason: e.message };
    }

    if (res.ok) {
      const stamp = new Date().toISOString().slice(0, 10);
      const val = `{ min: ${res.min.toFixed(2)}, max: ${res.max.toFixed(2)}, stores: ${res.stores}, updated: "${stamp}" }`;

      /* מחליף את שדה price של המוצר הזה בלבד */
      const block = new RegExp(`(id:\\s*"${t.id}"[\\s\\S]*?price:\\s*)(null|\\{[^}]*\\})`);
      updated = updated.replace(block, `$1${val}`);

      console.log(`₪${res.min.toFixed(2)}–₪${res.max.toFixed(2)} (${res.stores} סניפים)`);
      okCount++;
      if (res.remaining != null) {
        console.log(`      נותרו ${res.remaining} בקשות במכסה`);
      }
    } else {
      console.log(`דילוג — ${res.reason}`);
      if (res.fatal) {
        console.log("\n✗ נגמרה המכסה היומית. נסה שוב מחר.");
        break;
      }
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  if (okCount) {
    await writeFile(PRODUCTS_FILE, updated, "utf8");
    console.log(`\n✓ עודכנו ${okCount} מוצרים בקובץ data/products.js`);
    console.log("  אל תשכח להעלות את השינוי ל-GitHub.");
  } else {
    console.log("\nלא עודכן דבר — הקובץ לא נגע.");
  }

  console.log(`
תזכורת: מחיר הוא לא אישור אלרגני.
בדיקת רכיבים נעשית באתר דרך Open Food Facts, ובעיקר על התווית עצמה.
`);
}

main().catch((e) => {
  console.error("\n✗ שגיאה:", e.message);
  process.exit(1);
});
