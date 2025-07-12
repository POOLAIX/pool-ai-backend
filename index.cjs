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
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '100mb' })); // increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const filePath = req.file.path;

    const resizedPath = `${filePath}-resized.png`;

    // Resize to 1024x1024 and convert to PNG
    await sharp(filePath)
      .resize(1024, 1024, { fit: 'cover' })
      .png()
      .toFile(resizedPath);

    const file = await openai.files.create({
      file: fs.createReadStream(resizedPath),
      purpose: "image",
    });

    const result = await openai.images.edit({
      image: file.id,
      mask: file.id,
      prompt: prompt || "modern pool with spa and pergola",
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    res.json({ imageUrl: result.data[0].url });
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: err.message || "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Pool AI backend running on port ${port}`);
});
