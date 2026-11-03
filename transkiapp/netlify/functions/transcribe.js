// Función serverless de Netlify: solo usuarios con sesión iniciada pueden transcribir.
// La clave ANTHROPIC_API_KEY se configura en el panel de Netlify (Site configuration → Environment variables).

const json = (code, obj) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(obj)
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

  // Netlify Identity valida el token y deja el usuario en context.clientContext
  const user = context.clientContext && context.clientContext.user;
  if (!user) return json(401, { error: "Inicia sesión para transcribir" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: "Falta ANTHROPIC_API_KEY en la configuración de Netlify" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "Petición no válida" });
  }
  if (!body.prompt || !body.image) return json(400, { error: "Faltan datos (prompt o imagen)" });

  const models = {
    complex: process.env.MODEL_ALTA || "claude-opus-5-5",
    default: process.env.MODEL_ESTANDAR || "claude-sonnet-5-5",
    quick: process.env.MODEL_RAPIDA || "claude-haiku-5-5"
  };

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: models[body.tier] || models.default,
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: body.mediaType || "image/jpeg", data: body.image } },
            { type: "text", text: body.prompt }
          ]
        }]
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const code = upstream.status === 401 || upstream.status === 429 ? upstream.status : 502;
      return json(code, { error: (data.error && data.error.message) || "Error del modelo" });
    }
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    return json(200, { text });
  } catch (e) {
    return json(502, { error: "No se pudo contactar con el servicio de IA" });
  }
};
