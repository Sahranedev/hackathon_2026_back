import { TireHealthService } from './tire-health.service';

describe('TireHealthService', () => {
  const deviceId = 'tyre_rear_001';
  const tireProduct = {
    id: 1,
    model: 'Michelin Test',
    minPressure: 3,
    maxPressure: 5,
  };
  const userTire = {
    id: 10,
    tireId: 1,
    tire: tireProduct,
  };

  function createTestContext() {
    let nextReadingId = 1;
    let activeAlert: any = null;
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
        findMany: jest.fn(({ where, orderBy, take }) => {
          const results = readings
            .filter((reading) => reading.deviceId === where.deviceId)
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

          return Promise.resolve(results);
        }),
        count: jest.fn(({ where }) =>
          Promise.resolve(
            readings.filter((reading) => reading.deviceId === where.deviceId)
              .length,
          ),
        ),
      },
    };

    const alertPersistenceService = {
      findActiveAlert: jest.fn(() => Promise.resolve(activeAlert)),
      createAlert: jest.fn((userTireId, code, message, metadata) => {
        activeAlert = {
          id: 100,
          userTireId,
          code,
          message,
          isChecked: false,
          metadata,
        };

        return Promise.resolve(activeAlert);
      }),
      updateAlertMetadata: jest.fn((alertId, metadata) => {
        activeAlert = {
          ...activeAlert,
          id: alertId,
          metadata,
        };

        return Promise.resolve(activeAlert);
      }),
      deleteActiveAlert: jest.fn(() => {
        const hadActiveAlert = activeAlert !== null;
        activeAlert = null;

        return Promise.resolve(hadActiveAlert);
      }),
    };

    const service = new TireHealthService(
      {
        findByDeviceId: jest.fn(() => Promise.resolve(userTire)),
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
});
