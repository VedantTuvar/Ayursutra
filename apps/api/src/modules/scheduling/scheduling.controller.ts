import { Request, Response, NextFunction } from 'express';
import { schedulingService } from './scheduling.service';
import { BadRequestError } from '../../lib/errors';

export class SchedulingController {
  public async listSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { date, view, therapistId, roomId, status } = req.query;

      const filterDate = date ? new Date(String(date)) : new Date();
      if (isNaN(filterDate.getTime())) {
        throw new BadRequestError('Invalid query filter date string');
      }

      const sessions = await schedulingService.listSessions(clinicId, {
        date: filterDate,
        view: view ? String(view) as 'day' | 'week' : undefined,
        therapistId: therapistId ? String(therapistId) : undefined,
        roomId: roomId ? String(roomId) : undefined,
        status: status ? String(status) as any : undefined
      });

      return res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  }

  public async bookSession(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const session = await schedulingService.bookSession(clinicId, req.body);
      return res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  public async rescheduleSession(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const session = await schedulingService.rescheduleSession(clinicId, id, req.body);
      return res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }

  public async cancelSession(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const { reason } = req.body;
      const session = await schedulingService.cancelSession(clinicId, id, reason);
      return res.status(200).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }
}

export const schedulingController = new SchedulingController();
