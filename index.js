import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json({ limit: "15mb" })); // ⬅️ allow larger image uploads

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  const { prompt, image } = req.body;

  if (!prompt || !image) {
    return res.status(400).json({ error: "Missing prompt or image" });
  }

  try {
    const response = await openai.images.edit({
      model: "dall-e-3",
      image: image, // base64-encoded image
      prompt: `Overlay a modern backyard design: ${prompt}`,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const base64Image = response.data[0].b64_json;
    res.status(200).json({ imageBase64: base64Image });
  } catch (err) {
    console.error("OpenAI error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
