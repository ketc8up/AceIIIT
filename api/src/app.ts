import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import publicFiles from './static';

const app = express();

// CSP stays off for now: the existing pages rely on inline scripts and CDN assets.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// The frontend is served from this same origin; cross-origin callers must be allowlisted.
app.use(cors({ origin: config.CORS_ORIGINS.length > 0 ? config.CORS_ORIGINS : false }));
app.use(express.json({ limit: '20mb' }));

const limiterOptions = {
  windowMs: 60 * 1000,
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
};
app.use('/api/auth', rateLimit({ ...limiterOptions, limit: config.AUTH_RATE_LIMIT_PER_MIN }));
app.use('/api/receipts/upload', rateLimit({ ...limiterOptions, limit: 10 }));

app.use('/api', routes);
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Only explicitly allowlisted frontend files are public (see static.ts).
app.use(publicFiles);

app.use((req, res) => {
  res.status(404).send('Not found');
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large' });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
