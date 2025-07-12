const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
require("dotenv").config();
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, "input.png"),
});
const upload = multer({ storage });

// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "a luxurious modern backyard with pool";
    const response = await openai.images.edit({
      image: fs.createReadStream("uploads/input.png"),
      mask: null,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    res.json({ url: response.data[0].url });
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pool Lux AI backend running on port ${PORT}`));
