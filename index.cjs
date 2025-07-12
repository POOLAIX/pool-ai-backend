const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "a modern luxury backyard design with pool";
    const imageFile = req.file;

    if (!imageFile || imageFile.mimetype !== "image/png") {
      return res.status(400).json({ error: "Image must be PNG format." });
    }

    // Resize image
    const resizedBuffer = await sharp(imageFile.buffer).resize({ width: 1024 }).png().toBuffer();
    const tempFilename = `/tmp/${uuidv4()}.png`;
    fs.writeFileSync(tempFilename, resizedBuffer);

    // Prepare form for OpenAI
    const formData = new FormData();
    formData.append("image", fs.createReadStream(tempFilename), {
      filename: "image.png",
      contentType: "image/png",
    });
    formData.append("prompt", prompt);
    formData.append("n", 1);
    formData.append("size", "1024x1024");
    formData.append("response_format", "url");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    fs.unlinkSync(tempFilename); // Clean up

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.error?.message || "OpenAI API error" });
    }

    res.json({ url: data.data[0].url });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Pool AI backend running on port ${PORT}`);
});
