import { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service';
import { generateInvoicePDF } from '../../lib/invoice';
import { InvoiceStatus } from '@prisma/client';
import { prisma } from '../../config/database';

export class BillingController {
  public async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const patientId = req.query.patientId ? String(req.query.patientId) : undefined;
      const status = req.query.status ? String(req.query.status) as InvoiceStatus : undefined;

      const data = await billingService.listInvoices(clinicId, { patientId, status });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;
      const data = await billingService.getInvoiceById(clinicId, id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async generateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const createdById = req.user!.userId;
      
      const data = await billingService.generateInvoice(clinicId, createdById, req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;

      const data = await billingService.updateInvoice(clinicId, id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async issueInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;

      const data = await billingService.issueInvoice(clinicId, id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const recordedById = req.user!.userId;
      const { id } = req.params;

      const data = await billingService.recordPayment(clinicId, id, recordedById, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  public async downloadInvoicePDF(req: Request, res: Response, next: NextFunction) {
    try {
      const clinicId = req.user!.clinicId;
      const { id } = req.params;

      const invoice = await billingService.getInvoiceById(clinicId, id);

      // Hydrate clinic details (e.g. from database)
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });

      const hydratedInvoice = {
        ...invoice,
        clinic: clinic || {
          name: 'Ayurveda Wellness Center',
          email: 'contact@demo-clinic.com',
          phone: '+91 98765 43210',
          gstNumber: '27AAAAA1111A1Z1'
        }
      };

      // Set headers for inline streaming or download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`);

      generateInvoicePDF(hydratedInvoice, res);
    } catch (error) {
      next(error);
    }
  }
}

export const billingController = new BillingController();
