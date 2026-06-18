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
});
