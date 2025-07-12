// index.cjs

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Configuration, OpenAIApi } = require("openai");

const app = express();

// ✅ Fix: Increase payload size limits to 100MB
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(cors());

// ✅ OpenAI Setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Pool AI backend is live.");
});

// ✅ AI image overlay endpoint
app.post("/generate", async (req, res) => {
  try {
    const { image_base64, prompt } = req.body;

    if (!image_base64 || !prompt) {
      return res.status(400).json({ error: "Missing image or prompt." });
    }

    // ✅ Convert base64 to buffer
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // ✅ Resize to 1024x1024 PNG using sharp
    const resized = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toBuffer();

    const tempPath = path.join(__dirname, "input.png");
    fs.writeFileSync(tempPath, resized);

    // ✅ Send to OpenAI
    const result = await openai.createImageEdit(
      fs.createReadStream(tempPath),
      prompt,
      fs.createReadStream(te
