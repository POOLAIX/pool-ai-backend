const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

// Increase payload and file size limits to 100MB
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// File upload setup (100 MB limit)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 },
});

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Resize image to PNG and max 1024x1024 for OpenAI compatibility
async function preprocessImage(filePath) {
  const outputPath = filePath + ".png";
  await sharp(filePath)
    .resize(1024, 1024, { fit: "inside" })
    .toFormat("png")
    .toFile(outputPath);
  return outputPath;
}

// POST /generate endpoint
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const originalFile = req.file.path;

    // Resize and convert to PNG
    const processedFile = await preprocessImage(originalFile);

    const maskFilePath = processedFile; // same file used as mask for now

    const response = await openai.images.edit({
      image: fs.createReadStream(processedFile),
      mask: fs.createReadStream(maskFilePath),
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    const imageUrl = response.data.data[0].url;
    res.json({ image: imageUrl });

    // Cleanup
    fs.unlink(originalFile, () => {});
    fs.unlink(processedFile, () => {});
  } catch (error) {
    console.error("Error generating image:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Pool AI backend is running.");
});

app.listen(port, () => {
  console.log(`✅ Pool AI backend running on port ${port}`);
});
