import { prisma } from '../../config/database';
import { SessionNotesInput } from './sessions.schema';
import { SessionStatus } from '@prisma/client';

export class SessionsRepository {
  /**
   * Find therapist sessions scheduled for today
   */
  public async findTherapistSessionsToday(clinicId: string, therapistId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.session.findMany({
      where: {
        clinicId,
        therapistId,
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, phone: true } }
          }
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
   * Update session status and record actual timestamps
   */
  public async updateStatus(clinicId: string, id: string, status: SessionStatus) {
    const isStart = status === SessionStatus.IN_PROGRESS;
    const isComplete = status === SessionStatus.COMPLETED;

    return prisma.session.update({
      where: { id },
      data: {
        status,
        ...(isStart ? { actualStart: new Date() } : {}),
        ...(isComplete ? { actualEnd: new Date() } : {})
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
   * Record vital registers and treatment response details
   */
  public async createSessionNote(
    clinicId: string,
    sessionId: string,
    recordedById: string,
    input: SessionNotesInput
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create or update session notes
      const note = await tx.sessionNote.upsert({
        where: { sessionId },
        update: {
          recordedById,
          oilsUsed: input.oilsUsed,
          patientResponse: input.patientResponse,
          observations: input.observations,
          followUpInstructions: input.followUpInstructions,
          vitals: input.vitals || undefined
        },
        create: {
          sessionId,
          recordedById,
          oilsUsed: input.oilsUsed,
          patientResponse: input.patientResponse,
          observations: input.observations,
          followUpInstructions: input.followUpInstructions,
          vitals: input.vitals || undefined
        }
      });

      // 2. Mark session completed and record actualEnd
      const session = await tx.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          actualEnd: new Date()
        },
        include: {
          patient: {
            include: { user: { select: { name: true } } }
          },
          therapist: { select: { name: true } },
          room: true
        }
      });

      return { note, session };
    });
  }

  /**
   * Retrieve session by ID
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
        therapist: { select: { id: true, name: true } },
        room: true,
        plannedTherapy: {
          include: {
            therapyType: true
          }
        },
        sessionNote: true
      }
    });
  }
}

export const sessionsRepository = new SessionsRepository();
