import { prisma } from '../../config/database';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export class BillingRepository {
  /**
   * List invoices with patient filters
   */
  public async findInvoices(clinicId: string, filters: { patientId?: string; status?: InvoiceStatus }) {
    const where: any = { clinicId };

    if (filters.patientId) {
      where.patientId = filters.patientId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    return prisma.invoice.findMany({
      where,
      include: {
        patient: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        },
        createdBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find specific invoice detailed file
   */
  public async findById(clinicId: string, id: string) {
    return prisma.invoice.findFirst({
      where: { id, clinicId },
      include: {
        patient: {
          include: {
            user: { select: { name: true, phone: true, email: true } }
          }
        },
        createdBy: { select: { name: true } },
        lineItems: true,
        payments: {
          orderBy: { paidAt: 'desc' },
          include: {
            recordedBy: { select: { name: true } }
          }
        }
      }
    });
  }

  /**
   * Create an invoice parent record with line items in a transaction
   */
  public async createInvoice(
    clinicId: string,
    createdById: string,
    patientId: string,
    invoiceNumber: string,
    subtotal: number,
    discountAmount: number,
    gstRate: number,
    gstAmount: number,
    totalAmount: number,
    status: InvoiceStatus,
    lineItems: Array<{ sessionId?: string; description: string; quantity: number; unitPrice: number; total: number }>
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create parent invoice record
      const invoice = await tx.invoice.create({
        data: {
          clinicId,
          patientId,
          invoiceNumber,
          subtotal,
          discountAmount,
          gstRate,
          gstAmount,
          totalAmount,
          status,
          createdById
        }
      });

      // 2. Create child line item records
      await tx.invoiceLineItem.createMany({
        data: lineItems.map((item) => ({
          invoiceId: invoice.id,
          sessionId: item.sessionId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }))
      });

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          lineItems: true
        }
      });
    });
  }

  /**
   * Record a payment and update the parent invoice status
   */
  public async recordPayment(
    clinicId: string,
    invoiceId: string,
    recordedById: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    notes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Log payment receipt
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          method,
          reference,
          notes,
          recordedById
        }
      });

      // 2. Count total payments registered against this invoice
      const payments = await tx.payment.findMany({
        where: { invoiceId }
      });
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // 3. Fetch invoice values
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId }
      });
      if (!invoice) {
        throw new Error('Billing invoice was not found');
      }

      const totalDue = Number(invoice.totalAmount);
      let status: InvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
      if (totalPaid >= totalDue) {
        status = InvoiceStatus.PAID;
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status }
      });

      return { payment, invoice: updatedInvoice };
    });
  }
}

export const billingRepository = new BillingRepository();
