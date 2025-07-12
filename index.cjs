const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

// Multer setup – store in memory, no folder required
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') cb(null, true);
    else cb(new Error("Only PNG files are supported"));
  }
});

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    const prompt = req.body.prompt || "a beautiful modern backyard with pool and spa";

    const response = await openai.images.edit({
      image: imageBuffer,
      mask: imageBuffer, // use same image as mask to apply edit to full image
      prompt,
      model: "dall-e-2",
      response_format: "url",
      n: 1,
      size: "1024x1024"
    });

    const imageUrl = response.data[0].url;
    res.status(200).json({ image: imageUrl });

  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: err.message || "Image generation failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Pool Lux AI backend is running.");
});

app.listen(port, () => {
  console.log(`✅ Pool AI backend running on port ${port}`);
});
