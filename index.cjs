// index.cjs

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");

const app = express();

app.use(cors());

// ✅ Increase payload size limit for large base64 images
app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '25mb' }));

// ✅ Load environment variable (or hardcode your key here if testing)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// ✅ Simple GET route for health check
app.get("/", (req, res) => {
  res.send("✅ Pool AI backend is live.");
});

// ✅ AI Render route
app.post("/generate", async (req, res) => {
  try {
    const { image_base64, prompt } = req.body;

    if (!image_base64 || !prompt) {
      return res.status(400).json({ error: "Missing image or prompt" });
    }

    // ✅ Decode base64 image
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // ✅ Resize image to 1024x1024 using sharp
    const resizedBuffer = await sharp(buffer)
      .resize(1024, 1024, { fit: "cover" })
      .png()
      .toBuffer();

    // ✅ Save temp image
    const tempPath = path.join(__dirname, "input.png");
    fs.writeFileSync(tempPath, resizedBuffer);

    // ✅ Upload to OpenAI
    const response = await openai.createImageEdit(
      fs.createReadStream(tempPath),
      prompt,
      fs.createReadStream(tempPath), // mask = same image, optional if no masking
      1,
      "1024x1024"
    );

    // ✅ Cleanup
    fs.unlinkSync(tempPath);

    const image_url = response?.data?.data[0]?.url;
    if (!image_url) {
      return res.status(500).json({ error: "No image returned from OpenAI" });
    }

    return res.json({ image_url });

  } catch (error) {
    console.error("❌ OpenAI Error:", error.response?.data || error.message);
    res.status(500).json({ error: "OpenAI failed", detail: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Pool AI backend running on port ${PORT}`);
});
