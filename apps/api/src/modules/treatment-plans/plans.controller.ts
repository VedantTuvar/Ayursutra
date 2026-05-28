import { Request, Response, NextFunction } from 'express';
import { plansService } from './plans.service';

export class PlansController {
  public async listPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { patientId } = req.params;
      const data = await plansService.listPlans(clinicId, patientId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getPlanById(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { patientId, id } = req.params;
      const data = await plansService.getPlanById(clinicId, patientId, id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const doctorId = req.user!.userId;
      const { patientId } = req.params;

      const data = await plansService.createPlan(clinicId, patientId, doctorId, req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { patientId, id } = req.params;

      const data = await plansService.updatePlan(clinicId, patientId, id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async activatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { patientId, id } = req.params;

      const data = await plansService.activatePlan(clinicId, patientId, id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const plansController = new PlansController();
