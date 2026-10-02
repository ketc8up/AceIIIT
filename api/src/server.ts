// Validate configuration before anything else: the server refuses to start
// with a missing or insecure JWT_SECRET / INTERNAL_API_SECRET.
import './config';
import app from './app';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PORT = process.env.PORT || 3000;

const certDir = path.join(__dirname, '../../.certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating self-signed certificate for local development...');
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost"`);
}

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS Server securely listening on port ${PORT}`);
});
