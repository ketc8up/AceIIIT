import express, { Router } from 'express';
import path from 'path';

/**
 * Explicit allowlist of public frontend files.
 *
 * The frontend still lives at the repository root and calls the API with relative
 * `/api/...` URLs, so Express keeps serving it from the same origin. Only the pages
 * and asset folders listed here are reachable; everything else under the repo root
 * (.env, api/, prisma/, private_uploads/, .certs/, scripts, docs) is never served.
 */
const FRONTEND_ROOT = path.resolve(__dirname, '../..');

const PUBLIC_PAGES = [
  'index',
  'about',
  'checkout',
  'contact',
  'dashboard',
  'privacy',
  'refund',
  'terms',
  'analytics'
];

const PUBLIC_DIRS = ['css', 'js', 'assets'];

const PUBLIC_FILES = ['saas/logo.js'];

const staticOptions = { dotfiles: 'deny' as const, index: false, redirect: false };

const router = Router();

for (const page of PUBLIC_PAGES) {
  const file = path.join(FRONTEND_ROOT, `${page}.html`);
  const routes = page === 'index' ? ['/', '/index', '/index.html'] : [`/${page}`, `/${page}.html`];
  router.get(routes, (req, res) => res.sendFile(file));
}

for (const dir of PUBLIC_DIRS) {
  router.use(`/${dir}`, express.static(path.join(FRONTEND_ROOT, dir), staticOptions));
}

for (const file of PUBLIC_FILES) {
  const fullPath = path.join(FRONTEND_ROOT, file);
  router.get(`/${file}`, (req, res) => res.sendFile(fullPath));
}

// Obscured Admin Portal path
import { config } from './config';
const adminFile = path.join(FRONTEND_ROOT, 'admin.html');
router.get(`/${config.ADMIN_PORTAL_PATH}`, (req, res) => res.sendFile(adminFile));

export default router;
