import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const inputBuffer = req.file.buffer;
    const inputId = uuidv4();
    const inputPath = path.join(uploadDir, `${inputId}.png`);

    // Convert to PNG and resize (optional)
    await sharp(inputBuffer)
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toFile(inputPath);

    const response = await openai.images.edit({
      image: fs.createReadStream(inputPath),
      mask: fs.createReadStream(inputPath), // or remove if no mask
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    const base64Image = response.data.data[0].b64_json;
    const imgBuffer = Buffer.from(base64Image, "base64");

    res.setHeader("Content-Type", "image/png");
    res.send(imgBuffer);
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: err.message || "Image generation failed" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Pool AI backend running on port ${PORT}`));
