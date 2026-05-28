import { prisma } from '../../config/database';
import { CreateRoomInput, UpdateRoomInput } from './rooms.schema';
import { NotFoundError } from '../../lib/errors';

export class RoomsService {
  /**
   * List all rooms in a clinic
   */
  public async listRooms(clinicId: string) {
    return prisma.room.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Register a new clinic room/table
   */
  public async createRoom(clinicId: string, input: CreateRoomInput) {
    return prisma.room.create({
      data: {
        clinicId,
        name: input.name,
        capacity: input.capacity,
        features: input.features,
        isActive: input.isActive
      }
    });
  }

  /**
   * Update room configurations
   */
  public async updateRoom(clinicId: string, id: string, input: UpdateRoomInput) {
    const existing = await prisma.room.findFirst({
      where: { id, clinicId }
    });
    if (!existing) {
      throw new NotFoundError('Clinical room configuration was not found');
    }

    return prisma.room.update({
      where: { id },
      data: {
        name: input.name,
        capacity: input.capacity,
        features: input.features,
        isActive: input.isActive
      }
    });
  }

  /**
   * Get available rooms that are not booked during a specified time range
   */
  public async getAvailableRooms(clinicId: string, start: Date, end: Date) {
    const allRooms = await prisma.room.findMany({
      where: { clinicId, isActive: true }
    });

    const occupiedSessions = await prisma.session.findMany({
      where: {
        clinicId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS', 'RESCHEDULED'] },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
        roomId: { not: null }
      },
      select: { roomId: true }
    });

    const occupiedRoomIds = occupiedSessions
      .map((s) => s.roomId)
      .filter((id): id is string => id !== null);

    return allRooms.filter((room) => !occupiedRoomIds.includes(room.id));
  }
}

export const roomsService = new RoomsService();
