import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../lib/errors';

export function tenantScope(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.clinicId) {
    return next(new AuthenticationError('Clinic scoping context missing'));
  }

  req.clinicId = req.user.clinicId;
  next();
}
