import { Response, NextFunction, Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticationError } from '../lib/errors';
import { UserRole } from '@prisma/client';

export interface DecodedToken {
  userId: string;
  clinicId: string;
  role: UserRole;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('Token not found in authorization header');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedToken;
    req.user = {
      userId: decoded.userId,
      clinicId: decoded.clinicId,
      role: decoded.role,
    };
    req.clinicId = decoded.clinicId;

    next();
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError('Access token has expired', { expired: true }));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AuthenticationError('Invalid signature or access token'));
    }
    next(error);
  }
}
