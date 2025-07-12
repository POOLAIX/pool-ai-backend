const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const OpenAI = require("openai");
const FormData = require("form-data");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  try {
    const { image_base64, prompt } = req.body;

    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const tempPath = path.join(__dirname, "temp.png");

    await sharp(buffer).png().toFile(tempPath);

    // ✅ Use form-data to ensure MIME is set
    const form = new FormData();
    form.append("image", fs.createReadStream(tempPath), {
      filename: "temp.png",
      contentType: "image/png"
    });
    form.append("prompt", prompt);
    form.append("n", "1");
    form.append("size", "1024x1024");
    form.append("response_format", "url");

    const response = await openai.fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    const result = await response.json();
    fs.unlinkSync(tempPath);

    if (result?.data?.[0]?.url) {
      res.json({ image_url: result.data[0].url });
    } else {
      console.error("❌ OpenAI returned:", result);
      res.status(500).json({ error: "OpenAI failed to generate image." });
    }

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Backend running on port ${port}`);
});
