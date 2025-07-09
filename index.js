import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" })); // Support large image payloads

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  const { prompt, email, image } = req.body;

  if (!prompt || !email) {
    return res.status(400).json({ error: "Prompt and email required" });
  }

  const cleanedPrompt = `Backyard with ${prompt}`
    .replace(/[^a-zA-Z0-9 ,]/g, "")
    .slice(0, 150);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: cleanedPrompt,
      n: 1,
      size: "1024x1024",
      ...(image && {
        response_format: "url",
        image, // base64 string from iOS
        mask: null,
      }),
    });

    const imageUrl = response.data[0]?.url;

    return res.status(200).json({ imageUrl, limitReached: false });
  } catch (err) {
    console.error("OpenAI error:", err.response?.data || err.message || err);
    return res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Pool AI backend is live on port ${port}`);
});
