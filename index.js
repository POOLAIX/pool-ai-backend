import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // support base64 images

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  const { prompt, email, image } = req.body;

  if (!prompt || !email) {
    return res.status(400).json({ error: "Missing prompt or email" });
  }

  const cleanPrompt = `${prompt}`
    .replace(/flush|spa|infinity|sunken|luxury|hot tub|fire|sunbed/gi, "")
    .replace(/[^a-zA-Z0-9 ,]/g, "")
    .slice(0, 250);

  try {
    let response;

    if (image) {
      // Inpainting mode (overlay design onto existing yard photo)
      response = await openai.images.edit({
        image: image,
        prompt: cleanPrompt,
        model: "dall-e-3",
        n: 1,
        size: "1024x1024"
      });
    } else {
      // Generate from prompt only
      response = await openai.images.generate({
        prompt: cleanPrompt,
        model: "dall-e-3",
        n: 1,
        size: "1024x1024"
      });
    }

    const imageUrl = response.data[0]?.url || null;
    if (!imageUrl) {
      throw new Error("No image URL returned");
    }

    res.status(200).json({ imageUrl, limitReached: false });

  } catch (err) {
    console.error("OpenAI error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Pool AI server is running on port ${port}`);
});
