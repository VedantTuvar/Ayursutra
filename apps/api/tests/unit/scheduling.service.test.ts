import { schedulingService } from '../../src/modules/scheduling/scheduling.service';
import { prisma } from '../../src/config/database';
import { ConflictError } from '../../src/lib/errors';
import { SessionStatus } from '@prisma/client';

// Mock the database client
jest.mock('../../src/config/database', () => ({
  prisma: {
    session: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    }
  }
}));

// Mock socket.io broadcasts to prevent socket connection errors during unit testing
jest.mock('../../src/sockets/scheduling.socket', () => ({
  emitToClinic: jest.fn()
}));

describe('Scheduling Service - Conflict Detection Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect patient overlaps and throw a ConflictError', async () => {
    const mockConflictSession = {
      id: 'session-123',
      patientId: 'patient-456',
      scheduledStart: new Date('2026-05-28T10:00:00Z'),
      scheduledEnd: new Date('2026-05-28T11:00:00Z'),
      status: SessionStatus.SCHEDULED,
      patient: {
        user: {
          name: 'Vedant Tuvar'
        }
      }
    };

    // Patient overlap query finds a matching session
    (prisma.session.findFirst as jest.Mock).mockResolvedValueOnce(mockConflictSession);

    const check = await schedulingService.checkConflicts(
      'clinic-789',
      'therapist-1',
      'room-1',
      'patient-456',
      new Date('2026-05-28T10:15:00Z'),
      new Date('2026-05-28T10:45:00Z')
    );

    expect(check.hasConflict).toBe(true);
    expect(check.conflictMessage).toContain('Vedant Tuvar is already scheduled');
    expect(prisma.session.findFirst).toHaveBeenCalledTimes(1);
  });

  it('should detect therapist conflicts and return conflict state', async () => {
    const mockConflictSession = {
      id: 'session-2',
      therapistId: 'therapist-1',
      scheduledStart: new Date('2026-05-28T10:00:00Z'),
      scheduledEnd: new Date('2026-05-28T11:00:00Z'),
      status: SessionStatus.SCHEDULED,
      therapist: {
        name: 'Therapist Somu'
      }
    };

    // First check (patient) finds no conflict (returns null)
    (prisma.session.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      // Second check (therapist) finds conflict
      .mockResolvedValueOnce(mockConflictSession);

    const check = await schedulingService.checkConflicts(
      'clinic-789',
      'therapist-1',
      'room-1',
      'patient-456',
      new Date('2026-05-28T10:15:00Z'),
      new Date('2026-05-28T10:45:00Z')
    );

    expect(check.hasConflict).toBe(true);
    expect(check.conflictMessage).toContain('Therapist Therapist Somu is already allocated');
    expect(prisma.session.findFirst).toHaveBeenCalledTimes(2);
  });

  it('should detect room conflicts and return conflict state', async () => {
    const mockConflictSession = {
      id: 'session-3',
      roomId: 'room-1',
      scheduledStart: new Date('2026-05-28T10:00:00Z'),
      scheduledEnd: new Date('2026-05-28T11:00:00Z'),
      status: SessionStatus.SCHEDULED,
      room: {
        name: 'Droni Room A'
      }
    };

    // Patient and therapist checks find no conflict, room check finds conflict
    (prisma.session.findFirst as jest.Mock)
      .mockResolvedValueOnce(null) // patient check
      .mockResolvedValueOnce(null) // therapist check
      .mockResolvedValueOnce(mockConflictSession); // room check

    const check = await schedulingService.checkConflicts(
      'clinic-789',
      'therapist-1',
      'room-1',
      'patient-456',
      new Date('2026-05-28T10:15:00Z'),
      new Date('2026-05-28T10:45:00Z')
    );

    expect(check.hasConflict).toBe(true);
    expect(check.conflictMessage).toContain('Therapy room / table Droni Room A is already occupied');
    expect(prisma.session.findFirst).toHaveBeenCalledTimes(3);
  });

  it('should return no conflicts if all resources are available during the timeslot', async () => {
    (prisma.session.findFirst as jest.Mock).mockResolvedValue(null);

    const check = await schedulingService.checkConflicts(
      'clinic-789',
      'therapist-1',
      'room-1',
      'patient-456',
      new Date('2026-05-28T12:00:00Z'),
      new Date('2026-05-28T13:00:00Z')
    );

    expect(check.hasConflict).toBe(false);
    expect(check.conflictMessage).toBeNull();
    expect(prisma.session.findFirst).toHaveBeenCalledTimes(3);
  });
});
