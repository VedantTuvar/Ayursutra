import { Request, Response, NextFunction } from 'express';
import { patientsService } from './patients.service';

export class PatientsController {
  public async listPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const search = req.query.q ? String(req.query.q) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      const result = await patientsService.listPatients(clinicId, search, limit, cursor);
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  }

  public async registerPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await patientsService.registerPatient(clinicId, req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await patientsService.getPatientById(clinicId, req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async updatePatient(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await patientsService.updatePatient(clinicId, req.params.id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async saveAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await patientsService.saveAssessment(clinicId, req.params.id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getPatientTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await patientsService.getPatientTimeline(clinicId, req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getActivePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const data = await patientsService.getActivePlan(clinicId, req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const patientsController = new PatientsController();
