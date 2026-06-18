import { AlertsService } from './alerts.service';

describe('AlertsService', () => {
  function createTestContext() {
    const prisma = {
      alert: {
        findMany: jest.fn(() => Promise.resolve([])),
        update: jest.fn(() =>
          Promise.resolve({
            id: 1,
            code: 'PRESSURE',
            message: 'Pressure alert',
            isChecked: true,
            metadata: null,
          }),
        ),
      },
    };

    const service = new AlertsService([], prisma as any);

    return {
      prisma,
      service,
    };
  }

  it('only returns unread user alerts', async () => {
    const { prisma, service } = createTestContext();

    await service.getUserAlerts(7);

    expect(prisma.alert.findMany).toHaveBeenCalledWith({
      where: { userTire: { userId: 7 }, isChecked: false },
      select: {
        id: true,
        code: true,
        message: true,
        isChecked: true,
        metadata: true,
      },
      orderBy: { id: 'desc' },
      take: 3,
    });
  });

  it('stores when an alert was marked as read', async () => {
    const { prisma, service } = createTestContext();

    await service.checkAlert(7, 1);

    expect(prisma.alert.update).toHaveBeenCalledWith({
      where: { id: 1, userTire: { userId: 7 } },
      data: {
        isChecked: true,
        checkedAt: expect.any(Date),
      },
    });
  });
});
