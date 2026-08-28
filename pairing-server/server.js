const express = require('express');
const QRCode = require('qrcode');
const P = require('pino');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
const PORT = Number(process.env.PORT || 3000);
const AUTH_ROOT = path.resolve(process.env.AUTH_ROOT || './sessions');
fs.mkdirSync(AUTH_ROOT, { recursive: true });

const sessions = new Map();

function safeId(id) {
  return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default';
}

async function createSession(id) {
  id = safeId(id);
  if (sessions.has(id)) return sessions.get(id);
  const stateDir = path.join(AUTH_ROOT, id);
  fs.mkdirSync(stateDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(stateDir);
  const s = { id, status: 'starting', pairingCode: null, qr: null, sock: null };
  sessions.set(id, s);
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, logger: P({ level: 'silent' }) });
  s.sock = sock;
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) { s.qr = await QRCode.toDataURL(qr); s.status = 'qr'; }
    if (connection === 'open') { s.status = 'connected'; s.qr = null; s.pairingCode = null; }
    if (connection === 'close') {
      s.status = 'disconnected';
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) { sessions.delete(id); setTimeout(() => createSession(id).catch(()=>{}), 1500); }
    }
  });
  return s;
}

app.get('/health', (_, res) => res.json({ ok: true, service: 'TOHID-AI pairing server' }));

app.post('/api/session', async (req, res) => {
  try {
    const id = safeId(req.body?.sessionId);
    const s = await createSession(id);
    res.json({ sessionId: s.id, status: s.status });
  } catch (e) { res.status(500).json({ error: 'Unable to start session' }); }
});

app.post('/api/pairing', async (req, res) => {
  try {
    const id = safeId(req.body?.sessionId);
    const phone = String(req.body?.phone || '').replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(phone)) return res.status(400).json({ error: 'Enter a valid international phone number.' });
    const s = await createSession(id);
    if (!s.sock.authState?.creds?.registered) {
      const code = await s.sock.requestPairingCode(phone);
      s.pairingCode = code;
      s.status = 'pairing';
    }
    res.json({ sessionId: s.id, status: s.status, pairingCode: s.pairingCode });
  } catch (e) { res.status(500).json({ error: 'Pairing code could not be generated.' }); }
});

app.get('/api/session/:id', (req, res) => {
  const s = sessions.get(safeId(req.params.id));
  if (!s) return res.json({ status: 'not_found' });
  res.json({ sessionId: s.id, status: s.status, pairingCode: s.pairingCode, qr: s.qr });
});

app.delete('/api/session/:id', async (req, res) => {
  const id = safeId(req.params.id);
  const s = sessions.get(id);
  if (s?.sock) try { await s.sock.logout(); } catch (_) {}
  sessions.delete(id);
  fs.rmSync(path.join(AUTH_ROOT, id), { recursive: true, force: true });
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`TOHID-AI pairing server listening on ${PORT}`));
