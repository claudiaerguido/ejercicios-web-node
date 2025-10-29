// Ejercicio 4: Web scraping (Wikipedia) con Node puro
// - Descarga periódicamente el HTML de una página de Wikipedia
// - Extrae <title>
// - Guarda último HTML + JSON
// - Servidor con rutas: "/", "/json", "/raw"

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// >>> CONFIGURACIÓN (puedes cambiar a cualquier artículo de Wikipedia) <<<
const TARGET = 'https://es.wikipedia.org/wiki/Portada'; // página de Wikipedia
const PERIOD_MS = 10 * 60 * 1000;                             // 10 min (prudente)
const PORT = process.env.PORT || 3000;

// Carpeta/archivos de salida
const OUT_DIR = path.join(__dirname, 'data');
const LAST_HTML = path.join(OUT_DIR, 'last.html');
const LAST_JSON = path.join(OUT_DIR, 'last.json');

// Estado en memoria
let lastHTML = '';
let lastData = { url: TARGET, fetchedAt: null, title: null, notes: 'title extraído con regex (Wikipedia)' };

// Asegurar carpeta
fs.mkdirSync(OUT_DIR, { recursive: true });

// --- Utilidades -------------------------------------------------------------

function fetchHTML(urlStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;

    const req = lib.get(u, {
      headers: {
        'User-Agent': 'Ej4-Scraper/1.0 (docente; ejercicio académico)',
        'Accept-Language': 'es' // preferimos HTML en español
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // seguir redirección simple
        return resolve(fetchHTML(new URL(res.headers.location, u).toString()));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (chunks += c));
      res.on('end', () => resolve(chunks));
    });

    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Timeout')));
  });
}

function extractTitle(html) {
  // Saca el <title> del HTML de Wikipedia (sirve para páginas estáticas)
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

function saveSnapshot(html, data) {
  fs.writeFileSync(LAST_HTML, html, 'utf8');
  fs.writeFileSync(LAST_JSON, JSON.stringify(data, null, 2), 'utf8');
}

// --- Tarea periódica --------------------------------------------------------

async function runScrapeOnce() {
  try {
    const html = await fetchHTML(TARGET);
    const title = extractTitle(html);

    lastHTML = html;
    lastData = {
      url: TARGET,
      fetchedAt: new Date().toISOString(),
      title,
      notes: 'title extraído con regex (Wikipedia)'
    };

    saveSnapshot(lastHTML, lastData);
    console.log(`[OK] ${lastData.fetchedAt} — title="${title}"`);
  } catch (err) {
    console.error('[ERROR]', err.message);
  }
}

runScrapeOnce();
setInterval(runScrapeOnce, PERIOD_MS);

// --- Servidor ---------------------------------------------------------------

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://' + req.headers.host);

  if (u.pathname === '/json') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(lastData, null, 2));
  }

  if (u.pathname === '/raw') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(lastHTML || '<!-- aún no hay HTML descargado -->');
  }

  // Página sencilla
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ejercicio 4 – Web scraping (Wikipedia)</title>
  <style>
    body { font-family: system-ui, Arial; padding: 24px; max-width: 760px; margin: 0 auto; }
    h1 { margin-bottom: 0; }
    .muted { color: #666; font-size: 0.95rem; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</head>
<body>
  <h1>Ejercicio 4 – Web scraping (Wikipedia)</h1>
  <p class="muted">Objetivo: descargar HTML de <code>${TARGET}</code> periódicamente y extraer el <code>&lt;title&gt;</code>.</p>

  <h2>Último dato extraído</h2>
  <ul>
    <li><b>URL:</b> <code>${lastData.url}</code></li>
    <li><b>Fecha:</b> <code>${lastData.fetchedAt || '—'}</code></li>
    <li><b>Title:</b> <code>${lastData.title || '—'}</code></li>
  </ul>

  <h3>Endpoints</h3>
  <ul>
    <li><a href="/json">/json</a> — datos en JSON</li>
    <li><a href="/raw">/raw</a> — último HTML crudo</li>
  </ul>
</body>
</html>`);
}).listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}  |  Objetivo: ${TARGET}`);
  console.log('Rutas: /  /json  /raw');
});
