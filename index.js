import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  const prompt = "A modern backyard with a swimming pool, palm trees, and a wooden deck";

  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });

    const imageUrl = response.data[0].url;
    res.status(200).json({ imageUrl });
  } catch (err) {
    console.error("OpenAI error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
