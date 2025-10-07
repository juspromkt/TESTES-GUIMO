import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
const sseClients = new Set();

setInterval(() => {
  sseClients.forEach((client) => {
    client.res.write(':\n\n');
  });
}, 30000);

// Mapeia cada conexão ao token para envio direcionado
wss.on('connection', (socket, req) => {
  const params = new URLSearchParams(req.url.split('?')[1]);
  socket.token = params.get('token');
});

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const params = new URLSearchParams(req.url.split('?')[1]);
  const token = params.get('token');

  const client = { res, token };
  sseClients.add(client);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

app.post('/broadcast', (req, res) => {
  const { token, ...payload } = req.body || {};
  const data = JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (
      client.readyState === client.OPEN &&
      (!token || client.token === token)
    ) {
      client.send(data);
    }
  });

  sseClients.forEach((client) => {
    if (!token || client.token === token) {
      client.res.write(`data: ${data}\n\n`);
    }
  });

  res.json({ ok: true });
});

server.listen(PORT, () => {
});