#!/usr/bin/env node
/* ============================================================
   הקופסה — תמונת רקע לאתר (Qwen-Image 2.1, text-to-image)
   לפי התבנית הרשמית image_qwen_image_2_1_t2i: 25 צעדים, cfg 1.

     node tools/gen-bg-qwen.mjs [seed]
   ============================================================ */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "http://127.0.0.1:8188";
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, ".qwen-out", "bg");
const seeds = process.argv.slice(2).map(Number);
if (!seeds.length) seeds.push(11, 22, 33);

/* תמונת רקע: שולחן מואר עם ירקות ופירות טריים בשוליים, מרכז נקי וחלק.
   אין אגוזים, זרעים או קיווי — גם ברקע. */
const PROMPT =
  "A bright airy overhead photograph of a pale cream kitchen table seen from directly above. " +
  "Fresh healthy produce is arranged only along the outer edges of the frame: cherry tomatoes on the vine, " +
  "crisp cucumbers, green lettuce leaves, red apples, strawberries, carrots, fresh basil and mint leaves. " +
  "The entire centre of the image is an empty, smooth, uncluttered cream surface. " +
  "Soft natural morning daylight, gentle shadows, fresh and healthy mood, very light and airy, low contrast, " +
  "pastel tones, shallow depth of field so the produce is softly out of focus. " +
  "There are no nuts, no seeds, no kiwi, no bread, no people, no hands, no text and no logos anywhere.";

function graph(seed) {
  return {
    "1": { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_2.1_int8_convrot.safetensors", weight_dtype: "default" } },
    "2": { class_type: "QwenImage21Cache", inputs: { model: ["1", 0], device: "auto", dtype: "default" } },
    "3": { class_type: "CLIPLoader", inputs: { clip_name: "qwen3vl_8b_int8_convrot.safetensors", type: "qwen_image", device: "default" } },
    "4": { class_type: "VAELoader", inputs: { vae_name: "qwen_image_2.1_vae_bf16.safetensors" } },
    "5": { class_type: "TextEncodeQwenImage21", inputs: { clip: ["3", 0], vae: ["4", 0], prompt: PROMPT, negative_prompt: "", resolution: 1024 } },
    "6": { class_type: "EmptyLatentImage", inputs: { width: 1920, height: 1088, batch_size: 1 } },
    "7": { class_type: "KSampler", inputs: {
      model: ["2", 0], positive: ["5", 0], negative: ["5", 1], latent_image: ["6", 0],
      seed, steps: 25, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["4", 0] } },
    "9": { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: "kupsa_bg/bg" } },
  };
}

await mkdir(OUT, { recursive: true });
for (const seed of seeds) {
  const r = await fetch(`${API}/prompt`, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: graph(seed) }) });
  const b = await r.json();
  if (!r.ok || b.error) { console.log("QUEUE ERROR", JSON.stringify(b).slice(0, 800)); continue; }
  for (;;) {
    await new Promise((s) => setTimeout(s, 3000));
    const h = (await (await fetch(`${API}/history/${b.prompt_id}`)).json())[b.prompt_id];
    if (!h) continue;
    if (h.status?.status_str === "error") {
      const e = (h.status.messages || []).find((m) => m[0] === "execution_error");
      console.log("RUN ERROR", e ? e[1].node_type + ": " + e[1].exception_message : "?"); break;
    }
    if (h.status?.completed) {
      const im = Object.values(h.outputs)[0].images[0];
      const q = new URLSearchParams({ filename: im.filename, subfolder: im.subfolder, type: im.type });
      await writeFile(join(OUT, `bg-${seed}.png`), Buffer.from(await (await fetch(`${API}/view?${q}`)).arrayBuffer()));
      console.log(`OK bg-${seed}`); break;
    }
  }
}
