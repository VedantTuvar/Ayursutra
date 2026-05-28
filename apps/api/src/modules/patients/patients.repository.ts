import { prisma } from '../../config/database';
import { UserRole } from '@prisma/client';

export class PatientsRepository {
  /**
   * Search and list patients inside a clinic
   */
  public async findMany(clinicId: string, search?: string, limit = 10, skip = 0) {
    const where: any = {
      clinicId,
      ...(search ? {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      } : {})
    };

    return prisma.patient.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true
          }
        },
        treatmentPlans: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      take: limit + 1, // for hasNextPage cursor calculation
      skip,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Count total patients matching filters
   */
  public async count(clinicId: string, search?: string) {
    const where: any = {
      clinicId,
      ...(search ? {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      } : {})
    };

    return prisma.patient.count({ where });
  }

  /**
   * Find patient by ID, locked to clinic
   */
  public async findById(clinicId: string, id: string) {
    return prisma.patient.findFirst({
      where: { id, clinicId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true
          }
        },
        treatmentPlans: {
          orderBy: { createdAt: 'desc' }
        },
        sessions: {
          orderBy: { scheduledStart: 'desc' },
          include: {
            therapist: { select: { id: true, name: true } },
            room: true,
            plannedTherapy: { include: { therapyType: true } }
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Create Patient inside transaction
   */
  public async create(
    clinicId: string,
    userData: { name: string; email: string; phone?: string; passwordHash: string },
    patientData: {
      dateOfBirth?: Date;
      gender?: string;
      bloodGroup?: string;
      symptoms: string[];
      medicalHistory?: string;
      allergies: string[];
      emergencyContact?: any;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create staff-like user record with PATIENT role
      const user = await tx.user.create({
        data: {
          clinicId,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          passwordHash: userData.passwordHash,
          role: UserRole.PATIENT,
          isActive: true
        }
      });

      // 2. Create patient details record linked to user
      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          clinicId,
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
          bloodGroup: patientData.bloodGroup,
          symptoms: patientData.symptoms,
          medicalHistory: patientData.medicalHistory,
          allergies: patientData.allergies,
          emergencyContact: patientData.emergencyContact
        },
        include: { user: true }
      });

      return patient;
    });
  }

  /**
   * Update Patient inside transaction
   */
  public async update(
    clinicId: string,
    id: string,
    userData: { name?: string; email?: string; phone?: string },
    patientData: {
      dateOfBirth?: Date;
      gender?: string;
      bloodGroup?: string;
      symptoms?: string[];
      medicalHistory?: string;
      allergies?: string[];
      emergencyContact?: any;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findFirst({
        where: { id, clinicId }
      });
      if (!patient) {
        throw new Error('Patient profile was not found');
      }

      await tx.user.update({
        where: { id: patient.userId },
        data: userData
      });

      return tx.patient.update({
        where: { id },
        data: patientData,
        include: { user: true }
      });
    });
  }

  /**
   * Save assessment results
   */
  public async saveAssessment(clinicId: string, id: string, data: { prakriti?: any; vikriti?: any }) {
    return prisma.patient.update({
      where: { id },
      data: {
        ...(data.prakriti ? { prakriti: data.prakriti } : {}),
        ...(data.vikriti ? { vikriti: data.vikriti } : {})
      }
    });
  }

  /**
   * Get Active Treatment Plan
   */
  public async findActivePlan(clinicId: string, patientId: string) {
    return prisma.treatmentPlan.findFirst({
      where: {
        patientId,
        clinicId,
        status: 'ACTIVE'
      },
      include: {
        plannedTherapies: {
          orderBy: { dayNumber: 'asc' },
          include: { therapyType: true }
        }
      }
    });
  }
}

export const patientsRepository = new PatientsRepository();
