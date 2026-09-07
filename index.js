import http from 'http';
import https from 'https';

const TARGET = process.env.PROXY_TARGET || 'http://localhost:3000';
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const url = new URL(TARGET);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: url.hostname },
  };

  const client = url.protocol === 'https:' ? https : http;
  const proxy = client.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxy.on('error', () => {
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxy);
});

server.listen(PORT, () => {
  console.log(`Proxy -> ${TARGET} on :${PORT}`);

  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
      https.get(process.env.RENDER_EXTERNAL_URL + '/health', () => {}).on('error', () => {});
    }, 5 * 60 * 1000);
  }
});
