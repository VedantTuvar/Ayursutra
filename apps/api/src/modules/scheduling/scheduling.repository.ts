import { prisma } from '../../config/database';
import { BookSessionInput } from './scheduling.schema';
import { SessionStatus } from '@prisma/client';

export class SchedulingRepository {
  /**
   * Fetch sessions based on clinic filters and date views
   */
  public async findSessions(
    clinicId: string,
    filters: {
      date?: Date;
      view?: 'day' | 'week';
      therapistId?: string;
      roomId?: string;
      status?: SessionStatus;
    }
  ) {
    const where: any = { clinicId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.therapistId) {
      where.therapistId = filters.therapistId;
    }

    if (filters.roomId) {
      where.roomId = filters.roomId;
    }

    if (filters.date) {
      const view = filters.view || 'day';
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(filters.date);
      if (view === 'day') {
        end.setHours(23, 59, 59, 999);
      } else {
        // Week view: next 7 days
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);
      }

      where.scheduledStart = {
        gte: start,
        lte: end
      };
    }

    return prisma.session.findMany({
      where,
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, phone: true } }
          }
        },
        therapist: {
          select: { id: true, name: true }
        },
        room: true,
        plannedTherapy: {
          include: { therapyType: true }
        }
      },
      orderBy: { scheduledStart: 'asc' }
    });
  }

  /**
   * Find specific session details
   */
  public async findById(clinicId: string, id: string) {
    return prisma.session.findFirst({
      where: { id, clinicId },
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, phone: true } }
          }
        },
        therapist: {
          select: { id: true, name: true }
        },
        room: true,
        plannedTherapy: {
          include: { therapyType: true }
        },
        sessionNote: true
      }
    });
  }

  /**
   * Book a new session
   */
  public async createSession(clinicId: string, input: BookSessionInput) {
    return prisma.session.create({
      data: {
        clinicId,
        patientId: input.patientId,
        plannedTherapyId: input.plannedTherapyId,
        treatmentPlanId: input.treatmentPlanId,
        therapistId: input.therapistId,
        roomId: input.roomId,
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        status: SessionStatus.SCHEDULED,
        notes: input.notes
      },
      include: {
        patient: {
          include: {
            user: { select: { name: true } }
          }
        },
        therapist: { select: { name: true } },
        room: true
      }
    });
  }

  /**
   * Update session record
   */
  public async updateSession(clinicId: string, id: string, data: any) {
    return prisma.session.update({
      where: { id },
      data,
      include: {
        patient: {
          include: {
            user: { select: { name: true } }
          }
        },
        therapist: { select: { name: true } },
        room: true
      }
    });
  }
}

export const schedulingRepository = new SchedulingRepository();
