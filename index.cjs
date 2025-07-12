const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
require("dotenv").config();

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

const upload = multer({ dest: "uploads/", limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const imagePath = req.file.path;

    const resizedPath = `uploads/resized-${uuidv4()}.png`;

    await sharp(imagePath)
      .resize({ width: 1024 })
      .png()
      .toFile(resizedPath);

    const mask = fs.createReadStream(resizedPath);

    const response = await openai.images.edit({
      image: mask,
      mask: mask,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    const b64 = response.data[0].b64_json;
    const imgBuffer = Buffer.from(b64, "base64");

    res.setHeader("Content-Type", "image/png");
    res.send(imgBuffer);

    fs.unlinkSync(imagePath);
    fs.unlinkSync(resizedPath);
  } catch (err) {
    console.error("Error:", err);
    res.status(400).json({ error: "Error generating image" });
  }
});

app.listen(8080, () => {
  console.log("✅ Pool AI backend running on port 8080");
});
