// index.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const COHERE_API_KEY = process.env.COHERE_API_KEY;

if (!COHERE_API_KEY) {
  console.error("❌ Cohere API key is missing. Set COHERE_API_KEY in your .env file.");
  process.exit(1);
}

app.post("/getDiseaseDetails", async (req, res) => {
  const { disease } = req.body;

  if (!disease) {
    return res.status(400).json({ error: "Disease name is required." });
  }

  try {
    const prompt = `Suggest common medicines and related symptoms for the disease: ${disease}. Provide output in JSON format with "symptoms" and "medicines".`;

    const response = await axios.post(
      "https://api.cohere.ai/v1/generate",
      {
        model: "command",
        prompt,
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedText = response.data.generations[0].text;
    const match = generatedText.match(/\{[\s\S]*\}/);
    const jsonData = match ? JSON.parse(match[0]) : { message: generatedText };

    res.status(200).json(jsonData);
  } catch (error) {
    console.error("Cohere API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch data from Cohere API" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
