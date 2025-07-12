const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Set up Multer storage (in-memory to avoid file system errors)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint
app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const prompt = req.body.prompt || 'modern luxury backyard with pool and spa';
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Save to temporary file as required by OpenAI API
    const tempFilePath = path.join(__dirname, 'input.png');
    fs.writeFileSync(tempFilePath, imageBuffer);

    const response = await openai.images.edit({
      image: fs.createReadStream(tempFilePath),
      mask: fs.createReadStream(tempFilePath), // Optional: reuse image as mask if needed
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    fs.unlinkSync(tempFilePath); // Clean up temp file

    res.json({ url: response.data[0].url });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// Default
app.get('/', (req, res) => {
  res.send('Pool Lux AI backend is running');
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
