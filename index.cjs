const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Configuration, OpenAIApi } = require("openai");

const app = express();

// ✅ Allow large payloads (base64 images)
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(cors());

// ✅ OpenAI setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Pool AI backend is live.");
});

// ✅ POST /generate
app.post("/generate", async (req, res) => {
  try {
    const { image_base64, prompt } = req.body;

    if (!image_base64 || !prompt) {
      return res.status(400).json({ error: "Missing image or prompt." });
    }

    // ✅ Decode base64 image
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // ✅ Resize to 1024x1024 and convert to PNG
    const resized = await sharp(buffer)
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toBuffer();

    // ✅ Save temp image
    const tempPath = path.join(__dirname, "input.png");
    fs.writeFileSync(tempPath, resized);

    // ✅ OpenAI image overlay (inpainting)
    const result = await openai.createImageEdit(
      fs.createReadStream(tempPath),   // image
      prompt,                          // prompt
      fs.createReadStream(tempPath),   // mask (same image)
      1,
      "1024x1024"
    );

    // ✅ Cleanup temp file
    fs.unlinkSync(tempPath);

    const image_url = result?.data?.data?.[0]?.url;
    if (!image_url) {
      return res.status(500).json({ error: "No image returned from OpenAI." });
    }

    res.json({ image_url });

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Server error", detail: error.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Pool AI backend running on port ${PORT}`);
});
