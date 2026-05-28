import { Request, Response, NextFunction } from 'express';
import { roomsService } from './rooms.service';
import { BadRequestError } from '../../lib/errors';

export class RoomsController {
  public async listRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await roomsService.listRooms(clinicId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await roomsService.createRoom(clinicId, req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async updateRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await roomsService.updateRoom(clinicId, req.params.id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getAvailableRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { start, end } = req.query;

      if (!start || !end) {
        throw new BadRequestError('Start and end ISO timestamps are required parameters', 'MISSING_TIME_PARAMS');
      }

      const startTime = new Date(String(start));
      const endTime = new Date(String(end));

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new BadRequestError('Invalid start or end date timestamps supplied');
      }

      const data = await roomsService.getAvailableRooms(clinicId, startTime, endTime);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const roomsController = new RoomsController();
