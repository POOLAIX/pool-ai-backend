const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/generate', upload.single('image'), async (req, res) => {
  try {
    const prompt = req.body.prompt || 'modern backyard with pool';
    const id = uuidv4();
    const fileName = `${id}.png`;
    const tempPath = path.join(__dirname, fileName);

    // Resize image and save as PNG
    await sharp(req.file.buffer)
      .resize({ width: 1024 })
      .toFormat('png')
      .toFile(tempPath);

    const response = await openai.images.edit({
      image: fs.createReadStream(tempPath),
      mask: fs.createReadStream(tempPath),
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    fs.unlinkSync(tempPath); // clean temp file
    const imageUrl = response.data[0].url;
    res.json({ image: imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Pool AI backend running on port ${port}`);
});
