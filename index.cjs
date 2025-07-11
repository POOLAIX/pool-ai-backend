const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  try {
    const { image_base64, prompt } = req.body;

    // Decode base64 PNG
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const tempPath = path.join(__dirname, "temp.png");
    fs.writeFileSync(tempPath, buffer);

    // Send to OpenAI DALL·E 3
    const response = await openai.images.edit({
      image: fs.createReadStream(tempPath),
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    // ✅ FIXED: Correct path to image URL in OpenAI v4
    const imageUrl = response.data.data[0].url;
    console.log("✅ Generated image URL:", imageUrl);

    fs.unlinkSync(tempPath); // cleanup
