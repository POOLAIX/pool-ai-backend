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
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  const cleanPrompt = `A modern backyard with landscaping and a pool. ${prompt}`
    .replace(/flush|spa|infinity|sunken|luxury|hot tub|fire|sunbed/gi, "")
    .replace(/[^a-zA-Z0-9 ,]/g, "")
    .slice(0, 150);

  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: cleanPrompt,
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
