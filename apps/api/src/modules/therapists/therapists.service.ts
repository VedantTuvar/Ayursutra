import { prisma } from '../../config/database';
import { AddSkillInput } from './therapists.schema';
import { NotFoundError } from '../../lib/errors';
import { UserRole } from '@prisma/client';

export class TherapistsService {
  /**
   * List all therapists inside a clinic, along with their skillsets
   */
  public async listTherapists(clinicId: string) {
    return prisma.user.findMany({
      where: { clinicId, role: UserRole.THERAPIST },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        therapistSkills: {
          include: {
            therapyType: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * List a therapist's daily schedules
   */
  public async getTherapistSchedule(clinicId: string, therapistId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
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
            user: { select: { name: true, phone: true } }
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
   * Query available therapists for a time slot who possess the required Panchakarma skills
   */
  public async getAvailableTherapists(clinicId: string, start: Date, end: Date, therapyTypeId: string) {
    // 1. Fetch all active therapists that have the required therapyType certified skill
    const qualifiedTherapists = await prisma.user.findMany({
      where: {
        clinicId,
        role: UserRole.THERAPIST,
        isActive: true,
        therapistSkills: {
          some: { therapyTypeId }
        }
      },
      include: {
        therapistSkills: {
          where: { therapyTypeId },
          include: { therapyType: true }
        }
      }
    });

    // 2. Query occupied therapists during that specific time frame
    const occupiedSessions = await prisma.session.findMany({
      where: {
        clinicId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS', 'RESCHEDULED'] },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
        therapistId: { not: null }
      },
      select: { therapistId: true }
    });

    const occupiedIds = occupiedSessions
      .map((s) => s.therapistId)
      .filter((id): id is string => id !== null);

    // 3. Exclude occupied therapists
    return qualifiedTherapists.filter((t) => !occupiedIds.includes(t.id));
  }

  /**
   * Link a certified skill/proficiency to a therapist
   */
  public async addSkill(clinicId: string, therapistId: string, input: AddSkillInput) {
    // Confirm therapist exists in clinic
    const therapist = await prisma.user.findFirst({
      where: { id: therapistId, clinicId, role: UserRole.THERAPIST }
    });
    if (!therapist) {
      throw new NotFoundError('Therapist was not found in this clinic');
    }

    return prisma.therapistSkill.upsert({
      where: {
        therapistId_therapyTypeId: {
          therapistId,
          therapyTypeId: input.therapyTypeId
        }
      },
      update: {
        proficiencyLevel: input.proficiencyLevel
      },
      create: {
        therapistId,
        therapyTypeId: input.therapyTypeId,
        proficiencyLevel: input.proficiencyLevel
      },
      include: {
        therapyType: true
      }
    });
  }

  /**
   * Unlink skill from therapist
   */
  public async removeSkill(clinicId: string, therapistId: string, therapyTypeId: string) {
    const therapist = await prisma.user.findFirst({
      where: { id: therapistId, clinicId, role: UserRole.THERAPIST }
    });
    if (!therapist) {
      throw new NotFoundError('Therapist was not found in this clinic');
    }

    return prisma.therapistSkill.delete({
      where: {
        therapistId_therapyTypeId: {
          therapistId,
          therapyTypeId
        }
      }
    });
  }
}

export const therapistsService = new TherapistsService();
