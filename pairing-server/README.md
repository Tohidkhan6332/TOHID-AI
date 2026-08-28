# TOHID-AI Pairing Server

A small Node.js service that exposes a browser UI for generating a Baileys WhatsApp pairing code or QR code.

## Run

```bash
cd pairing-server
npm install
npm start
```

Open `http://localhost:3000`.

## Production notes

- Run this service on a persistent Node.js host/VPS, not a serverless function.
- Put it behind HTTPS and a reverse proxy.
- Set a strong authentication layer before exposing `/api/session`, `/api/pairing`, and `/api/session/:id` publicly.
- Keep the `sessions/` directory private and persistent.
- Do not commit generated session credentials to Git.
