import { prisma } from '../../config/database';
import { schedulingRepository } from './scheduling.repository';
import { BookSessionInput, RescheduleSessionInput } from './scheduling.schema';
import { ConflictError, NotFoundError } from '../../lib/errors';
import { SessionStatus } from '@prisma/client';
import { emitToClinic } from '../../sockets/scheduling.socket';

export class SchedulingService {
  /**
   * Conflict Detection Engine: Checks overlaps for Patients, Therapists and Rooms
   */
  public async checkConflicts(
    clinicId: string,
    therapistId: string | null,
    roomId: string | null,
    patientId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    excludeSessionId?: string
  ): Promise<{ hasConflict: boolean; conflictMessage: string | null }> {
    
    // Core overlap check criteria: start < proposedEnd AND end > proposedStart
    const overlapCondition = {
      status: { in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS, SessionStatus.RESCHEDULED] },
      scheduledStart: { lt: scheduledEnd },
      scheduledEnd: { gt: scheduledStart },
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {})
    };

    // 1. Patient Conflict check
    const patientConflict = await prisma.session.findFirst({
      where: {
        clinicId,
        patientId,
        ...overlapCondition
      },
      include: {
        patient: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    if (patientConflict) {
      return {
        hasConflict: true,
        conflictMessage: `Patient ${patientConflict.patient.user.name} is already scheduled for another session during this time slot.`
      };
    }

    // 2. Therapist Conflict check
    if (therapistId) {
      const therapistConflict = await prisma.session.findFirst({
        where: {
          clinicId,
          therapistId,
          ...overlapCondition
        },
        include: {
          therapist: { select: { name: true } }
        }
      });

      if (therapistConflict) {
        return {
          hasConflict: true,
          conflictMessage: `Therapist ${therapistConflict.therapist?.name} is already allocated to another session during this time slot.`
        };
      }
    }

    // 3. Room Conflict check
    if (roomId) {
      const roomConflict = await prisma.session.findFirst({
        where: {
          clinicId,
          roomId,
          ...overlapCondition
        },
        include: {
          room: true
        }
      });

      if (roomConflict) {
        return {
          hasConflict: true,
          conflictMessage: `Therapy room / table ${roomConflict.room?.name} is already occupied during this time slot.`
        };
      }
    }

    return { hasConflict: false, conflictMessage: null };
  }

  /**
   * List sessions based on calendar date filters
   */
  public async listSessions(clinicId: string, filters: any) {
    return schedulingRepository.findSessions(clinicId, filters);
  }

  /**
   * Book a new therapy session
   */
  public async bookSession(clinicId: string, input: BookSessionInput) {
    const { hasConflict, conflictMessage } = await this.checkConflicts(
      clinicId,
      input.therapistId || null,
      input.roomId || null,
      input.patientId,
      input.scheduledStart,
      input.scheduledEnd
    );

    if (hasConflict) {
      throw new ConflictError(conflictMessage || 'Overlapping appointment conflicts detected');
    }

    const session = await schedulingRepository.createSession(clinicId, input);

    // Broadcast session booked event
    emitToClinic(clinicId, 'session:booked', { session });

    return session;
  }

  /**
   * Reschedule an existing session
   */
  public async rescheduleSession(clinicId: string, id: string, input: RescheduleSessionInput) {
    const session = await schedulingRepository.findById(clinicId, id);
    if (!session) {
      throw new NotFoundError('Session booking was not found');
    }

    const therapistId = input.therapistId !== undefined ? input.therapistId : session.therapistId;
    const roomId = input.roomId !== undefined ? input.roomId : session.roomId;

    const { hasConflict, conflictMessage } = await this.checkConflicts(
      clinicId,
      therapistId || null,
      roomId || null,
      session.patientId,
      input.scheduledStart,
      input.scheduledEnd,
      id
    );

    if (hasConflict) {
      throw new ConflictError(conflictMessage || 'Rescheduling overlap conflicts detected');
    }

    const updatedSession = await schedulingRepository.updateSession(clinicId, id, {
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      therapistId,
      roomId,
      notes: input.notes !== undefined ? input.notes : session.notes,
      status: SessionStatus.RESCHEDULED
    });

    // Broadcast session updated event
    emitToClinic(clinicId, 'session:updated', { session: updatedSession });

    return updatedSession;
  }

  /**
   * Cancel an appointment session
   */
  public async cancelSession(clinicId: string, id: string, cancellationReason?: string) {
    const session = await schedulingRepository.findById(clinicId, id);
    if (!session) {
      throw new NotFoundError('Session booking was not found');
    }

    const updatedSession = await schedulingRepository.updateSession(clinicId, id, {
      status: SessionStatus.CANCELLED,
      cancellationReason: cancellationReason || 'Cancelled by staff'
    });

    // Broadcast session cancelled event
    emitToClinic(clinicId, 'session:cancelled', { sessionId: id });

    return updatedSession;
  }
}

export const schedulingService = new SchedulingService();
