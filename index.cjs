const express = require("express");
const cors = require("cors");
const multer = require("multer");
const FormData = require("form-data");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory storage (no disk writes)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const imageBuffer = req.file.buffer;

    const formData = new FormData();
    formData.append("image", imageBuffer, {
      filename: "input.png",
      contentType: "image/png",
    });
    formData.append("mask", imageBuffer, {
      filename: "input.png",
      contentType: "image/png",
    });
    formData.append("prompt", prompt);
    formData.append("n", "1");
    formData.append("size", "1024x1024");
    formData.append("response_format", "url");

    const response = await openai.images.edit({
      image: imageBuffer,
      mask: imageBuffer,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    const imageUrl = response.data.data[0].url;
    res.json({ imageUrl });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
