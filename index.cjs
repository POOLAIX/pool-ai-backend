const express = require('express');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
require('dotenv').config();

// ✅ Create uploads folder if missing
fs.mkdirSync('uploads', { recursive: true });

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'input.png'); // overwrite each time
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'image/png') {
      return cb(new Error('Only PNG files are allowed!'));
    }
    cb(null, true);
  }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const inputPath = 'uploads/input.png';
    const resizedPath = 'uploads/resized.png';

    // Resize to 1024x1024 for DALL·E
    await sharp(inputPath)
      .resize(1024, 1024)
      .toFile(resizedPath);

    const fileStream = fs.createReadStream(resizedPath);

    const result = await openai.images.edit({
      image: fileStream,
      mask: fileStream, // For now using same image
      prompt: req.body.prompt || 'modern backyard with pool',
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });

    const imageUrl = result.data.data[0].url;
    res.json({ url: imageUrl });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Pool Lux AI backend is running.');
});

app.listen(port, () => {
  console.log(`✅ Pool Lux AI backend running on port ${port}`);
});
