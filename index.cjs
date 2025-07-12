const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, 'input.png')
});
const upload = multer({ storage });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/generate', upload.single('image'), async (req, res) => {
  const prompt = req.body.prompt;
  const imagePath = path.join(__dirname, 'uploads', 'input.png');

  try {
    const result = await openai.images.edit({
      image: fs.createReadStream(imagePath),
      mask: fs.createReadStream(imagePath), // full replace
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });

    const base64 = result.data[0].b64_json;
    const imgBuffer = Buffer.from(base64, 'base64');
    res.set('Content-Type', 'image/png');
    res.send(imgBuffer);
  } catch (err) {
    console.error('Error generating image:', err);
    res.status(500).send({ error: 'Image generation failed' });
  }
});

app.listen(port, () => {
  console.log(`✅ Pool AI backend running on port ${port}`);
});
