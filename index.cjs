const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Set up multer to save image temporarily
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const response = await openai.images.edit({
      image: imageBuffer,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    const imageBase64 = response.data[0].b64_json;
    const imageBufferDecoded = Buffer.from(imageBase64, 'base64');

    res.set('Content-Type', 'image/png');
    res.send(imageBufferDecoded);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
