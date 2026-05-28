import { Request, Response, NextFunction } from 'express';
import { therapyTypesService } from './therapy-types.service';

export class TherapyTypesController {
  public async listTherapyTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await therapyTypesService.listTherapyTypes(clinicId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async createTherapyType(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await therapyTypesService.createTherapyType(clinicId, req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async updateTherapyType(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await therapyTypesService.updateTherapyType(clinicId, req.params.id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const therapyTypesController = new TherapyTypesController();
