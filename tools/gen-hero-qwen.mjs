#!/usr/bin/env node
/* ============================================================
   הקופסה — תמונת הכותרת של עמוד הבית (Qwen-Image 2.1, text-to-image)
   קופסת אוכל מושקעת בצד שמאל, ומקום פנוי בצד ימין לכרטיס הטקסט.
   לפי התבנית הרשמית: 25 צעדים, cfg 1 — לכן כל האיסורים כתובים בפרומפט החיובי.

     node tools/gen-hero-qwen.mjs [seed ...]
   ============================================================ */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "http://127.0.0.1:8188";
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, ".qwen-out", "hero");
const seeds = process.argv.slice(2).map(Number);
if (!seeds.length) seeds.push(101, 202, 303, 404);

const PROMPT =
  "A bright, premium, healthy food photograph for a website hero banner, wide landscape composition, shot at a 40 degree angle. " +
  "On the LEFT side of the frame: an open premium stainless steel bento lunchbox with sunny yellow clip latches and a yellow inner compartment. " +
  "Inside the lunchbox: a sandwich cut in half on soft plain white bread with a smooth crust, filled with tuna, crisp green lettuce leaves and thin tomato slices; " +
  "fresh cucumber sticks, shiny cherry tomatoes, and crisp red apple slices in the yellow compartment. " +
  "Fresh frilly green lettuce leaves and a few basil leaves are tucked around the box. A yellow and white gingham napkin lies under the box. " +
  "The RIGHT half of the frame is calm empty negative space: a soft, out of focus pale cream wooden table with gentle warm morning light, " +
  "with only a few softly blurred fresh vegetables (a red apple, cucumber slices, lettuce) at the far right edge. " +
  "Fresh, clean, healthy, appetizing, natural daylight, shallow depth of field, warm golden yellow and fresh green tones, high-end editorial food photography. " +
  "Absolutely no nuts of any kind, no seeds, no sesame, no seeded or multigrain bread, no peanut butter, no kiwi, no chocolate spread, " +
  "no text, no letters, no logos, no people, no hands.";

function graph(seed) {
  return {
    "1": { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_2.1_int8_convrot.safetensors", weight_dtype: "default" } },
    "2": { class_type: "QwenImage21Cache", inputs: { model: ["1", 0], device: "auto", dtype: "default" } },
    "3": { class_type: "CLIPLoader", inputs: { clip_name: "qwen3vl_8b_int8_convrot.safetensors", type: "qwen_image", device: "default" } },
    "4": { class_type: "VAELoader", inputs: { vae_name: "qwen_image_2.1_vae_bf16.safetensors" } },
    "5": { class_type: "TextEncodeQwenImage21", inputs: { clip: ["3", 0], vae: ["4", 0], prompt: PROMPT, negative_prompt: "", resolution: 1024 } },
    "6": { class_type: "EmptyLatentImage", inputs: { width: 1920, height: 832, batch_size: 1 } },
    "7": { class_type: "KSampler", inputs: {
      model: ["2", 0], positive: ["5", 0], negative: ["5", 1], latent_image: ["6", 0],
      seed, steps: 25, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["4", 0] } },
    "9": { class_type: "SaveImage", inputs: { images: ["8", 0], filename_prefix: "kupsa_hero/hero" } },
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
      await writeFile(join(OUT, `hero-${seed}.png`), Buffer.from(await (await fetch(`${API}/view?${q}`)).arrayBuffer()));
      console.log(`OK hero-${seed}`); break;
    }
  }
}
