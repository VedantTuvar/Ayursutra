import { Response, NextFunction, Request } from 'express';
import { ForbiddenError, AuthenticationError } from '../lib/errors';
import { UserRole } from '@prisma/client';

export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('User details missing in routing context'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not possess the required permissions to perform this action'));
    }

    next();
  };
}
