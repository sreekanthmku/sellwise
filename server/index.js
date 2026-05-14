import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { loadConfig } from './config/index.js';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, () => {
    console.log(`
-------------------------------------------------------
  API listening on port ${config.port}
-------------------------------------------------------
  1. Expose this server (e.g. ngrok): ngrok http ${config.port}

  2. Configure server/.env (copy from server/.env.example). Set PUBLIC_BASE_URL
     to your https origin (no trailing slash) for Record/callback URLs.

  3. Vobiz Answer URL: POST to / (root) — same as before.

  4. POST /recording-callback — metadata + optional download to ./recordings/

  5. POST /transcription-callback — appends to transcripts.json

  6. GET or HEAD /audio — sample.mp3

  7. GET /health — liveness JSON

  8. GET /api/call-analysis/:callUuid — poll call-analysis/<id>.json (3s) until found

  9. POST /api/ulai/outbound-call — proxy to Ulai outbound (body: { phone_number })

 10. POST /ai-call-ended — Ulai webhook (logs request; fetches call details → ai-call/)

 11. GET /api/recent-calls — Ulai calls for Performance “Recent calls”

 12. POST /api/speech/transcribe — Guide mic: WAV body (16 kHz mono), query ?language=en-US (Azure STT)
-------------------------------------------------------
`);
});
