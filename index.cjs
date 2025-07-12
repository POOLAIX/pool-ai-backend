const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const cors = require("cors");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use memory storage (no file system needed)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const originalImageBuffer = req.file.buffer;

    // Convert to PNG in-memory
    const pngBuffer = await sharp(originalImageBuffer)
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toBuffer();

    const response = await openai.images.edit({
      image: pngBuffer,
      mask: pngBuffer, // for inpainting use mask if needed
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    const imageUrl = response.data.data[0].url;
    res.json({ imageUrl });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: error.message || "Image generation failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Pool Lux AI Backend is running");
});

app.listen(port, () => {
  console.log(`✅ Pool Lux AI backend running on port ${port}`);
});
