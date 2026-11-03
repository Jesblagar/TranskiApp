// Servidor de TranskiApp: sirve la web y hace de intermediario con la API de Claude.
// La clave ANTHROPIC_API_KEY nunca llega al navegador.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || "";   // opcional: protege la app con usuario y contraseña
const ROOT = __dirname;
const MAX_BODY = 12 * 1024 * 1024;
const MAX_PER_MINUTE = Number(process.env.MAX_PER_MINUTE || 30);

const MODELS = {
  complex: process.env.MODEL_ALTA || "claude-opus-5-5",
  default: process.env.MODEL_ESTANDAR || "claude-sonnet-5-5",
  quick: process.env.MODEL_RAPIDA || "claude-haiku-5-5"
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

// Límite sencillo por IP para controlar el gasto
const hits = new Map();
function withinLimit(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length <= MAX_PER_MINUTE;
}

function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function authorized(req) {
  if (!ACCESS_PASSWORD) return true;
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const password = decoded.slice(decoded.indexOf(":") + 1);
  return password === ACCESS_PASSWORD;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", c => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("too large"));
        req.destroy();
      } else {
        chunks.push(c);
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleTranscribe(req, res) {
  if (!API_KEY) return sendJson(res, 500, { error: "Falta ANTHROPIC_API_KEY en el servidor" });
  if (!withinLimit(req.socket.remoteAddress)) return sendJson(res, 429, { error: "Demasiadas peticiones; espera un minuto" });

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (e) {
    return sendJson(res, 400, { error: "Petición no válida" });
  }
  if (!body.prompt || !body.image) return sendJson(res, 400, { error: "Faltan datos (prompt o imagen)" });

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: MODELS[body.tier] || MODELS.default,
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
      return sendJson(res, code, { error: (data.error && data.error.message) || "Error del modelo" });
    }
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    sendJson(res, 200, { text });
  } catch (e) {
    sendJson(res, 502, { error: "No se pudo contactar con el servicio de IA" });
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Prohibido");
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("No encontrado");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (!authorized(req)) {
    res.writeHead(401, { "WWW-Authenticate": 'Basic realm="TranskiApp"', "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Se requiere contraseña");
  }
  if (req.method === "POST" && req.url.split("?")[0] === "/api/transcribe") {
    return handleTranscribe(req, res);
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end();
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log("TranskiApp en http://localhost:" + PORT);
  if (!API_KEY) console.log("Aviso: falta ANTHROPIC_API_KEY; la transcripción no funcionará.");
});
