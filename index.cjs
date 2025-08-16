// index.js
// Minimal Pool Lux AI backend for Railway

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Allow big images
app.use(cors());
app.use(bodyParser.json({ limit: "25mb" }));

// --- Health checks ---
app.get("/", (req, res) => {
  res.send("Pool Lux AI backend is up ✅");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// --- TEMP: Echo mode ---
// This immediately returns the same image you sent, so you can confirm
// the iOS app <-> backend wiring is correct before hooking OpenAI.
// Later, switch to the OpenAI route below.
app.post("/render", async (req, res) => {
  const { imageBase64, prompt, style } = req.body || {};
  if (!imageBase64 || !prompt || !style) {
    return res.status(400).json({ error: "Missing fields (imageBase64, prompt, style required)" });
  }

  // Must return the exact key your app expects:
  // { "outputImageBase64": "data:image/jpeg;base64,..." }
  return res.json({ outputImageBase64: imageBase64 });
});

// --- OPTIONAL: OpenAI inpainting version (uncomment to use) ---
// 1) npm i openai
// 2) set Railway variable: OPENAI_API_KEY
// 3) Comment out the echo route above and use this instead.
/*
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// helper to strip data URL and get raw Buffer
function toBuffer(b64DataUrl) {
  const match = b64DataUrl.match(/^data:(.*?);base64,(.*)$/);
  const base64 = match ? match[2] : b64DataUrl;
  return Buffer.from(base64, "base64");
}

app.post("/render", async (req, res) => {
  try {
    const { imageBase64, prompt, style } = req.body || {};
    if (!imageBase64 || !prompt || !style) {
      return res.status(400).json({ error: "Missing fields (imageBase64, prompt, style required)" });
    }

    // NOTE: images.edit expects file/buffer inputs; adjust to your actual flow.
    const imgBuffer = toBuffer(imageBase64);

    const result = await openai.images.edit({
      // Depending on your OpenAI SDK version, you may need to provide streams or File objects.
      // Some SDK versions allow: image: imgBuffer, prompt: "...", response_format: "b64_json"
      // Check your exact OpenAI SDK docs for images.edit file params.
      image: imgBuffer,
      prompt: `${style} ${prompt}`,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const b64 = result.data[0].b64_json;
    return res.json({ outputImageBase64: `data:image/jpeg;base64,${b64}` });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "Failed to generate image" });
  }
});
*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Pool Lux AI backend running on port ${PORT}`);
});
