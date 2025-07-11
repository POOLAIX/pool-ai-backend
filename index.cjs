const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");

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

    // Save base64 image to temp file
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const tempPath = path.join(__dirname, "temp.png");
    fs.writeFileSync(tempPath, buffer);

    // Send to OpenAI DALL·E 3 inpainting (no mask)
    const response = await openai.createImageEdit(
      fs.createReadStream(tempPath),
      null,
      prompt,
      1,
      "1024x1024"
    );

    fs.unlinkSync(tempPath); // cleanup
    const imageUrl = response.data.data[0].url;
    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

