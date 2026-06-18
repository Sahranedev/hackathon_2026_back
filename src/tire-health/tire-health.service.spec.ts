import { TireHealthService } from './tire-health.service';

describe('TireHealthService', () => {
  const deviceId = 'tyre_rear_001';
  const tireProduct = {
    id: 1,
    model: 'Michelin Test',
    terrainTypes: [],
    minPressure: 3,
    maxPressure: 5,
  };
  const userTire = {
    id: 10,
    tireId: 1,
    tire: tireProduct,
  };

  function createTestContext({
    kilometers,
  }: {
    kilometers?: number;
  } = {}) {
    let nextReadingId = 1;
    const activeAlerts = new Map<string, any>();
    const readings: any[] = [];

    const prisma = {
      tireSensorReading: {
        create: jest.fn(({ data }) => {
          const created = {
            id: nextReadingId++,
            ...data,
            createdAt: new Date(),
          };

          readings.push(created);

          return Promise.resolve(created);
        }),
        findMany: jest.fn(({ where, orderBy, take, select }) => {
          const results = readings
            .filter((reading) => matchesWhere(reading, where))
            .sort((left, right) => {
              const measuredAtDiff =
                right.measuredAt.getTime() - left.measuredAt.getTime();

              if (measuredAtDiff !== 0) {
                return measuredAtDiff;
              }

              return right.id - left.id;
            })
            .slice(0, take);

          expect(orderBy).toEqual([{ measuredAt: 'desc' }, { id: 'desc' }]);

          if (select?.pressureBar) {
            return Promise.resolve(
              results.map((reading) => ({
                pressureBar: reading.pressureBar,
              })),
            );
          }

          return Promise.resolve(results);
        }),
        count: jest.fn(({ where }) =>
          Promise.resolve(
            readings.filter((reading) => matchesWhere(reading, where)).length,
          ),
        ),
      },
      activity: {
        findMany: jest.fn(() => Promise.resolve([])),
      },
    };

    const alertPersistenceService = {
      findActiveAlert: jest.fn((_userTireId, code) =>
        Promise.resolve(activeAlerts.get(code) ?? null),
      ),
      createAlert: jest.fn((userTireId, code, message, metadata) => {
        const activeAlert = {
          id: 100,
          userTireId,
          code,
          message,
          isChecked: false,
          metadata,
        };
        activeAlerts.set(code, activeAlert);

        return Promise.resolve(activeAlert);
      }),
      updateAlertMetadata: jest.fn((alertId, metadata) => {
        const activeAlert = activeAlerts.get('SLOW_LEAK_SUSPECTED');
        const updated = {
          ...activeAlert,
          id: alertId,
          metadata,
        };
        activeAlerts.set('SLOW_LEAK_SUSPECTED', updated);

        return Promise.resolve(updated);
      }),
      deleteActiveAlert: jest.fn((_userTireId, code) => {
        const hadActiveAlert = activeAlerts.has(code);
        activeAlerts.delete(code);

        return Promise.resolve(hadActiveAlert);
      }),
    };

    const service = new TireHealthService(
      {
        findByDeviceId: jest.fn(() =>
          Promise.resolve({
            ...userTire,
            kilometers: kilometers ?? null,
          }),
        ),
      } as any,
      {
        findById: jest.fn(() => Promise.resolve(tireProduct)),
      } as any,
      alertPersistenceService as any,
      prisma as any,
    );

    return {
      alertPersistenceService,
      service,
    };
  }

  function matchesWhere(reading: any, where: any) {
    if (where.deviceId && reading.deviceId !== where.deviceId) {
      return false;
    }

    if (where.userTireId && reading.userTireId !== where.userTireId) {
      return false;
    }

    if (!where.OR) {
      return true;
    }

    return where.OR.some((condition: any) => {
      if (condition.measuredAt?.lt) {
        return reading.measuredAt.getTime() < condition.measuredAt.lt.getTime();
      }

      if (condition.measuredAt instanceof Date && condition.id?.lt) {
        return (
          reading.measuredAt.getTime() === condition.measuredAt.getTime() &&
          reading.id < condition.id.lt
        );
      }

      if (condition.measuredAt instanceof Date && condition.id?.lte) {
        return (
          reading.measuredAt.getTime() === condition.measuredAt.getTime() &&
          reading.id <= condition.id.lte
        );
      }

      return false;
    });
  }

  it('creates slow leak alert after three decreasing readings', async () => {
    const { alertPersistenceService, service } = createTestContext();

    await service.analyzeSensorReading({
      deviceId,
      pressureBar: 4.5,
      temperatureC: 22,
      measuredAt: '2026-06-17T10:00:00.000Z',
    });
    await service.analyzeSensorReading({
      deviceId,
      pressureBar: 4.1,
      temperatureC: 23,
      measuredAt: '2026-06-17T10:01:00.000Z',
    });
    const result = await service.analyzeSensorReading({
      deviceId,
      pressureBar: 3.6,
      temperatureC: 23,
      measuredAt: '2026-06-17T10:02:00.000Z',
    });

    expect(result.alertType).toBe('SLOW_LEAK_SUSPECTED');
    expect(result.alertCreated).toBe(true);
    expect(alertPersistenceService.createAlert).toHaveBeenCalledWith(
      userTire.id,
      'SLOW_LEAK_SUSPECTED',
      expect.any(String),
      {
        slowLeak: {
          lastCheckedReadingCount: 3,
        },
      },
    );
  });

  it('removes active slow leak alert when three later readings are stable', async () => {
    const { alertPersistenceService, service } = createTestContext();

    await service.analyzeSensorReading({
      deviceId,
      pressureBar: 4.5,
      temperatureC: 22,
      measuredAt: '2026-06-17T10:00:00.000Z',
    });
    await service.analyzeSensorReading({
      deviceId,
      pressureBar: 4.1,
      temperatureC: 23,
      measuredAt: '2026-06-17T10:01:00.000Z',
    });
    await service.analyzeSensorReading({
      deviceId,
      pressureBar: 3.6,
      temperatureC: 23,
      measuredAt: '2026-06-17T10:02:00.000Z',
    });
    await service.analyzeSensorReading({
      deviceId,
      pressureBar: 3.7,
      temperatureC: 23,
      measuredAt: '2026-06-17T10:03:00.000Z',
    });
    await service.analyzeSensorReading({
      deviceId,
      pressureBar: 3.7,
      temperatureC: 23,
      measuredAt: '2026-06-17T10:04:00.000Z',
    });
    const result = await service.analyzeSensorReading({
      deviceId,
      pressureBar: 3.7,
      temperatureC: 23,
      measuredAt: '2026-06-17T10:05:00.000Z',
    });

    expect(alertPersistenceService.deleteActiveAlert).toHaveBeenCalledWith(
      userTire.id,
      'SLOW_LEAK_SUSPECTED',
    );
    expect(result.status).toBe('good');
    expect(result.alertType).toBeNull();
    expect(result.alertCreated).toBe(false);
  });

  it('analyzes the current reading even when older future readings already exist', async () => {
    const { service } = createTestContext();

    await service.analyzeSensorReading({
      deviceId,
      pressureBar: 4.2,
      temperatureC: 22,
      measuredAt: '2026-06-17T12:00:00.000Z',
    });
    const result = await service.analyzeSensorReading({
      deviceId,
      pressureBar: 2.6,
      temperatureC: 22,
      measuredAt: '2026-06-17T10:00:00.000Z',
    });

    expect(result.pressureBar).toBe(2.6);
    expect(result.pressureStatus).toBe('warning');
    expect(result.alertType).toBe('PRESSURE_TOO_LOW');
  });
});
