const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const FormData = require("form-data");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Pool AI backend is running.");
});

app.post("/generate", async (req, res) => {
  try {
    const { image_base64, prompt } = req.body;
    if (!image_base64 || !prompt) {
      return res.status(400).json({ error: "Missing image or prompt." });
    }

    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const tempPath = path.join(__dirname, "temp.png");

    // ✅ Resize and convert to PNG
    await sharp(buffer)
      .resize({ width: 1024, height: 1024, fit: "inside" })
      .png()
      .toFile(tempPath);

    const form = new FormData();
    form.append("image", fs.createReadStream(tempPath), {
      filename: "temp.png",
      contentType: "image/png"
    });
    form.append("prompt", prompt);
    form.append("n", "1");
    form.append("size", "1024x1024");
    form.append("response_format", "url");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
    });

    const result = await response.json();
    fs.unlinkSync(tempPath); // 🧼 Clean up temp file

    if (result?.data?.[0]?.url) {
      res.json({ image_url: result.data[0].url });
    } else {
      console.error("❌ OpenAI error:", result);
      res.status(500).json({ error: "OpenAI failed to generate image." });
    }
  } catch (err) {
    console.error("❌ Backend error:", err.message);
    res.status(500).json({ error: err.message || "Unknown error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Pool AI backend running on port ${PORT}`);
});
