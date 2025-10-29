const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url'); 

const DICT_PATH = path.join(__dirname, 'diccionario.txt');
const WORDS = fs.readFileSync(DICT_PATH, 'utf8').split(/\r?\n/).filter(Boolean);

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://' + req.headers.host);
  let x = parseInt(url.searchParams.get('x') || '4', 10); // por defecto "4"
  if (!Number.isFinite(x) || x < 1) x = 4;                // validación básica

  // Generar X palabras aleatorias
  const pass = Array.from({ length: x }, () =>
    WORDS[Math.floor(Math.random() * WORDS.length)]
  ).join('-');

  // HTML con título
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Contraseña generada</title></head>
<body>
  <h1>Contraseña generada:</h1>
  <p style="font-size:1.5rem;font-weight:700;">${pass}</p>
</body></html>`);
}).listen(3000, () => {
  console.log('http://localhost:3000  (usa /?x=6 para 6 palabras)');
});
