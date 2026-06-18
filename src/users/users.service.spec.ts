import { NotFoundException } from '@nestjs/common';
import { AccountType, Roles } from 'src/generated/prisma/client';
import { UsersService } from './users.service';

describe('UsersService', () => {
  function createTestContext(user: any) {
    const prisma = {
      user: {
        findUnique: jest.fn(() => Promise.resolve(user)),
      },
    };

    const service = new UsersService(prisma as any);

    return {
      prisma,
      service,
    };
  }

  it('returns the current user profile with Strava linkage and without password', async () => {
    const { prisma, service } = createTestContext({
      id: 1,
      firstName: 'Brian',
      lastName: 'Test',
      mail: 'brian@example.com',
      roles: [Roles.USER],
      accountType: AccountType.STANDARD,
      points: 120,
      currentTier: 'BRONZE',
      referralCode: 'BRIAN123',
      stravaAccount: { id: 'strava-account-id' },
    });

    const result = await service.getCurrentUserProfile(1);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mail: true,
        roles: true,
        accountType: true,
        points: true,
        currentTier: true,
        referralCode: true,
        stravaAccount: {
          select: {
            id: true,
          },
        },
      },
    });
    expect(result).toEqual({
      id: 1,
      firstName: 'Brian',
      lastName: 'Test',
      mail: 'brian@example.com',
      roles: [Roles.USER],
      accountType: AccountType.STANDARD,
      points: 120,
      currentTier: 'BRONZE',
      referralCode: 'BRIAN123',
      stravaLinked: true,
    });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('stravaAccount');
  });

  it('sets stravaLinked to false when the user has no Strava account', async () => {
    const { service } = createTestContext({
      id: 1,
      firstName: null,
      lastName: null,
      mail: 'brian@example.com',
      roles: [Roles.USER],
      accountType: AccountType.STANDARD,
      points: 0,
      currentTier: 'BRONZE',
      referralCode: null,
      stravaAccount: null,
    });

    await expect(service.getCurrentUserProfile(1)).resolves.toEqual(
      expect.objectContaining({
        stravaLinked: false,
      }),
    );
  });

  it('throws when the current user no longer exists', async () => {
    const { service } = createTestContext(null);

    await expect(service.getCurrentUserProfile(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
