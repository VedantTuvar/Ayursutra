import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { BadRequestError } from '../../lib/errors';

export class AnalyticsController {
  private parseDates(req: Request) {
    const { from, to } = req.query;

    const toDate = to ? new Date(String(to)) : new Date();
    const fromDate = from ? new Date(String(from)) : new Date();

    if (!from) {
      // Default to last 30 days
      fromDate.setDate(toDate.getDate() - 30);
    }

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestError('Invalid date range filters supplied');
    }

    return { fromDate, toDate };
  }

  public async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { fromDate, toDate } = this.parseDates(req);

      const data = await analyticsService.getOverview(clinicId, fromDate, toDate);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getRevenueTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { fromDate, toDate } = this.parseDates(req);
      const groupBy = req.query.groupBy ? String(req.query.groupBy) : 'day';

      const data = await analyticsService.getRevenueTrend(clinicId, fromDate, toDate, groupBy);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getTherapyBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { fromDate, toDate } = this.parseDates(req);

      const data = await analyticsService.getTherapyBreakdown(clinicId, fromDate, toDate);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getTherapistUtilization(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { fromDate, toDate } = this.parseDates(req);

      const data = await analyticsService.getTherapistUtilization(clinicId, fromDate, toDate);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getPatientStats(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { fromDate, toDate } = this.parseDates(req);

      const data = await analyticsService.getPatientStats(clinicId, fromDate, toDate);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getInventoryUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { fromDate, toDate } = this.parseDates(req);

      const data = await analyticsService.getInventoryUsage(clinicId, fromDate, toDate);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
