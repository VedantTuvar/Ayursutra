import { prisma } from '../config/database';
import { mailer } from '../lib/mailer';
import { logger } from '../lib/logger';
import { emitToClinic } from '../sockets/scheduling.socket';
import { SessionStatus } from '@prisma/client';

/**
 * Sweeps all sessions scheduled for tomorrow and sends email reminders
 */
export async function sendAppointmentReminders(): Promise<void> {
  logger.info('Executing daily clinical appointment reminder job...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  try {
    const sessions = await prisma.session.findMany({
      where: {
        status: SessionStatus.SCHEDULED,
        scheduledStart: {
          gte: tomorrow,
          lte: tomorrowEnd
        }
      },
      include: {
        patient: {
          include: { user: { select: { name: true, email: true } } }
        },
        plannedTherapy: {
          include: { therapyType: true }
        }
      }
    });

    logger.info(`Found ${sessions.length} sessions tomorrow to dispatch reminders for.`);

    for (const session of sessions) {
      const email = session.patient.user.email;
      if (email) {
        const therapyName = session.plannedTherapy?.therapyType.name || 'Panchakarma Therapy';
        const timeStr = new Date(session.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const subject = `Appointment Reminder: ${therapyName} Tomorrow`;
        const body = `Dear ${session.patient.user.name},\n\nThis is a friendly reminder that your ${therapyName} therapy is scheduled for tomorrow at ${timeStr}.\n\nPlease arrive 10 minutes prior to your scheduled time.\n\nWarm regards,\nAyurSutra Wellness Team`;

        await mailer.sendMail(email, subject, body);
      }
    }
  } catch (err) {
    logger.error('Dispatch daily reminders check failed:', err);
  }
}

/**
 * Sweeps sessions that have passed their scheduledEnd time by more than 1 hour, auto-marking them as NO_SHOW
 */
export async function checkMissedSessions(): Promise<void> {
  logger.info('Executing hourly clinical missed session sweep...');

  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  try {
    const missedSessions = await prisma.session.findMany({
      where: {
        status: SessionStatus.SCHEDULED,
        scheduledEnd: {
          lt: oneHourAgo
        }
      }
    });

    logger.info(`Found ${missedSessions.length} missed sessions to audit.`);

    for (const session of missedSessions) {
      const updated = await prisma.session.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.NO_SHOW,
          notes: session.notes 
            ? `${session.notes}\n[System Update: Marked as NO_SHOW due to missed schedule deadline]`
            : '[System Update: Marked as NO_SHOW due to missed schedule deadline]'
        },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          therapist: { select: { name: true } },
          room: true
        }
      });

      // Broadcast session cancelled/updated to clinic displays
      emitToClinic(session.clinicId, 'session:updated', { session: updated });
      logger.info(`Session ID ${session.id} marked as NO_SHOW (missed deadline).`);
    }
  } catch (err) {
    logger.error('Missed sessions hourly check failed:', err);
  }
}
