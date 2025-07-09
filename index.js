import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" })); // Accepts large base64 images

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  const { prompt, email, image } = req.body;

  if (!prompt || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const cleanPrompt = `Ultra realistic ${prompt}`
    .replace(/flush|spa|infinity|sunken|luxury|hot tub|fire|sunbed/gi, "")
    .replace(/[^a-zA-Z0-9 ,]/g, "")
    .slice(0, 200);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: cleanPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });

    const imageUrl = response.data[0].url;
    res.status(200).json({ imageUrl });
  } catch (err) {
    console.error("OpenAI error:", err.response?.data || err.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
