// Función serverless de Netlify: transcribe páginas con Gemini (nivel gratuito).
// - Solo usuarios con sesión iniciada.
// - Límite diario por usuario (DAILY_PAGE_LIMIT, 10 por defecto).
// - Tamaño máximo de imagen.
const { getStore } = require("@netlify/blobs");

const DAILY_LIMIT = Number(process.env.DAILY_PAGE_LIMIT || 10);
const MAX_IMAGE_CHARS = 5 * 1024 * 1024 * 4 / 3; // ~5 MB de imagen en base64

const json = (code, obj) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(obj)
});

const today = () => new Date().toISOString().slice(0, 10);

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

  const user = context.clientContext && context.clientContext.user;
  if (!user) return json(401, { error: "Inicia sesión para transcribir" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(500, { error: "Falta GEMINI_API_KEY en la configuración de Netlify" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "Petición no válida" });
  }
  if (!body.prompt || !body.image) return json(400, { error: "Faltan datos (prompt o imagen)" });
  if (String(body.image).length > MAX_IMAGE_CHARS) {
    return json(413, { error: "La imagen es demasiado grande. Reduce el tamaño de la página (máximo 5 MB)." });
  }

  // Contador de páginas del usuario para hoy
  const store = getStore("transkiapp-uso");
  const key = user.sub + "_" + today();
  const usage = (await store.get(key, { type: "json" })) || { count: 0 };
  if (usage.count >= DAILY_LIMIT) {
    return json(429, {
      error: "Has alcanzado tu límite de " + DAILY_LIMIT + " páginas por hoy. Vuelve a intentarlo mañana."
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: body.mediaType || "image/jpeg", data: body.image } },
            { text: body.prompt }
          ]
        }],
        generationConfig: { maxOutputTokens: 8000, temperature: 0 }
      })
    });
    const data = await upstream.json().catch(() => ({}));

    if (upstream.status === 429) {
      return json(429, {
        error: "Capacidad gratuita diaria temporalmente alcanzada. Vuelve a intentarlo en unos minutos o mañana."
      });
    }
    if (!upstream.ok) {
      const code = upstream.status === 400 || upstream.status === 403 ? 401 : 502;
      return json(code, { error: (data.error && data.error.message) || "Error del modelo" });
    }

    // Solo se cuenta la página si la transcripción ha funcionado
    await store.setJSON(key, { count: usage.count + 1 });

    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    return json(200, { text: parts.map(p => p.text || "").join("\n") });
  } catch (e) {
    return json(502, { error: "No se pudo contactar con el servicio de IA" });
  }
};
