import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { patientsRepository } from '../../src/modules/patients/patients.repository';
import jwt from 'jsonwebtoken';

// Mock the database client
jest.mock('../../src/config/database', () => ({
  prisma: {
    patient: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}));

// Mock patients repository functions to prevent direct db integration errors
jest.mock('../../src/modules/patients/patients.repository', () => ({
  patientsRepository: {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    findById: jest.fn()
  }
}));

// Mock Redis client
jest.mock('../../src/config/redis', () => {
  return {
    redis: {
      get: jest.fn().mockResolvedValue(null)
    },
    __esModule: true
  };
});

describe('Patients Module - Integration CRUD Operations', () => {
  let mockToken: string;

  beforeAll(() => {
    // Generate a valid mock JWT token signed with standard test secret
    const secret = process.env.JWT_SECRET || 'secret';
    mockToken = jwt.sign(
      {
        userId: 'user-123',
        email: 'doctor@demo.com',
        role: 'DOCTOR',
        clinicId: 'clinic-456',
        clinicName: 'AyurSutra Wellness'
      },
      secret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list patients matching the clinic scope of authenticated staff member', async () => {
    const mockPatients = [
      {
        id: 'patient-1',
        clinicId: 'clinic-456',
        bloodGroup: 'O+',
        user: { name: 'Vedant Tuvar', email: 'vedant@example.com' }
      }
    ];

    (patientsRepository.count as jest.Mock).mockResolvedValueOnce(1);
    (patientsRepository.findMany as jest.Mock).mockResolvedValueOnce(mockPatients);

    const response = await request(app)
      .get('/api/v1/patients')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].user.name).toBe('Vedant Tuvar');
    
    // Confirms repository count and findMany were called with active clinic scope
    expect(patientsRepository.count).toHaveBeenCalledWith('clinic-456', undefined);
    expect(patientsRepository.findMany).toHaveBeenCalledWith('clinic-456', undefined, 10, 0);
  });

  it('should register a new patient and automatically scope them to the active clinic ID', async () => {
    const mockCreatedPatient = {
      id: 'patient-new',
      clinicId: 'clinic-456',
      bloodGroup: 'B+',
      user: {
        name: 'Somu Kumar',
        email: 'somu@example.com'
      }
    };

    // User check finds no existing user
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (patientsRepository.create as jest.Mock).mockResolvedValueOnce(mockCreatedPatient);

    const response = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        name: 'Somu Kumar',
        email: 'somu@example.com',
        phone: '+919876543210',
        gender: 'MALE',
        dateOfBirth: '1995-08-15',
        bloodGroup: 'B+',
        symptoms: ['Stress', 'Joint Pain'],
        allergies: []
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('patient-new');
    expect(response.body.data.user.name).toBe('Somu Kumar');

    // Confirms repository create matches clinic ID automatically
    expect(patientsRepository.create).toHaveBeenCalledWith(
      'clinic-456',
      expect.objectContaining({ name: 'Somu Kumar' }),
      expect.objectContaining({ bloodGroup: 'B+' })
    );
  });
});
