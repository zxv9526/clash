import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Proxy fetch endpoint for fetching remote node configs
  app.get('/api/proxy-fetch', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
      const parsedUrl = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Invalid URL protocol' });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ClashForWindows/0.20.39 mihomo ClashMeta Wget/1.21',
          'Accept': '*/*',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `HTTP ${response.status}: ${response.statusText}`,
        });
      }

      const text = await response.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(text);
    } catch (err: any) {
      return res.status(500).json({
        error: err.name === 'AbortError' ? 'Request timed out after 12s' : err.message || 'Failed to fetch URL',
      });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
