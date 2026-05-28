import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AuthenticationError, ConflictError, NotFoundError } from '../../lib/errors';
import { UserRole } from '@prisma/client';
import { LoginInput, RegisterClinicInput } from './auth.schema';

export class AuthService {
  /**
   * Login user and issue tokens
   */
  public async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { clinic: true }
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid email address or inactive account');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatch) {
      throw new AuthenticationError('Incorrect password');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.clinicId, user.role);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        clinicName: user.clinic.name
      }
    };
  }

  /**
   * Rotate access and refresh tokens
   */
  public async refresh(token: string) {
    // 1. Verify token exists in database and has not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await this.deleteToken(token);
      }
      throw new AuthenticationError('Expired or invalid refresh token');
    }

    // 2. Verify token exists in Redis (guarantees revocation check)
    const redisKey = `refresh_token:${token}`;
    const userIdInRedis = await redis.get(redisKey);
    if (!userIdInRedis || userIdInRedis !== storedToken.userId) {
      await this.deleteToken(token);
      throw new AuthenticationError('Revoked or invalid refresh token session');
    }

    // 3. Delete old token from DB and Redis
    await this.deleteToken(token);

    // 4. Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      storedToken.userId,
      storedToken.user.clinicId,
      storedToken.user.role
    );

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Logout user and revoke refresh token session
   */
  public async logout(token: string) {
    await this.deleteToken(token);
  }

  /**
   * Register a new clinic and its first administrative user
   */
  public async registerClinic(input: RegisterClinicInput) {
    const existingClinic = await prisma.clinic.findUnique({
      where: { slug: input.slug }
    });
    if (existingClinic) {
      throw new ConflictError('A clinic with this URL slug already exists');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: input.adminEmail }
    });
    if (existingUser) {
      throw new ConflictError('An administrator email has already been registered');
    }

    const adminPasswordHash = await bcrypt.hash(input.adminPassword, 12);

    // Single transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: input.clinicName,
          slug: input.slug,
          isActive: true
        }
      });

      const admin = await tx.user.create({
        data: {
          clinicId: clinic.id,
          name: input.adminName,
          email: input.adminEmail,
          passwordHash: adminPasswordHash,
          role: UserRole.CLINIC_ADMIN,
          isActive: true
        }
      });

      return { clinic, admin };
    });

    return {
      clinic: result.clinic,
      admin: {
        id: result.admin.id,
        name: result.admin.name,
        email: result.admin.email,
        role: result.admin.role
      }
    };
  }

  // Helper: generates access & refresh tokens and stores refresh token
  private async generateTokens(userId: string, clinicId: string, role: string) {
    // 15-minute access token
    const accessToken = jwt.sign(
      { userId, clinicId, role },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Cryptographically secure 64-byte refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 Days TTL

    // Save refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt
      }
    });

    // Save refresh token in Redis with 7-day TTL (seconds)
    const redisKey = `refresh_token:${refreshToken}`;
    const ttlSeconds = 7 * 24 * 60 * 60;
    await redis.setex(redisKey, ttlSeconds, userId);

    return { accessToken, refreshToken };
  }

  // Helper: deletes a refresh token from database and Redis
  private async deleteToken(token: string) {
    try {
      await prisma.refreshToken.delete({ where: { token } }).catch(() => {});
      const redisKey = `refresh_token:${token}`;
      await redis.del(redisKey);
    } catch (err) {
      // Ignored if already deleted
    }
  }
}
export const authService = new AuthService();
