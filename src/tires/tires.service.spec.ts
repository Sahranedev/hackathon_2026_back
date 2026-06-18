import { TiresService } from './tires.service';

describe('TiresService', () => {
  it('uses tire wear snapshot data in user tire summaries', async () => {
    const prisma = {
      userTire: {
        findMany: jest.fn(() =>
          Promise.resolve([
            {
              id: 10,
              position: 'rear',
              kilometers: 2000,
              smartTire: true,
              isActive: true,
              tire: {
                id: 1,
                model: 'Michelin Test',
                tireImage: 'https://example.com/test.webp',
                maxKilometers: 3000,
              },
            },
          ]),
        ),
      },
    };
    const tireWearService = {
      getUserTireWearSnapshot: jest.fn(() =>
        Promise.resolve({
          userTireId: 10,
          tireProductName: 'Michelin Test',
          healthScore: 30,
          healthStatus: 'replace_soon',
          healthDetails: {
            mileageKm: 2000,
            mileagePenalty: 70,
            underInflatedCount: 0,
            underInflationPenalty: 0,
            usagePenalty: 0,
          },
          alertType: 'REPLACE_SOON',
          alertCreated: false,
          alertCleared: false,
        }),
      ),
    };
    const service = new TiresService(prisma as any, tireWearService as any);

    const result = await service.getUserTires(1);

    expect(tireWearService.getUserTireWearSnapshot).toHaveBeenCalledWith(10);
    expect(result).toEqual([
      {
        id: 10,
        position: 'rear',
        kilometers: 2000,
        smartTire: true,
        isActive: true,
        model: 'Michelin Test',
        tireImage: 'https://example.com/test.webp',
        health: 30,
        healthScore: 30,
        healthStatus: 'replace_soon',
        healthDetails: {
          mileageKm: 2000,
          mileagePenalty: 70,
          underInflatedCount: 0,
          underInflationPenalty: 0,
          usagePenalty: 0,
        },
        healthAlertType: 'REPLACE_SOON',
      },
    ]);
  });

  it('returns user tire info with the latest pressure reading', async () => {
    const prisma = {
      userTire: {
        findFirst: jest.fn(() =>
          Promise.resolve({
            id: 10,
            kilometers: 2000,
            smartTire: true,
            tire: {
              model: 'Michelin Info',
              tireImage: 'https://example.com/info.webp',
            },
            sensorReadings: [{ pressureBar: 2.35 }],
          }),
        ),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    const result = await service.getUserTireInfo(1, 10);

    expect(prisma.userTire.findFirst).toHaveBeenCalledWith({
      where: {
        id: 10,
        userId: 1,
      },
      select: {
        id: true,
        kilometers: true,
        smartTire: true,
        tire: {
          select: {
            model: true,
            tireImage: true,
          },
        },
        sensorReadings: {
          orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
          take: 1,
          select: {
            pressureBar: true,
          },
        },
      },
    });
    expect(result).toEqual({
      id: 10,
      kilometers: 2000,
      lastPressureBar: 2.35,
      smartTire: true,
      model: 'Michelin Info',
      tireImage: 'https://example.com/info.webp',
    });
  });

  it('throws when the user tire info is not found for the user', async () => {
    const prisma = {
      userTire: {
        findFirst: jest.fn(() => Promise.resolve(null)),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    await expect(service.getUserTireInfo(1, 10)).rejects.toThrow(
      'User tire not found',
    );
  });

  it('returns model, position, and wear calculation for one user tire', async () => {
    const prisma = {
      userTire: {
        findFirst: jest.fn(() =>
          Promise.resolve({
            id: 10,
            position: 'front',
            kilometers: 800,
            tire: {
              id: 1,
              model: 'Michelin Front',
              tireImage: 'https://example.com/front.webp',
              maxKilometers: 3000,
            },
          }),
        ),
      },
    };
    const tireWearService = {
      getUserTireWearSnapshot: jest.fn(() =>
        Promise.resolve({
          userTireId: 10,
          tireProductName: 'Michelin Front',
          healthScore: 85,
          healthStatus: 'good',
          healthDetails: {
            mileageKm: 800,
            mileagePenalty: 15,
            underInflatedCount: 0,
            underInflationPenalty: 0,
            usagePenalty: 0,
          },
          alertType: null,
          alertCreated: false,
          alertCleared: false,
        }),
      ),
    };
    const service = new TiresService(prisma as any, tireWearService as any);

    const result = await service.getUserTireWear(1, 10);

    expect(prisma.userTire.findFirst).toHaveBeenCalledWith({
      where: {
        id: 10,
        userId: 1,
      },
      include: {
        tire: true,
      },
    });
    expect(tireWearService.getUserTireWearSnapshot).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      id: 10,
      model: 'Michelin Front',
      tireImage: 'https://example.com/front.webp',
      position: 'front',
      healthScore: 85,
      healthStatus: 'good',
    });
  });

  it('throws when the user tire wear target is not found for the user', async () => {
    const prisma = {
      userTire: {
        findFirst: jest.fn(() => Promise.resolve(null)),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    await expect(service.getUserTireWear(1, 10)).rejects.toThrow(
      'User tire not found',
    );
  });

  it('updates a user tire active status', async () => {
    const prisma = {
      userTire: {
        findFirst: jest.fn(() => Promise.resolve({ id: 10, isActive: true })),
        update: jest.fn(() => Promise.resolve({ id: 10, isActive: false })),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    const result = await service.updateUserTireActive(1, 10, false);

    expect(prisma.userTire.findFirst).toHaveBeenCalledWith({
      where: {
        id: 10,
        userId: 1,
      },
      select: {
        id: true,
        isActive: true,
      },
    });
    expect(prisma.userTire.update).toHaveBeenCalledWith({
      where: {
        id: 10,
      },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        isActive: true,
      },
    });
    expect(result).toEqual({
      id: 10,
      isActive: false,
    });
  });

  it('activates a user tire when fewer than two other tires are active', async () => {
    const prisma = {
      userTire: {
        count: jest.fn(() => Promise.resolve(1)),
        findFirst: jest.fn(() => Promise.resolve({ id: 10, isActive: false })),
        update: jest.fn(() => Promise.resolve({ id: 10, isActive: true })),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    const result = await service.updateUserTireActive(1, 10, true);

    expect(prisma.userTire.count).toHaveBeenCalledWith({
      where: {
        userId: 1,
        isActive: true,
        id: {
          not: 10,
        },
      },
    });
    expect(result).toEqual({
      id: 10,
      isActive: true,
    });
  });

  it('does not block setting an already active user tire active again', async () => {
    const prisma = {
      userTire: {
        count: jest.fn(),
        findFirst: jest.fn(() => Promise.resolve({ id: 10, isActive: true })),
        update: jest.fn(() => Promise.resolve({ id: 10, isActive: true })),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    const result = await service.updateUserTireActive(1, 10, true);

    expect(prisma.userTire.count).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 10,
      isActive: true,
    });
  });

  it('throws when activating a third user tire', async () => {
    const prisma = {
      userTire: {
        count: jest.fn(() => Promise.resolve(2)),
        findFirst: jest.fn(() => Promise.resolve({ id: 10, isActive: false })),
        update: jest.fn(),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    await expect(service.updateUserTireActive(1, 10, true)).rejects.toThrow(
      'Un utilisateur ne peut avoir que jusqu\'à 2 pneus actifs.',
    );
    expect(prisma.userTire.update).not.toHaveBeenCalled();
  });

  it('throws when updating active status for an unknown user tire', async () => {
    const prisma = {
      userTire: {
        findFirst: jest.fn(() => Promise.resolve(null)),
        update: jest.fn(),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    await expect(service.updateUserTireActive(1, 10, true)).rejects.toThrow(
      'User tire not found',
    );
    expect(prisma.userTire.update).not.toHaveBeenCalled();
  });

  it('throws when adding a user tire would exceed two active tires', async () => {
    const prisma = {
      tireData: {
        findUnique: jest.fn(() => Promise.resolve({ id: 1 })),
      },
      userTire: {
        count: jest.fn(() => Promise.resolve(2)),
        create: jest.fn(),
      },
    };
    const service = new TiresService(prisma as any, {} as any);

    await expect(service.addUserTire(1, 1)).rejects.toThrow(
      'Un utilisateur ne peut avoir que jusqu\'à 2 pneus actifs.',
    );
    expect(prisma.userTire.create).not.toHaveBeenCalled();
  });
});
