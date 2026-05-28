import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        clinicId: string;
        role: UserRole;
      };
      clinicId?: string;
    }
  }
}
