import { prisma } from '../../config/database';
import { CreatePlanInput, UpdatePlanInput } from './plans.schema';
import { PlanStatus } from '@prisma/client';

export class PlansRepository {
  /**
   * Find plans for a specific patient
   */
  public async findMany(clinicId: string, patientId: string) {
    return prisma.treatmentPlan.findMany({
      where: { clinicId, patientId },
      include: {
        doctor: { select: { id: true, name: true } },
        plannedTherapies: {
          include: { therapyType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find specific plan by ID
   */
  public async findById(clinicId: string, patientId: string, id: string) {
    return prisma.treatmentPlan.findFirst({
      where: { id, clinicId, patientId },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { include: { user: { select: { name: true } } } },
        plannedTherapies: {
          orderBy: [{ dayNumber: 'asc' }, { sequenceOrder: 'asc' }],
          include: { therapyType: true }
        },
        sessions: {
          orderBy: { scheduledStart: 'asc' },
          include: {
            therapist: { select: { id: true, name: true } },
            room: true,
            plannedTherapy: { include: { therapyType: true } }
          }
        }
      }
    });
  }

  /**
   * Create plan with day-by-day planned therapies in a transaction
   */
  public async create(clinicId: string, patientId: string, doctorId: string, input: CreatePlanInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Create plan parent
      const plan = await tx.treatmentPlan.create({
        data: {
          clinicId,
          patientId,
          doctorId,
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          status: PlanStatus.DRAFT,
          dietInstructions: input.dietInstructions,
          lifestyleNotes: input.lifestyleNotes,
          totalDays: input.totalDays
        }
      });

      // 2. Bulk insert child planned therapies
      if (input.plannedTherapies && input.plannedTherapies.length > 0) {
        await tx.plannedTherapy.createMany({
          data: input.plannedTherapies.map((pt) => ({
            planId: plan.id,
            therapyTypeId: pt.therapyTypeId,
            dayNumber: pt.dayNumber,
            sequenceOrder: pt.sequenceOrder,
            durationMins: pt.durationMins,
            prescribedOils: pt.prescribedOils ? JSON.stringify(pt.prescribedOils) : undefined,
            notes: pt.notes
          }))
        });
      }

      return tx.treatmentPlan.findUnique({
        where: { id: plan.id },
        include: {
          plannedTherapies: true
        }
      });
    });
  }

  /**
   * Update plan in a transaction
   */
  public async update(clinicId: string, id: string, input: UpdatePlanInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Update plan metrics
      const plan = await tx.treatmentPlan.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
          dietInstructions: input.dietInstructions,
          lifestyleNotes: input.lifestyleNotes,
          totalDays: input.totalDays
        }
      });

      // 2. If new therapies provided, delete old ones and insert new ones
      if (input.plannedTherapies) {
        await tx.plannedTherapy.deleteMany({
          where: { planId: id }
        });

        if (input.plannedTherapies.length > 0) {
          await tx.plannedTherapy.createMany({
            data: input.plannedTherapies.map((pt) => ({
              planId: id,
              therapyTypeId: pt.therapyTypeId,
              dayNumber: pt.dayNumber,
              sequenceOrder: pt.sequenceOrder,
              durationMins: pt.durationMins,
              prescribedOils: pt.prescribedOils ? JSON.stringify(pt.prescribedOils) : undefined,
              notes: pt.notes
            }))
          });
        }
      }

      return tx.treatmentPlan.findUnique({
        where: { id },
        include: {
          plannedTherapies: true
        }
      });
    });
  }

  /**
   * Activate plan, moving any existing ACTIVE plan to COMPLETED
   */
  public async activate(clinicId: string, id: string, patientId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Terminate other active plans
      await tx.treatmentPlan.updateMany({
        where: { clinicId, patientId, status: PlanStatus.ACTIVE },
        data: { status: PlanStatus.COMPLETED }
      });

      // 2. Mark this plan active
      return tx.treatmentPlan.update({
        where: { id },
        data: { status: PlanStatus.ACTIVE }
      });
    });
  }
}

export const plansRepository = new PlansRepository();
