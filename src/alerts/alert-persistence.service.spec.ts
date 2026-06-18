import { ActivityStatus } from 'src/generated/prisma/client';
import { AlertPersistenceService } from './alert-persistence.service';

describe('AlertPersistenceService', () => {
  const checkedAt = new Date('2026-06-18T10:00:00.000Z');
  const checkedAlert = {
    id: 1,
    userTireId: 10,
    code: 'PRESSURE',
    message: 'Existing checked alert',
    isChecked: true,
    createdAt: new Date('2026-06-18T09:00:00.000Z'),
    checkedAt,
    metadata: null,
  };

  function createTestContext({
    checkedAlertResult = checkedAlert,
    newerActivity = null,
  }: {
    checkedAlertResult?: typeof checkedAlert | null;
    newerActivity?: { id: number } | null;
  } = {}) {
    const prisma = {
      alert: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(checkedAlertResult),
        create: jest.fn(({ data }) =>
          Promise.resolve({
            id: 2,
            isChecked: false,
            metadata: data.metadata ?? null,
            ...data,
          }),
        ),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      activity: {
        findFirst: jest.fn(() => Promise.resolve(newerActivity)),
      },
    };

    const service = new AlertPersistenceService(prisma as any);

    return {
      prisma,
      service,
    };
  }

  it('does not recreate a checked alert when no activity happened after it was read', async () => {
    const { prisma, service } = createTestContext();

    const result = await service.createAlert(
      10,
      'PRESSURE',
      'Pressure still too low',
    );

    expect(result).toBeNull();
    expect(prisma.alert.create).not.toHaveBeenCalled();
    expect(prisma.activity.findFirst).toHaveBeenCalledWith({
      where: {
        status: ActivityStatus.COMPLETED,
        tires: {
          some: {
            tireId: 10,
          },
        },
        OR: [
          {
            createdAt: {
              gt: checkedAt,
            },
          },
          {
            updatedAt: {
              gt: checkedAt,
            },
          },
          {
            endedAt: {
              gt: checkedAt,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });
  });

  it('recreates a checked alert when a completed activity happened after it was read', async () => {
    const { prisma, service } = createTestContext({
      newerActivity: { id: 55 },
    });

    const result = await service.createAlert(
      10,
      'PRESSURE',
      'Pressure still too low',
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: 'PRESSURE',
        isChecked: false,
        message: 'Pressure still too low',
      }),
    );
    expect(prisma.alert.create).toHaveBeenCalledWith({
      data: {
        userTireId: 10,
        code: 'PRESSURE',
        message: 'Pressure still too low',
        metadata: undefined,
      },
    });
  });
});
