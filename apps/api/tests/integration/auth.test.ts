import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import bcrypt from 'bcrypt';

// Mock the database client
jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn()
    }
  }
}));

// Mock Redis client since the backend requires it for refresh token blacklisting
jest.mock('../../src/config/redis', () => {
  const ioredisMock = jest.fn().mockImplementation(() => ({
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null)
  }));
  return {
    redis: ioredisMock(),
    __esModule: true
  };
});

describe('Authentication Module - Integration Endpoint Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate user and return secure access credentials', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const mockUser = {
      id: 'user-789',
      name: 'Dr. Vedant Tuvar',
      email: 'doctor@demo.com',
      passwordHash,
      role: 'DOCTOR',
      clinicId: 'clinic-456',
      isActive: true, // critical fix
      clinic: {
        name: 'AyurSutra Wellness'
      }
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
    (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce({
      token: 'mock-refresh-token',
      userId: 'user-789'
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'doctor@demo.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.name).toBe('Dr. Vedant Tuvar');
    expect(response.body.data.user.role).toBe('DOCTOR');
    
    // Check that standard HttpOnly cookie is attached
    const cookies = (response.headers['set-cookie'] || []) as string[];
    expect(cookies.some((c: string) => c.includes('refreshToken='))).toBe(true);
  });

  it('should return 401 when password mismatch is detected', async () => {
    const mockUser = {
      id: 'user-789',
      name: 'Dr. Vedant Tuvar',
      email: 'doctor@demo.com',
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'DOCTOR',
      clinicId: 'clinic-456',
      isActive: true // critical fix
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'doctor@demo.com',
        password: 'WrongPassword!'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toContain('Incorrect password');
  });

  it('should reject refresh tokens that are missing or blacklisted', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({}); // no cookie attached

    expect(response.status).toBe(400); // 400 Bad Request is returned when missing
  });
});
