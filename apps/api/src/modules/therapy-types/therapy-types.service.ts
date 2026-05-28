import { prisma } from '../../config/database';
import { CreateTherapyTypeInput, UpdateTherapyTypeInput } from './therapy-types.schema';
import { NotFoundError } from '../../lib/errors';

export class TherapyTypesService {
  /**
   * List all therapies in a clinic
   */
  public async listTherapyTypes(clinicId: string) {
    return prisma.therapyType.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Register a new therapy type
   */
  public async createTherapyType(clinicId: string, input: CreateTherapyTypeInput) {
    return prisma.therapyType.create({
      data: {
        clinicId,
        name: input.name,
        nameHindi: input.nameHindi,
        category: input.category,
        defaultDurationMins: input.defaultDurationMins,
        defaultOils: input.defaultOils,
        description: input.description,
        contraindications: input.contraindications,
        requiresTherapistCount: input.requiresTherapistCount,
        isActive: input.isActive
      }
    });
  }

  /**
   * Update an existing therapy type configuration
   */
  public async updateTherapyType(clinicId: string, id: string, input: UpdateTherapyTypeInput) {
    const existing = await prisma.therapyType.findFirst({
      where: { id, clinicId }
    });
    if (!existing) {
      throw new NotFoundError('Therapy configuration was not found');
    }

    return prisma.therapyType.update({
      where: { id },
      data: {
        name: input.name,
        nameHindi: input.nameHindi,
        category: input.category,
        defaultDurationMins: input.defaultDurationMins,
        defaultOils: input.defaultOils,
        description: input.description,
        contraindications: input.contraindications,
        requiresTherapistCount: input.requiresTherapistCount,
        isActive: input.isActive
      }
    });
  }
}

export const therapyTypesService = new TherapyTypesService();
