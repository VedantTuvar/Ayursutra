import { Request, Response, NextFunction } from 'express';
import { sessionsService } from './sessions.service';

export class SessionsController {
  public async getTherapistSessionsToday(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const therapistId = req.user!.userId;
      const data = await sessionsService.getTherapistSessionsToday(clinicId, therapistId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getSessionById(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const data = await sessionsService.getSessionById(clinicId, id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const data = await sessionsService.startSession(clinicId, id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async recordNotesAndComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const recordedById = req.user!.userId;
      const { id } = req.params;

      const data = await sessionsService.recordNotesAndComplete(
        clinicId,
        id,
        recordedById,
        req.body
      );

      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const sessionsController = new SessionsController();
