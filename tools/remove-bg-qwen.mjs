#!/usr/bin/env node
/* ============================================================
   הקופסה — הסרת רקע מתמונות המנות עם Qwen-Image 2.1
   ------------------------------------------------------------
   מבוסס על התבנית הרשמית של ComfyUI:
     image_qwen_image_2_1_background_removal
   עורך את התמונות הקיימות (שכבר עברו בדיקת אלרגנים) במקום
   לייצר חדשות — כך התוכן נשמר בדיוק, ורק הרקע יורד.
   ה-VAE של Qwen 2.1 מוציא RGBA, אז השקיפות מובנית במודל.

     node tools/remove-bg-qwen.mjs                 # כל המנות
     node tools/remove-bg-qwen.mjs brownies pizza-buns
     FORCE=1 node tools/remove-bg-qwen.mjs brownies

   אחר כך:  python tools/finalize-webp.py tools/.qwen-out
   ============================================================ */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const API = "http://127.0.0.1:8188";
const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, ".qwen-out");
let ids = process.argv.slice(2);
if (!ids.length) {
  const require = createRequire(import.meta.url);
  global.window = global;
  for (const f of ["config", "meals-breakfast", "meals-lunch", "meals-friday"]) require(join(SITE, "data", f + ".js"));
  ids = window.MEALS.map((m) => m.id);
}
const PROMPT = process.env.QPROMPT ||
  "Remove the background completely, keep only the plate and the food on it exactly as they are, and output a PNG image with a transparent background";
await mkdir(OUT, { recursive: true });

async function upload(id) {
  const buf = await readFile(`${SITE}/tools/source-images/${id}.jpg`);
  const fd = new FormData();
  fd.append("image", new Blob([buf], { type: "image/jpeg" }), `${id}.jpg`);
  fd.append("subfolder", "kupsa");
  fd.append("overwrite", "true");
  const r = await fetch(`${API}/upload/image`, { method: "POST", body: fd });
  if (!r.ok) throw new Error("upload " + r.status);
  const j = await r.json();
  return (j.subfolder ? j.subfolder + "/" : "") + j.name;
}

function graph(imgName, seed) {
  return {
    "1": { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_2.1_int8_convrot.safetensors", weight_dtype: "default" } },
    "2": { class_type: "QwenImage21Cache", inputs: { model: ["1", 0], device: "auto", dtype: "default" } },
    "3": { class_type: "CLIPLoader", inputs: { clip_name: "qwen3vl_8b_int8_convrot.safetensors", type: "qwen_image", device: "default" } },
    "4": { class_type: "VAELoader", inputs: { vae_name: "qwen_image_2.1_vae_bf16.safetensors" } },
    "5": { class_type: "LoadImage", inputs: { image: imgName } },
    "6": { class_type: "TextEncodeQwenImage21", inputs: {
      clip: ["3", 0], vae: ["4", 0], prompt: PROMPT, negative_prompt: "", resolution: 1024,
      "images.image_1": ["5", 0] } },
    "7": { class_type: "KSampler", inputs: {
      model: ["2", 0], positive: ["6", 0], negative: ["6", 1], latent_image: ["6", 2],
      seed, steps: 25, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["4", 0] } },
    "9": { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: "kupsa_edit/out" } },
  };
}

for (const id of ids) {
  if (!process.env.FORCE && existsSync(`${OUT}/${id}.png`)) { console.log(`SKIP ${id}`); continue; }
  const t0 = Date.now();
  const name = await upload(id);
  const r = await fetch(`${API}/prompt`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: graph(name, 7) }) });
  const b = await r.json();
  if (!r.ok || b.error) { console.log(id, "QUEUE ERROR", JSON.stringify(b).slice(0, 1200)); continue; }
  let done = false;
  while (!done) {
    await new Promise((s) => setTimeout(s, 1500));
    const h = (await (await fetch(`${API}/history/${b.prompt_id}`)).json())[b.prompt_id];
    if (!h) continue;
    if (h.status?.status_str === "error") {
      const e = (h.status.messages || []).find((m) => m[0] === "execution_error");
      console.log(id, "RUN ERROR", e ? e[1].node_type + ": " + e[1].exception_message : "?"); done = true; break;
    }
    if (h.status?.completed) {
      const im = Object.values(h.outputs)[0].images[0];
      const q = new URLSearchParams({ filename: im.filename, subfolder: im.subfolder, type: im.type });
      await writeFile(`${OUT}/${id}.png`, Buffer.from(await (await fetch(`${API}/view?${q}`)).arrayBuffer()));
      console.log(`OK ${id} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      done = true;
    }
  }
}
