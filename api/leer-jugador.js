export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en Vercel" });
    }

    const { imageBase64, mimeType, rawText, model = "gemini-3.8-flash" } = req.body || {};

    const prompt = `Extrae los datos del jugador de Hattrick en JSON estricto con estas claves:
id, name, isAcademy, ageYears, ageDays, spec, tsi, porteria, defensa, jugadas, lateral, pases, anotacion, balonParado, resistencia, liderazgo, experiencia, team, country, character.`;

    const parts = [{ text: prompt }];
    if (rawText) parts.push({ text: rawText });
    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: mimeType || "image/png",
          data: imageBase64
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error interno" });
  }
}
