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
    const prompt = `
You are a medical assistant. Suggest 3 commonly prescribed medicines and key symptoms for the disease "${disease}" (in India). 
Provide the response strictly in this JSON format:

{
  "symptoms": [ "symptom1", "symptom2", "symptom3" ],
  "medicines": [
    { "name": "Medicine Name 1", "dosage": "Dosage instructions" },
    { "name": "Medicine Name 2", "dosage": "Dosage instructions" },
    { "name": "Medicine Name 3", "dosage": "Dosage instructions" }
  ]
}
Do not include any explanation or text outside this JSON object.
`;

    const response = await axios.post(
      "https://api.cohere.ai/v1/generate",
      {
        model: "command",
        prompt,
        max_tokens: 300,
        temperature: 0.4,
        stop_sequences: ["\n\n"]
      },
      {
        headers: {
          Authorization: `Bearer ${COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedText = response.data.generations[0].text.trim();
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
