import { prisma } from '../../config/database';
import { billingRepository } from './billing.repository';
import { GenerateInvoiceInput, UpdateInvoiceInput, RecordPaymentInput } from './billing.schema';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import { InvoiceStatus, SessionStatus } from '@prisma/client';
import * as crypto from 'crypto';

export class BillingService {
  /**
   * List clinic invoices
   */
  public async listInvoices(clinicId: string, filters: any) {
    return billingRepository.findInvoices(clinicId, filters);
  }

  /**
   * Fetch specific invoice detail
   */
  public async getInvoiceById(clinicId: string, id: string) {
    const invoice = await billingRepository.findById(clinicId, id);
    if (!invoice) {
      throw new NotFoundError('Billing invoice was not found');
    }
    return invoice;
  }

  /**
   * Auto-generate an invoice from unbilled completed sessions in a date range
   */
  public async generateInvoice(clinicId: string, createdById: string, input: GenerateInvoiceInput) {
    // 1. Fetch completed and unbilled sessions for the patient in the date range
    const unbilledSessions = await prisma.session.findMany({
      where: {
        clinicId,
        patientId: input.patientId,
        status: SessionStatus.COMPLETED,
        scheduledStart: {
          gte: input.startDate,
          lte: input.endDate
        },
        lineItems: {
          none: {} // Checks that no line items are linked yet
        }
      },
      include: {
        plannedTherapy: {
          include: { therapyType: true }
        }
      }
    });

    if (unbilledSessions.length === 0) {
      throw new BadRequestError('No completed unbilled sessions found in the selected date range');
    }

    // 2. Map and calculate line items (Panchakarma duration-based pricing: ₹30 per minute)
    let subtotal = 0;
    const lineItems = unbilledSessions.map((session) => {
      const therapyName = session.plannedTherapy?.therapyType.name || 'Panchakarma Session';
      const duration = session.plannedTherapy?.durationMins || 60;
      
      // Calculate ₹30 per minute
      const unitPrice = duration * 30;
      const total = unitPrice * 1;
      subtotal += total;

      return {
        sessionId: session.id,
        description: `${therapyName} (${duration} mins) - Session date: ${new Date(session.scheduledStart).toLocaleDateString()}`,
        quantity: 1,
        unitPrice,
        total
      };
    });

    // 3. Compute GST (18%) and total amount
    const gstRate = 18;
    const discountAmount = input.discountAmount;
    
    // Taxable amount is subtotal minus discounts
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
    const totalAmount = taxableAmount + gstAmount;

    // 4. Generate unique invoice serial number: INV-YYYYMMDD-RANDOMHEX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const invoiceNumber = `INV-${dateStr}-${randomHex}`;

    return billingRepository.createInvoice(
      clinicId,
      createdById,
      input.patientId,
      invoiceNumber,
      subtotal,
      discountAmount,
      gstRate,
      gstAmount,
      totalAmount,
      InvoiceStatus.DRAFT,
      lineItems
    );
  }

  /**
   * Update invoice details (draft state only)
   */
  public async updateInvoice(clinicId: string, id: string, input: UpdateInvoiceInput) {
    const invoice = await billingRepository.findById(clinicId, id);
    if (!invoice) {
      throw new NotFoundError('Billing invoice was not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestError('Only invoices in draft status can be modified');
    }

    // Recalculate totals if discount is modified
    let subtotal = Number(invoice.subtotal);
    let discountAmount = input.discountAmount !== undefined ? input.discountAmount : Number(invoice.discountAmount);
    const gstRate = 18;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
    const totalAmount = taxableAmount + gstAmount;

    return prisma.invoice.update({
      where: { id },
      data: {
        discountAmount,
        gstAmount,
        totalAmount,
        notes: input.notes !== undefined ? input.notes : invoice.notes,
        status: input.status !== undefined ? input.status : invoice.status
      }
    });
  }

  /**
   * Transition draft state to ISSUED
   */
  public async issueInvoice(clinicId: string, id: string) {
    const invoice = await billingRepository.findById(clinicId, id);
    if (!invoice) {
      throw new NotFoundError('Billing invoice was not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestError('Only draft invoices can be issued');
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.ISSUED }
    });
  }

  /**
   * Record payment entry against issued invoice
   */
  public async recordPayment(clinicId: string, id: string, recordedById: string, input: RecordPaymentInput) {
    const invoice = await billingRepository.findById(clinicId, id);
    if (!invoice) {
      throw new NotFoundError('Billing invoice was not found');
    }

    if (invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestError('Payments can only be logged against issued or partially paid invoices');
    }

    return billingRepository.recordPayment(
      clinicId,
      id,
      recordedById,
      input.amount,
      input.method,
      input.reference,
      input.notes
    );
  }
}

export const billingService = new BillingService();
