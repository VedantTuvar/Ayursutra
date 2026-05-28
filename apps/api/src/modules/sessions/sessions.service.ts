import { sessionsRepository } from './sessions.repository';
import { SessionNotesInput } from './sessions.schema';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import { SessionStatus, TransactionType } from '@prisma/client';
import { prisma } from '../../config/database';
import { emitToClinic } from '../../sockets/scheduling.socket';

export class SessionsService {
  /**
   * List today's sessions for the logged-in therapist
   */
  public async getTherapistSessionsToday(clinicId: string, therapistId: string) {
    return sessionsRepository.findTherapistSessionsToday(clinicId, therapistId);
  }

  /**
   * Mark a scheduled session as IN_PROGRESS
   */
  public async startSession(clinicId: string, id: string) {
    const session = await sessionsRepository.findById(clinicId, id);
    if (!session) {
      throw new NotFoundError('Session booking was not found');
    }

    if (session.status !== SessionStatus.SCHEDULED && session.status !== SessionStatus.RESCHEDULED) {
      throw new BadRequestError(`Cannot start a session that is already in '${session.status}' state`);
    }

    const updatedSession = await sessionsRepository.updateStatus(clinicId, id, SessionStatus.IN_PROGRESS);

    // Broadcast session:updated
    emitToClinic(clinicId, 'session:updated', { session: updatedSession });

    return updatedSession;
  }

  /**
   * Complete a session and register therapist clinical notes
   */
  public async recordNotesAndComplete(
    clinicId: string,
    id: string,
    recordedById: string,
    input: SessionNotesInput
  ) {
    const session = await sessionsRepository.findById(clinicId, id);
    if (!session) {
      throw new NotFoundError('Session booking was not found');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestError('Session is already recorded as completed');
    }

    // Single atomic transactional block
    const result = await prisma.$transaction(async (tx) => {
      // 1. Log session notes
      const note = await tx.sessionNote.upsert({
        where: { sessionId: id },
        update: {
          recordedById,
          oilsUsed: input.oilsUsed,
          patientResponse: input.patientResponse,
          observations: input.observations,
          followUpInstructions: input.followUpInstructions,
          vitals: input.vitals || undefined
        },
        create: {
          sessionId: id,
          recordedById,
          oilsUsed: input.oilsUsed,
          patientResponse: input.patientResponse,
          observations: input.observations,
          followUpInstructions: input.followUpInstructions,
          vitals: input.vitals || undefined
        }
      });

      // 2. Decrement inventory stock of oils used & log transaction
      for (const oil of input.oilsUsed) {
        const invItem = await tx.inventoryItem.findFirst({
          where: { clinicId, name: { equals: oil.name, mode: 'insensitive' } }
        });

        if (invItem) {
          const updatedItem = await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { currentStock: { decrement: oil.quantityMl } }
          });

          await tx.inventoryTransaction.create({
            data: {
              itemId: invItem.id,
              type: TransactionType.CONSUMED,
              quantity: oil.quantityMl,
              sessionId: id,
              recordedById,
              notes: `Consumed ${oil.quantityMl}${updatedItem.unit} in session for ${session.patient.user.name}`
            }
          });

          // Check low stock levels
          if (Number(updatedItem.currentStock) < Number(updatedItem.minimumThreshold)) {
            emitToClinic(clinicId, 'inventory:low', { item: updatedItem });
          }
        }
      }

      // 3. Mark session COMPLETED
      const completedSession = await tx.session.update({
        where: { id },
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

      return { note, session: completedSession };
    });

    // Broadcast session:completed
    emitToClinic(clinicId, 'session:completed', { session: result.session });

    return result;
  }

  /**
   * Retrieve session detail
   */
  public async getSessionById(clinicId: string, id: string) {
    const session = await sessionsRepository.findById(clinicId, id);
    if (!session) {
      throw new NotFoundError('Session booking was not found');
    }
    return session;
  }
}

export const sessionsService = new SessionsService();
