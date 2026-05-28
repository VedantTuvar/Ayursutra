import { prisma } from '../../config/database';
import { SessionStatus, InvoiceStatus } from '@prisma/client';

export class AnalyticsService {
  /**
   * Fetch clinical KPI summaries (Total Patients, Today's Queue, Monthly Revenue, low stocks)
   */
  public async getOverview(clinicId: string, fromDate: Date, toDate: Date) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Total active patients in clinic
    const totalPatients = await prisma.patient.count({
      where: { clinicId }
    });

    // 2. Today's sessions count
    const sessionsToday = await prisma.session.count({
      where: {
        clinicId,
        scheduledStart: { gte: todayStart, lte: todayEnd },
        status: { not: SessionStatus.CANCELLED }
      }
    });

    // 3. Monthly Revenue (Total paid or issued invoices)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const invoiceSums = await prisma.invoice.aggregate({
      where: {
        clinicId,
        issueDate: { gte: startOfMonth },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.ISSUED] }
      },
      _sum: {
        totalAmount: true
      }
    });
    const monthlyRevenue = Number(invoiceSums._sum.totalAmount) || 0;

    // 4. Low stock count
    const inventoryAlerts = await prisma.inventoryItem.count({
      where: {
        clinicId,
        isActive: true,
        currentStock: {
          lt: prisma.inventoryItem.fields.minimumThreshold
        }
      }
    });

    return {
      totalPatients,
      sessionsToday,
      monthlyRevenue,
      inventoryAlerts
    };
  }

  /**
   * Aggregate revenue reports grouped by dates
   */
  public async getRevenueTrend(clinicId: string, fromDate: Date, toDate: Date, groupBy = 'day') {
    const invoices = await prisma.invoice.findMany({
      where: {
        clinicId,
        issueDate: { gte: fromDate, lte: toDate },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.ISSUED] }
      },
      select: {
        issueDate: true,
        totalAmount: true
      },
      orderBy: { issueDate: 'asc' }
    });

    // Group values in memory for simplicity and database agnostic compatibility
    const groups: { [key: string]: number } = {};

    invoices.forEach((inv) => {
      const date = new Date(inv.issueDate);
      let key = date.toISOString().slice(0, 10); // Default daily: YYYY-MM-DD

      if (groupBy === 'week') {
        // Simple week number
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      groups[key] = (groups[key] || 0) + Number(inv.totalAmount);
    });

    return Object.keys(groups).map((key) => ({
      label: key,
      value: groups[key]
    }));
  }

  /**
   * Fetch frequency of therapy usage (Popularity)
   */
  public async getTherapyBreakdown(clinicId: string, fromDate: Date, toDate: Date) {
    const sessions = await prisma.session.findMany({
      where: {
        clinicId,
        scheduledStart: { gte: fromDate, lte: toDate },
        status: SessionStatus.COMPLETED,
        plannedTherapyId: { not: null }
      },
      include: {
        plannedTherapy: {
          include: { therapyType: true }
        }
      }
    });

    const breakdown: { [key: string]: number } = {};
    sessions.forEach((s) => {
      const name = s.plannedTherapy?.therapyType.name || 'Custom Therapy';
      breakdown[name] = (breakdown[name] || 0) + 1;
    });

    return Object.keys(breakdown).map((name) => ({
      therapy: name,
      count: breakdown[name]
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Fetch therapist scheduling utilization indicators
   */
  public async getTherapistUtilization(clinicId: string, fromDate: Date, toDate: Date) {
    const sessions = await prisma.session.findMany({
      where: {
        clinicId,
        scheduledStart: { gte: fromDate, lte: toDate },
        status: SessionStatus.COMPLETED,
        therapistId: { not: null }
      },
      include: {
        therapist: { select: { name: true } }
      }
    });

    const breakdown: { [key: string]: number } = {};
    sessions.forEach((s) => {
      const name = s.therapist?.name || 'Unknown Therapist';
      breakdown[name] = (breakdown[name] || 0) + 1;
    });

    return Object.keys(breakdown).map((name) => ({
      therapist: name,
      sessionsCount: breakdown[name]
    }));
  }

  /**
   * Fetch patient counts registered within or before date intervals
   */
  public async getPatientStats(clinicId: string, fromDate: Date, toDate: Date) {
    // New patients registered in range
    const newPatients = await prisma.patient.count({
      where: {
        clinicId,
        createdAt: { gte: fromDate, lte: toDate }
      }
    });

    // Returning patients registered before range
    const totalPatients = await prisma.patient.count({
      where: { clinicId }
    });

    const returningPatients = Math.max(0, totalPatients - newPatients);

    return {
      newPatients,
      returningPatients
    };
  }

  /**
   * Fetch top inventory items consumed
   */
  public async getInventoryUsage(clinicId: string, fromDate: Date, toDate: Date) {
    const txs = await prisma.inventoryTransaction.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        type: 'CONSUMED',
        item: { clinicId }
      },
      include: {
        item: true
      }
    });

    const consumption: { [key: string]: { name: string; quantity: number; unit: string } } = {};
    txs.forEach((t) => {
      const itemId = t.itemId;
      if (!consumption[itemId]) {
        consumption[itemId] = {
          name: t.item.name,
          quantity: 0,
          unit: t.item.unit
        };
      }
      consumption[itemId].quantity += Number(t.quantity);
    });

    return Object.values(consumption).sort((a, b) => b.quantity - a.quantity);
  }
}

export const analyticsService = new AnalyticsService();
