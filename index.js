import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const usageTracker = new Map();

app.post("/generate", async (req, res) => {
  const { prompt, email } = req.body;

  if (!prompt || !email) {
    return res.status(400).json({ error: "Missing prompt or email" });
  }

  const cleanPrompt = `Modern backyard with landscaping and a pool. ${prompt}`
    .replace(/[^a-zA-Z0-9 ,]/g, "")
    .slice(0, 150);

  // Free limit: 2 renders per email
  const count = usageTracker.get(email) || 0;
  if (count >= 2) {
    return res.json({ limitReached: true });
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: cleanPrompt,
      n: 1,
      size: "1024x1024"
    });

    const imageUrl = response.data[0].url;
    usageTracker.set(email, count + 1);

    res.status(200).json({ imageUrl, limitReached: count + 1 >= 2 });
  } catch (err) {
    console.error("OpenAI error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
