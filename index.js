import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "15mb" }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate", async (req, res) => {
  const { prompt, email } = req.body;
  if (!prompt || !email) {
    return res.status(400).json({ error: "Missing prompt or email" });
  }

  const cleanPrompt = `A ${prompt} backyard with luxury pool and landscaping, photo-realistic, drone view, sunny day`;

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
  console.log(`Server running on port ${port}`);
});
