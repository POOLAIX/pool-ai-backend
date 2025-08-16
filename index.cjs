const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Base64 decoder helper
const decodeBase64Image = (base64String) => {
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image string");
  }
  return Buffer.from(matches[2], 'base64');
};

app.post('/render', async (req, res) => {
  const { imageBase64, prompt, style } = req.body;

  if (!imageBase64 || !prompt || !style) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const mask = decodeBase64Image(imageBase64); // You can skip if not using inpainting

    const response = await openai.images.edit({
      image: mask,
      mask: mask, // use same mask for simplicity
      prompt: `${style} ${prompt}`,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    const imageBase64 = response.data[0].b64_json;

    res.json({
      outputImageBase64: `data:image/jpeg;base64,${imageBase64}`
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
