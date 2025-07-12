const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { OpenAI } = require("openai");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
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
