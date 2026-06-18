import { TerrainType } from 'src/generated/prisma/client';
import { TireWearService } from './tire-wear.service';

describe('TireWearService', () => {
  const tireProduct = {
    id: 1,
    model: 'Michelin Test',
    terrainTypes: [TerrainType.ASPHALT],
    minPressure: 3,
    maxPressure: 5,
  };

  function createTestContext({
    kilometers = 0,
    readings = [],
    activities = [],
    activeReplaceSoonAlert = false,
  }: {
    kilometers?: number;
    readings?: { pressureBar: number }[];
    activities?: { terrainType: TerrainType }[];
    activeReplaceSoonAlert?: boolean;
  } = {}) {
    const userTire = {
      id: 10,
      tireId: 1,
      userId: 1,
      kilometers,
      tire: tireProduct,
    };
    const activeAlerts = new Map<string, any>();

    if (activeReplaceSoonAlert) {
      activeAlerts.set('REPLACE_SOON', {
        id: 100,
        userTireId: userTire.id,
        code: 'REPLACE_SOON',
        message: 'Existing alert',
        isChecked: false,
        metadata: null,
      });
    }

    const prisma = {
      userTire: {
        findUnique: jest.fn(() => Promise.resolve(userTire)),
        findFirst: jest.fn(() => Promise.resolve(userTire)),
      },
      tireSensorReading: {
        findMany: jest.fn(() => Promise.resolve(readings)),
      },
      activity: {
        findMany: jest.fn(() => Promise.resolve(activities)),
        findUnique: jest.fn(() =>
          Promise.resolve({
            tires: [{ tireId: userTire.id }],
          }),
        ),
      },
    };

    const alertPersistenceService = {
      findActiveAlert: jest.fn((_userTireId, code) =>
        Promise.resolve(activeAlerts.get(code) ?? null),
      ),
      createAlert: jest.fn((userTireId, code, message, metadata) => {
        const activeAlert = {
          id: 101,
          userTireId,
          code,
          message,
          isChecked: false,
          metadata,
        };
        activeAlerts.set(code, activeAlert);

        return Promise.resolve(activeAlert);
      }),
      deleteActiveAlert: jest.fn((_userTireId, code) => {
        const hadActiveAlert = activeAlerts.has(code);
        activeAlerts.delete(code);

        return Promise.resolve(hadActiveAlert);
      }),
    };

    const service = new TireWearService(
      prisma as any,
      alertPersistenceService as any,
    );

    return {
      alertPersistenceService,
      prisma,
      service,
      userTire,
    };
  }

  it('creates replace soon alert when mileage penalty is high', async () => {
    const { alertPersistenceService, service, userTire } = createTestContext({
      kilometers: 2000,
    });

    const result = await service.evaluateUserTireWear(userTire.id);

    expect(result.healthScore).toBe(30);
    expect(result.healthStatus).toBe('replace_soon');
    expect(result.alertType).toBe('REPLACE_SOON');
    expect(result.alertCreated).toBe(true);
    expect(result.alertCleared).toBe(false);
    expect(alertPersistenceService.createAlert).toHaveBeenCalledWith(
      userTire.id,
      'REPLACE_SOON',
      expect.any(String),
      {
        tireHealth: expect.objectContaining({
          healthScore: 30,
          healthStatus: 'replace_soon',
          mileageKm: 2000,
          mileagePenalty: 70,
        }),
      },
    );
  });

  it('does not mark existing replace soon alert as newly created', async () => {
    const { service, userTire } = createTestContext({
      kilometers: 2000,
      activeReplaceSoonAlert: true,
    });

    const result = await service.evaluateUserTireWear(userTire.id);

    expect(result.alertCreated).toBe(false);
    expect(result.alertCleared).toBe(false);
  });

  it('returns a snapshot without synchronizing replace soon alert', async () => {
    const { alertPersistenceService, service, userTire } = createTestContext({
      kilometers: 2000,
    });

    const result = await service.getUserTireWearSnapshot(userTire.id);

    expect(result.healthStatus).toBe('replace_soon');
    expect(result.alertType).toBe('REPLACE_SOON');
    expect(result.alertCreated).toBe(false);
    expect(result.alertCleared).toBe(false);
    expect(alertPersistenceService.findActiveAlert).not.toHaveBeenCalled();
    expect(alertPersistenceService.createAlert).not.toHaveBeenCalled();
    expect(alertPersistenceService.deleteActiveAlert).not.toHaveBeenCalled();
  });

  it('clears active replace soon alert when tire wear is no longer critical', async () => {
    const { alertPersistenceService, service, userTire } = createTestContext({
      kilometers: 100,
      activeReplaceSoonAlert: true,
    });

    const result = await service.evaluateUserTireWear(userTire.id);

    expect(result.healthStatus).toBe('good');
    expect(result.alertType).toBeNull();
    expect(result.alertCreated).toBe(false);
    expect(result.alertCleared).toBe(true);
    expect(alertPersistenceService.deleteActiveAlert).toHaveBeenCalledWith(
      userTire.id,
      'REPLACE_SOON',
    );
  });

  it('includes recent under-inflation in the wear score', async () => {
    const { service, userTire } = createTestContext({
      kilometers: 1500,
      readings: [
        { pressureBar: 2.5 },
        { pressureBar: 2.6 },
        { pressureBar: 2.7 },
        { pressureBar: 2.8 },
      ],
    });

    const result = await service.evaluateUserTireWear(userTire.id);

    expect(result.healthScore).toBe(30);
    expect(result.healthStatus).toBe('replace_soon');
    expect(result.healthDetails).toEqual(
      expect.objectContaining({
        mileagePenalty: 50,
        underInflatedCount: 4,
        underInflationPenalty: 20,
      }),
    );
  });

  it('evaluates tires linked to a completed activity', async () => {
    const { prisma, service, userTire } = createTestContext({
      kilometers: 2000,
    });

    const results = await service.evaluateActivityTires(55);

    expect(prisma.activity.findUnique).toHaveBeenCalledWith({
      where: { id: 55 },
      select: {
        tires: {
          select: {
            tireId: true,
          },
        },
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0].userTireId).toBe(userTire.id);
  });
});
