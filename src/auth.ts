import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';

// Valida el mismo JWT que emite shelfsync-api (mismo JWT_SECRET), asi la app
// manda el token que ya tiene y nadie de afuera del tunel puede imprimir.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ message: 'Falta el token' });
    return;
  }
  try {
    jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalido o vencido' });
  }
}
