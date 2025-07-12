const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
require("dotenv").config();

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Serve static folder
app.use("/outputs", express.static(path.join(__dirname, "outputs")));
if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");

// Route to generate overlay image
app.post("/generate", async (req, res) => {
    try {
        const { image, prompt } = req.body;

        if (!image || !prompt) {
            return res.status(400).json({ error: "Missing image or prompt" });
        }

        // Decode base64 image
        const imageBuffer = Buffer.from(image, "base64");
        const inputFile = `outputs/input-${uuidv4()}.png`;
        const maskFile = `outputs/mask-${uuidv4()}.png`;
        const outputFile = `outputs/output-${uuidv4()}.png`;

        // Save original uploaded image
        await fs.promises.writeFile(inputFile, imageBuffer);

        // Create mask: full white image (same size)
        const { width, height } = await sharp(imageBuffer).metadata();
        const maskBuffer = await sharp({
            create: {
                width: width || 1024,
                height: height || 768,
                channels: 1,
                background: "white"
            }
        }).png().toBuffer();

        await fs.promises.writeFile(maskFile, maskBuffer);

        // Call OpenAI inpainting endpoint
        const response = await openai.images.edit({
            image: fs.createReadStream(inputFile),
            mask: fs.createReadStream(maskFile),
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "url"
        });

        const imageUrl = response.data[0].url;

        res.json({ imageUrl });
    } catch (err) {
        console.error("❌ Error in /generate:", err);
        res.status(500).json({ error: "Image generation failed", detail: err.message });
    }
});

// Health check
app.get("/", (req, res) => {
    res.send("✅ Pool Lux AI backend is running.");
});

app.listen(port, () => {
    console.log(`✅ Pool AI backend running on port ${port}`);
});
