import { plansRepository } from './plans.repository';
import { CreatePlanInput, UpdatePlanInput } from './plans.schema';
import { NotFoundError } from '../../lib/errors';

export class PlansService {
  /**
   * List plans for a specific patient
   */
  public async listPlans(clinicId: string, patientId: string) {
    return plansRepository.findMany(clinicId, patientId);
  }

  /**
   * Get specific treatment plan details
   */
  public async getPlanById(clinicId: string, patientId: string, id: string) {
    const plan = await plansRepository.findById(clinicId, patientId, id);
    if (!plan) {
      throw new NotFoundError('Request treatment plan was not found');
    }
    
    // Parse prescribedOils JSON string back to object array
    const parsedTherapies = plan.plannedTherapies.map((pt) => {
      let prescribedOils = [];
      if (pt.prescribedOils) {
        try {
          prescribedOils = typeof pt.prescribedOils === 'string' 
            ? JSON.parse(pt.prescribedOils) 
            : pt.prescribedOils;
        } catch (e) {
          prescribedOils = [];
        }
      }
      return {
        ...pt,
        prescribedOils
      };
    });

    return {
      ...plan,
      plannedTherapies: parsedTherapies
    };
  }

  /**
   * Create a new draft treatment plan
   */
  public async createPlan(clinicId: string, patientId: string, doctorId: string, input: CreatePlanInput) {
    return plansRepository.create(clinicId, patientId, doctorId, input);
  }

  /**
   * Update plan details
   */
  public async updatePlan(clinicId: string, patientId: string, id: string, input: UpdatePlanInput) {
    const plan = await plansRepository.findById(clinicId, patientId, id);
    if (!plan) {
      throw new NotFoundError('Request treatment plan was not found');
    }

    return plansRepository.update(clinicId, id, input);
  }

  /**
   * Transition a draft treatment plan to ACTIVE
   */
  public async activatePlan(clinicId: string, patientId: string, id: string) {
    const plan = await plansRepository.findById(clinicId, patientId, id);
    if (!plan) {
      throw new NotFoundError('Request treatment plan was not found');
    }

    return plansRepository.activate(clinicId, id, patientId);
  }
}

export const plansService = new PlansService();
