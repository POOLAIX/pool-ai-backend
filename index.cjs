const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const { OpenAI } = require("openai");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const imagePath = req.file.path;
    const imageType = req.file.mimetype;

    if (imageType !== "image/png") {
      return res.status(400).json({
        error: "Only PNG images are supported. Please upload a .png file.",
      });
    }

    const form = new FormData();
    form.append("image", fs.createReadStream(imagePath));
    form.append("prompt", prompt);
    form.append("n", 1);
    form.append("size", "1024x1024");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const result = await response.json();
    fs.unlinkSync(imagePath); // delete uploaded temp image

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ imageUrl: result.data[0].url });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Image generation failed." });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
