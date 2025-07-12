const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({ limit: "25mb", extended: true }));

// OpenAI initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  try {
    const { image, prompt } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({ error: "Image and prompt are required." });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(image, "base64");

    // Save resized image to tmp folder
    const resizedPath = path.join(__dirname, "resized.png");
    await sharp(buffer)
      .resize(1024, 1024, {
        fit: sharp.fit.cover,
      })
      .toFormat("png")
      .toFile(resizedPath);

    // Send image to OpenAI
    const response = await openai.images.edit({
      image: fs.createReadStream(resizedPath),
      mask: fs.createReadStream(resizedPath), // using same image as dummy mask
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    const imageUrl = response.data[0].url;
    res.json({ imageUrl });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Pool AI backend is running");
});

app.listen(port, () => {
  console.log(`✅ Pool AI backend running on port ${port}`);
});
