import { billingService } from '../../src/modules/billing/billing.service';
import { prisma } from '../../src/config/database';
import { billingRepository } from '../../src/modules/billing/billing.repository';
import { SessionStatus, InvoiceStatus } from '@prisma/client';

// Mock the database client
jest.mock('../../src/config/database', () => ({
  prisma: {
    session: {
      findMany: jest.fn()
    },
    invoice: {
      update: jest.fn()
    }
  }
}));

// Mock the repository
jest.mock('../../src/modules/billing/billing.repository', () => ({
  billingRepository: {
    createInvoice: jest.fn(),
    findById: jest.fn()
  }
}));

describe('Billing Service - GST & Invoice Generation Calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate subtotals, apply 18% GST correctly, and create a draft invoice', async () => {
    const mockUnbilledSessions = [
      {
        id: 'session-1',
        scheduledStart: new Date('2026-05-28T09:00:00Z'),
        plannedTherapy: {
          durationMins: 60, // ₹30 per minute = ₹1800
          therapyType: {
            name: 'Abhyanga Massage'
          }
        }
      },
      {
        id: 'session-2',
        scheduledStart: new Date('2026-05-28T14:00:00Z'),
        plannedTherapy: {
          durationMins: 90, // ₹30 per minute = ₹2700
          therapyType: {
            name: 'Shirodhara Oils Flow'
          }
        }
      }
    ];

    (prisma.session.findMany as jest.Mock).mockResolvedValueOnce(mockUnbilledSessions);

    // Total subtotal: ₹1800 + ₹2700 = ₹4500
    // Discount: ₹500
    // Taxable amount: ₹4000
    // GST (18% of ₹4000): ₹720
    // Gross Total: ₹4720

    const mockCreateResult = { id: 'inv-123', totalAmount: 4720 };
    (billingRepository.createInvoice as jest.Mock).mockResolvedValueOnce(mockCreateResult);

    const result = await billingService.generateInvoice('clinic-123', 'admin-123', {
      patientId: 'patient-abc',
      startDate: new Date('2026-05-01T00:00:00Z'),
      endDate: new Date('2026-05-31T23:59:59Z'),
      discountAmount: 500
    });

    expect(prisma.session.findMany).toHaveBeenCalledTimes(1);
    expect(billingRepository.createInvoice).toHaveBeenCalledWith(
      'clinic-123',
      'admin-123',
      'patient-abc',
      expect.stringMatching(/^INV-\d{8}-[A-Z0-9]{4}$/),
      4500, // subtotal
      500, // discount
      18, // GST rate
      720, // GST amount
      4720, // totalAmount
      InvoiceStatus.DRAFT,
      expect.any(Array)
    );
    expect(result).toEqual(mockCreateResult);
  });

  it('should adjust calculations correctly when discount is greater than subtotal', async () => {
    const mockUnbilledSessions = [
      {
        id: 'session-1',
        scheduledStart: new Date('2026-05-28T09:00:00Z'),
        plannedTherapy: {
          durationMins: 30, // ₹30 per minute = ₹900
          therapyType: {
            name: 'Kadi Vasthi'
          }
        }
      }
    ];

    (prisma.session.findMany as jest.Mock).mockResolvedValueOnce(mockUnbilledSessions);

    // Subtotal: ₹900
    // Discount: ₹1000
    // Taxable amount: max(0, 900 - 1000) = ₹0
    // GST (18% of ₹0): ₹0
    // Gross Total: ₹0

    (billingRepository.createInvoice as jest.Mock).mockResolvedValueOnce({ id: 'inv-free' });

    await billingService.generateInvoice('clinic-123', 'admin-123', {
      patientId: 'patient-abc',
      startDate: new Date('2026-05-01T00:00:00Z'),
      endDate: new Date('2026-05-31T23:59:59Z'),
      discountAmount: 1000
    });

    expect(billingRepository.createInvoice).toHaveBeenCalledWith(
      'clinic-123',
      'admin-123',
      'patient-abc',
      expect.any(String),
      900, // subtotal
      1000, // discount
      18,
      0, // GST amount
      0, // totalAmount
      InvoiceStatus.DRAFT,
      expect.any(Array)
    );
  });
});
