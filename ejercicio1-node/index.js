const os = require('os');
const http = require('http');
const fs = require('fs');

// ===== Servidor HTTP =====
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<h1>Servidor de información del sistema</h1>');
});

// ===== Información al iniciar =====
console.log('=== Información del sistema ===');
console.log('Versión de Node.js:', process.version);
console.log('Sistema operativo:', os.type());
console.log('Versión del SO:', os.release());
console.log('Arquitectura:', os.arch());
console.log('Usuario:', os.userInfo().username);
console.log('Memoria total (MB):', (os.totalmem() / 1024 / 1024).toFixed(2));
console.log('Memoria libre (MB):', (os.freemem() / 1024 / 1024).toFixed(2));
console.log('=================================');

// ===== Iniciar servidor =====
server.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});

// ===== Leer configuración (config.json) =====
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const intervalo = config.intervaloSegundos * 1000;

console.log('Mostrando estadísticas del sistema cada ' + config.intervaloSegundos + ' segundos:');

// ===== Estadísticas periódicas =====
setInterval(() => {
  const cpuInfo = os.loadavg(); // promedio de carga (en mac/linux)
  const memoriaLibre = (os.freemem() / os.totalmem() * 100).toFixed(2);
  const tiempoSistema = (os.uptime() / 60).toFixed(2); // minutos
  const tiempoNode = process.uptime().toFixed(2); // segundos

  console.log('=== Estadísticas del sistema ===');
  console.log('Uso CPU (load average): ' + cpuInfo.map(n => n.toFixed(2)).join(' '));
  console.log('Memoria libre: ' + memoriaLibre + '%');
  console.log('Tiempo sistema activo: ' + tiempoSistema + ' min');
  console.log('Tiempo Node.js activo: ' + tiempoNode + ' seg');
  console.log('=================================\n');
}, intervalo);
