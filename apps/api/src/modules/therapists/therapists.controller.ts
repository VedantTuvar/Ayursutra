import { Request, Response, NextFunction } from 'express';
import { therapistsService } from './therapists.service';
import { BadRequestError } from '../../lib/errors';

export class TherapistsController {
  public async listTherapists(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await therapistsService.listTherapists(clinicId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getTherapistSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const { date } = req.query;

      const scheduleDate = date ? new Date(String(date)) : new Date();
      if (isNaN(scheduleDate.getTime())) {
        throw new BadRequestError('Invalid query date string supplied');
      }

      const data = await therapistsService.getTherapistSchedule(clinicId, id, scheduleDate);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getAvailableTherapists(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { start, end, therapyTypeId } = req.query;

      if (!start || !end || !therapyTypeId) {
        throw new BadRequestError('Start ISO date, end ISO date, and therapyTypeId are required query fields');
      }

      const startTime = new Date(String(start));
      const endTime = new Date(String(end));

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new BadRequestError('Invalid start or end date timestamps supplied');
      }

      const data = await therapistsService.getAvailableTherapists(
        clinicId,
        startTime,
        endTime,
        String(therapyTypeId)
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async addSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const data = await therapistsService.addSkill(clinicId, id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async removeSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id, therapyTypeId } = req.params;
      const data = await therapistsService.removeSkill(clinicId, id, therapyTypeId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const therapistsController = new TherapistsController();
