import { patientsRepository } from './patients.repository';
import { RegisterPatientInput, UpdatePatientInput, SaveAssessmentInput } from './patients.schema';
import * as bcrypt from 'bcrypt';
import { NotFoundError, ConflictError } from '../../lib/errors';
import { formatPaginatedResponse } from '../../lib/pagination';
import { prisma } from '../../config/database';

export class PatientsService {
  /**
   * Search and list paginated patients
   */
  public async listPatients(clinicId: string, search?: string, limit = 10, cursor?: string) {
    const skip = cursor ? 1 : 0;
    
    // We implement simpler cursor parsing or standard skips. Let's do simple pagination with total count:
    const totalCount = await patientsRepository.count(clinicId, search);
    const results = await patientsRepository.findMany(clinicId, search, limit, cursor ? undefined : 0); // simplifed offsets

    return formatPaginatedResponse(
      results,
      limit,
      totalCount,
      (item) => item.id
    );
  }

  /**
   * Register a new patient
   */
  public async registerPatient(clinicId: string, input: RegisterPatientInput) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });
    if (existing) {
      throw new ConflictError('A user with this email address has already been registered');
    }

    // Default password for patient logins
    const passwordHash = await bcrypt.hash('Password123!', 12);

    const userData = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash
    };

    const patientData = {
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      bloodGroup: input.bloodGroup,
      symptoms: input.symptoms,
      medicalHistory: input.medicalHistory,
      allergies: input.allergies,
      emergencyContact: input.emergencyContact
    };

    return patientsRepository.create(clinicId, userData, patientData);
  }

  /**
   * Get patient full clinical file
   */
  public async getPatientById(clinicId: string, id: string) {
    const patient = await patientsRepository.findById(clinicId, id);
    if (!patient) {
      throw new NotFoundError('Request patient profile was not found');
    }
    return patient;
  }

  /**
   * Update patient clinical file
   */
  public async updatePatient(clinicId: string, id: string, input: UpdatePatientInput) {
    const patient = await patientsRepository.findById(clinicId, id);
    if (!patient) {
      throw new NotFoundError('Request patient profile was not found');
    }

    const userData = {
      name: input.name,
      email: input.email,
      phone: input.phone
    };

    const patientData = {
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      bloodGroup: input.bloodGroup,
      symptoms: input.symptoms,
      medicalHistory: input.medicalHistory,
      allergies: input.allergies,
      emergencyContact: input.emergencyContact
    };

    return patientsRepository.update(clinicId, id, userData, patientData);
  }

  /**
   * Save Prakriti / Vikriti assessment details
   */
  public async saveAssessment(clinicId: string, id: string, input: SaveAssessmentInput) {
    const patient = await patientsRepository.findById(clinicId, id);
    if (!patient) {
      throw new NotFoundError('Request patient profile was not found');
    }

    return patientsRepository.saveAssessment(clinicId, id, input);
  }

  /**
   * Get full historical chronological timeline of patient therapies
   */
  public async getPatientTimeline(clinicId: string, id: string) {
    const patient = await patientsRepository.findById(clinicId, id);
    if (!patient) {
      throw new NotFoundError('Request patient profile was not found');
    }

    // Merge sessions, plans, and invoices into chronological timeline items
    const sessions = patient.sessions.map((s) => ({
      type: 'SESSION',
      date: s.scheduledStart,
      title: s.plannedTherapy?.therapyType.name || 'Custom Therapy',
      status: s.status,
      details: {
        id: s.id,
        therapist: s.therapist?.name,
        room: s.room?.name,
        notes: s.notes
      }
    }));

    const plans = patient.treatmentPlans.map((p) => ({
      type: 'PLAN',
      date: p.startDate,
      title: p.name,
      status: p.status,
      details: {
        id: p.id,
        endDate: p.endDate,
        totalDays: p.totalDays,
        description: p.description
      }
    }));

    const invoices = patient.invoices.map((inv) => ({
      type: 'INVOICE',
      date: inv.issueDate,
      title: `Invoice #${inv.invoiceNumber}`,
      status: inv.status,
      details: {
        id: inv.id,
        totalAmount: inv.totalAmount,
        dueDate: inv.dueDate
      }
    }));

    const timeline = [...sessions, ...plans, ...invoices].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return timeline;
  }

  /**
   * Get active treatment plan details
   */
  public async getActivePlan(clinicId: string, id: string) {
    const patient = await patientsRepository.findById(clinicId, id);
    if (!patient) {
      throw new NotFoundError('Request patient profile was not found');
    }

    const activePlan = await patientsRepository.findActivePlan(clinicId, id);
    if (!activePlan) {
      return null;
    }
    return activePlan;
  }
}

export const patientsService = new PatientsService();
