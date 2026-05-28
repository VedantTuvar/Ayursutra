import { prisma } from '../../config/database';
import { CreateUserInput, UpdateUserInput, UpdateMeInput } from './users.schema';
import * as bcrypt from 'bcrypt';
import { NotFoundError, ConflictError } from '../../lib/errors';

export class UsersService {
  /**
   * List all users within a clinic
   */
  public async listUsers(clinicId: string) {
    return prisma.user.findMany({
      where: { clinicId },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Create a new staff user inside a clinic
   */
  public async createUser(clinicId: string, input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });
    if (existing) {
      throw new ConflictError('A user with this email address has already been registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return prisma.user.create({
      data: {
        clinicId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
        avatar: input.avatar,
        isActive: true
      },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  /**
   * Retrieve a user by ID, locked to a clinic
   */
  public async getUserById(clinicId: string, id: string) {
    const user = await prisma.user.findFirst({
      where: { id, clinicId },
      select: {
        id: true,
        clinicId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new NotFoundError('Request staff user was not found');
    }
    return user;
  }

  /**
   * Update user details (admin access)
   */
  public async updateUser(clinicId: string, id: string, input: UpdateUserInput) {
    const user = await this.getUserById(clinicId, id);

    let passwordHash = undefined;
    if (input.password) {
      passwordHash = await bcrypt.hash(input.password, 12);
    }

    return prisma.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        avatar: input.avatar,
        isActive: input.isActive,
        ...(passwordHash ? { passwordHash } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        updatedAt: true
      }
    });
  }

  /**
   * Soft delete a user from the system
   */
  public async deleteUser(clinicId: string, id: string) {
    const user = await this.getUserById(clinicId, id);

    return prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
      select: { id: true, isActive: true }
    });
  }

  /**
   * Update own profile metrics
   */
  public async updateMe(userId: string, clinicId: string, input: UpdateMeInput) {
    return prisma.user.update({
      where: { id: userId, clinicId },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        avatar: input.avatar
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true
      }
    });
  }
}

export const usersService = new UsersService();
