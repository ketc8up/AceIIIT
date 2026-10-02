import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

export type TokenScope = 'guest' | 'admin';

export interface AuthRequest extends Request {
  user?: any;
  auth?: { scope: TokenScope };
}

/**
 * The only place access tokens are issued. Tokens carry the user id and the
 * login scope; the user's role is always re-read from the database.
 */
export const signAccessToken = (userId: string, scope: TokenScope): string =>
  jwt.sign({ userId, scope }, config.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const [kind, token] = (authHeader || '').split(' ');

  if (kind !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let decoded: jwt.JwtPayload;
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string') throw new Error('Unexpected token payload');
    decoded = payload;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Every token must expire and must identify a user and a known scope.
  if (
    typeof decoded.exp !== 'number' ||
    typeof decoded.userId !== 'string' ||
    (decoded.scope !== 'guest' && decoded.scope !== 'admin')
  ) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = user;
    req.auth = { scope: decoded.scope };
    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Admin access requires BOTH the ADMIN role in the database AND a token that was
 * issued by the admin login. A guest token can never reach admin routes.
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN' || req.auth?.scope !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
