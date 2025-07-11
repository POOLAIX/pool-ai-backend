const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/generate", async (req, res) => {
  try {
    const { image_base64, prompt } = req.body;

    // Strip base64 header and write to temp file
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const tempPath = path.join(__dirname, "temp.png");
    fs.writeFileSync(tempPath, buffer);

    // Call OpenAI's DALL·E 3 Inpainting (Note: only available in v4+ endpoints or API beta)
    const response = await openai.createImageEdit(
      fs.createReadStream(tempPath),
      null, // No mask
      prompt,
      1,
      "1024x1024"
    );

    fs.unlinkSync(tempPath); // clean up temp file
    const imageUrl = response.data.data[0].url;
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
