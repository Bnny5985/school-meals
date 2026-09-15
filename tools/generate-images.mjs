#!/usr/bin/env node
/* ============================================================
   הקופסה — יצירת התמונות דרך ComfyUI
   ------------------------------------------------------------
   מדבר ישירות עם ה-API של ComfyUI (פורט 8188). לא צריך MCP.

   הרצה:
     node tools/generate-images.mjs                # הכול (67)
     node tools/generate-images.mjs --only hero    # רק 7 תמונות ראשיות
     node tools/generate-images.mjs --only meals   # רק 60 מנות
     node tools/generate-images.mjs --id tuna-sandwich choc-chip-cookies
     node tools/generate-images.mjs --force        # גם תמונות שכבר קיימות
     node tools/generate-images.mjs --seed 12345   # סיד קבוע לשחזור

   דורש Node 18+ ו-ComfyUI פעיל.
   ============================================================ */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const { buildAll } = require("./image-prompts.js");

const HOST = process.env.COMFY_HOST || "127.0.0.1:8188";
const API = `http://${HOST}`;
const CKPT = process.env.FLUX_CKPT || "flux1-schnell-fp8.safetensors";
const STEPS = Number(process.env.FLUX_STEPS || 6);   /* schnell: 4–8 מספיק */
const CFG = 1.0;                                      /* schnell תמיד cfg 1 */

/* ---------- ארגומנטים ---------- */
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const val = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const only = val("--only");
const force = flag("--force");
const baseSeed = Number(val("--seed") || 0) || null;
const idsArg = (() => {
  const i = argv.indexOf("--id");
  if (i < 0) return null;
  const out = [];
  for (let k = i + 1; k < argv.length && !argv[k].startsWith("--"); k++) out.push(argv[k]);
  return out.length ? out : null;
})();

const exists = (p) => access(p).then(() => true).catch(() => false);

/* ---------- בניית הגרף ---------- */
function workflow(job, seed) {
  return {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: CKPT } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: job.positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: job.negative, clip: ["1", 1] } },
    "4": { class_type: "EmptyLatentImage", inputs: { width: job.w, height: job.h, batch_size: 1 } },
    "5": {
      class_type: "KSampler",
      inputs: {
        seed, steps: STEPS, cfg: CFG,
        sampler_name: "euler", scheduler: "simple", denoise: 1.0,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0],
      },
    },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { filename_prefix: `kupsa/${job.id}`, images: ["6", 0] } },
  };
}

/* ---------- תקשורת עם ComfyUI ---------- */
async function queue(prompt, clientId) {
  const r = await fetch(`${API}/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, client_id: clientId }),
  });
  if (!r.ok) throw new Error(`queue failed ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json()).prompt_id;
}

async function waitFor(promptId, timeoutMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = await fetch(`${API}/history/${promptId}`);
    if (r.ok) {
      const h = await r.json();
      const entry = h[promptId];
      if (entry) {
        const st = entry.status || {};
        if (st.status_str === "error" || st.completed === false && st.status_str === "error") {
          const msg = JSON.stringify(st.messages || []).slice(0, 400);
          throw new Error(`ComfyUI error: ${msg}`);
        }
        if (entry.outputs) {
          for (const nodeOut of Object.values(entry.outputs)) {
            if (nodeOut.images?.length) return nodeOut.images[0];
          }
        }
      }
    }
    await new Promise((s) => setTimeout(s, 900));
  }
  throw new Error("timeout waiting for image");
}

async function fetchImage(img) {
  const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || "", type: img.type || "output" });
  const r = await fetch(`${API}/view?${q}`);
  if (!r.ok) throw new Error(`view failed ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/* ---------- שינוי גודל ושמירה כ-JPG ---------- */
/* משתמש ב-ffmpeg אם קיים (מותקן כמעט תמיד לצד ComfyUI), אחרת שומר PNG כמו שהוא */
function hasFfmpeg() {
  return new Promise((res) => {
    const p = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    p.on("error", () => res(false));
    p.on("close", (c) => res(c === 0));
  });
}

function resizeToJpg(pngBuf, outPath, w, h) {
  return new Promise((res, rej) => {
    const p = spawn("ffmpeg", [
      "-y", "-loglevel", "error", "-i", "pipe:0",
      "-vf", `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`,
      "-q:v", "3", outPath,
    ]);
    p.on("error", rej);
    p.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg exit " + c))));
    p.stdin.end(pngBuf);
  });
}

/* ---------- ראשי ---------- */
async function main() {
  /* בדיקת חיבור */
  let stats;
  try {
    stats = await (await fetch(`${API}/system_stats`)).json();
  } catch {
    console.error(`\n✗ ComfyUI לא מגיב ב-${API}\n  הפעל אותו, או הגדר COMFY_HOST.\n`);
    process.exit(1);
  }
  const gpu = stats.devices?.[0]?.name || "?";
  console.log(`✓ ComfyUI ${stats.system?.comfyui_version} · ${gpu}`);

  /* בדיקה שהמודל קיים */
  const info = await (await fetch(`${API}/object_info/CheckpointLoaderSimple`)).json();
  const avail = info.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
  if (!avail.includes(CKPT)) {
    console.error(`\n✗ המודל "${CKPT}" לא נמצא ב-ComfyUI.`);
    console.error(`  זמינים: ${avail.join(", ") || "(אין)"}`);
    console.error(`  הורד את Flux.1-schnell לתיקיית models/checkpoints, או הגדר FLUX_CKPT.\n`);
    process.exit(1);
  }
  console.log(`✓ מודל: ${CKPT} · ${STEPS} צעדים\n`);

  const ff = await hasFfmpeg();
  if (!ff) console.log("⚠ ffmpeg לא נמצא — התמונות יישמרו כ-PNG בגודל המקורי.\n");

  /* סינון המשימות */
  let jobs = buildAll();
  if (only === "hero") jobs = jobs.filter((j) => j.file.includes("/hero/"));
  if (only === "meals") jobs = jobs.filter((j) => j.file.includes("/meals/"));
  if (idsArg) jobs = jobs.filter((j) => idsArg.includes(j.id));

  if (!force) {
    const keep = [];
    for (const j of jobs) if (!(await exists(join(ROOT, j.file)))) keep.push(j);
    const skipped = jobs.length - keep.length;
    if (skipped) console.log(`מדלג על ${skipped} תמונות שכבר קיימות (--force כדי לייצר מחדש)\n`);
    jobs = keep;
  }

  if (!jobs.length) { console.log("אין מה לייצר."); return; }

  await mkdir(join(ROOT, "assets/img/meals"), { recursive: true });
  await mkdir(join(ROOT, "assets/img/hero"), { recursive: true });

  const clientId = "kupsa-" + Math.random().toString(36).slice(2);
  const t0 = Date.now();
  let ok = 0;
  const failed = [];

  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    const seed = baseSeed ? baseSeed + i : Math.floor(Math.random() * 2 ** 31);
    const tag = `[${String(i + 1).padStart(2)}/${jobs.length}] ${j.id}`;
    process.stdout.write(`${tag} … `);
    try {
      const pid = await queue(workflow(j, seed), clientId);
      const img = await waitFor(pid);
      const buf = await fetchImage(img);
      const outAbs = join(ROOT, j.file);
      if (ff) await resizeToJpg(buf, outAbs, j.out[0], j.out[1]);
      else await writeFile(outAbs.replace(/\.jpg$/, ".png"), buf);
      console.log(`✓ ${j.out[0]}×${j.out[1]}  (seed ${seed})`);
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      failed.push({ id: j.id, err: e.message });
    }
  }

  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n${"─".repeat(56)}`);
  console.log(`הושלם: ${ok}/${jobs.length} תמונות ב-${mins} דקות`);
  if (failed.length) {
    console.log(`\nנכשלו (${failed.length}):`);
    failed.forEach((f) => console.log(`  ${f.id} — ${f.err}`));
    console.log(`\nלניסיון חוזר:  node tools/generate-images.mjs --id ${failed.map((f) => f.id).join(" ")}`);
  }
  console.log(`
⚠️  לפני שמעלים ל-GitHub — עבור על התמונות ובדוק:
    • אין זרעי שומשום או פרג על הלחם
    • אין אגוזים, שקדים או פיסטוק על הקינוחים
    • אין קיווי בשום קערת פירות
    תמונה שסותרת את רשימת האלרגנים מסוכנת יותר מאשר אין תמונה בכלל.
`);
}

main().catch((e) => { console.error("\n✗", e.message); process.exit(1); });
