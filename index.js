import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // prevents payload too large error

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate", async (req, res) => {
  const { prompt, image, email } = req.body;

  if (!prompt || !image || !email) {
    return res.status(400).json({ error: "Missing prompt, image, or email" });
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    const imageUrl = response.data[0].url;

    console.log(`✅ Rendered for ${email}: ${prompt}`);
    res.status(200).json({ imageUrl, limitReached: false });
  } catch (err) {
    console.error("❌ OpenAI Error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Pool AI backend live on port ${port}`);
});


