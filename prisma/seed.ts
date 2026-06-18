import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/common/password.util';
import { michelinRetails } from './data/michelin-retails';
import { michelinTires } from './data/michelin-tires';
import { enrichTireSeed } from './data/tire-seed-enrichment';

const fallbackDatabaseUrl =
  'postgresql://hackasaumon:hackasaumon@localhost:5433/hackasaumon?schema=public';

const connectionString = process.env.DATABASE_URL ?? fallbackDatabaseUrl;

const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString),
});

const demoUserEmail = 'demo@michelin-bike.local';
const demoUserPassword = 'password';
const defaultTireImageUrl =
  'https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4xxh5ifhzwrhwxr/bi-165_3528706657283_tire_michelin_city-cargo-comp-line_20-x-2-point-40_a_main_1-30_nopad.webp';

async function main() {
  await prisma.alert.deleteMany();
  await prisma.activityTire.deleteMany();
  await prisma.activityGpsPoint.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.userTire.deleteMany();
  await prisma.oAuthState.deleteMany();
  await prisma.stravaAccount.deleteMany();
  await prisma.user.deleteMany({
    where: {
      mail: demoUserEmail,
    },
  });
  await prisma.tireData.deleteMany();
  await prisma.retail.deleteMany();
  await prisma.event.deleteMany();

  const tireResult = await prisma.tireData.createMany({
    data: michelinTires.map((tire) => {
      const { tire_image: tireImage, ...enrichedTire } = enrichTireSeed(tire);

      return {
        ...enrichedTire,
        tireImage: tireImage ?? defaultTireImageUrl,
      };
    }),
  });

  const retailResult = await prisma.retail.createMany({
    data: michelinRetails,
  });

  const eventResult = await prisma.event.createMany({
    data: [
      {
        title: 'Sortie Gravel Michelin',
        type: 'Ride communautaire',
        date: new Date('2026-06-22T09:00:00.000Z'),
        location: 'Annecy',
        participants: 48,
        imageUrl: 'images/event-michelin.webp',
      },
      {
        title: 'Challenge 300 km',
        type: 'Challenge connecté',
        date: new Date('2026-07-01T00:00:00.000Z'),
        location: 'Lyon',
        participants: 312,
        imageUrl: 'images/event-michelin.webp',
      },
      {
        title: 'Atelier Entretien Pneus',
        type: 'Atelier partenaire',
        date: new Date('2026-07-12T14:00:00.000Z'),
        location: 'Annecy',
        participants: 25,
        imageUrl: 'images/event-michelin.webp',
      },
    ],
});

  const demoUser = await prisma.user.create({
    data: {
      firstName: 'Alex',
      lastName: 'Rider',
      mail: demoUserEmail,
      password: await hashPassword(demoUserPassword),
    },
  });

  const demoTires = await prisma.tireData.findMany({
    orderBy: {
      id: 'asc',
    },
    take: 3,
  });

  if (demoTires.length < 3) {
    throw new Error('Impossible de créer les pneus utilisateur de démo.');
  }

  const frontTire = await prisma.userTire.create({
    data: {
      user: {
        connect: { id: demoUser.id },
      },
      tire: {
        connect: { id: demoTires[0].id },
      },
      position: 'FRONT',
      kilometers: 420,
      smartTire: true,
      isActive: true,
    },
  });

  const rearTire = await prisma.userTire.create({
    data: {
      user: {
        connect: { id: demoUser.id },
      },
      tire: {
        connect: { id: demoTires[1].id },
      },
      position: 'REAR',
      kilometers: 760,
      smartTire: true,
      isActive: true,
    },
  });

  await prisma.userTire.create({
    data: {
      user: {
        connect: { id: demoUser.id },
      },
      tire: {
        connect: { id: demoTires[2].id },
      },
      position: 'SPARE',
      kilometers: 3100,
      smartTire: false,
      isActive: false,
    },
  });

  for (const activity of [
    {
      name: 'Sortie gravel matinale',
      kilometers: 42.6,
      durationSeconds: 6420,
      terrainType: 'MIXED',
      startedAt: new Date('2026-06-12T07:30:00.000Z'),
      endedAt: new Date('2026-06-12T09:17:00.000Z'),
      date: new Date('2026-06-12T00:00:00.000Z'),
    },
    {
      name: 'Entrainement route',
      kilometers: 58.2,
      durationSeconds: 8130,
      terrainType: 'ASPHALT',
      startedAt: new Date('2026-06-14T16:10:00.000Z'),
      endedAt: new Date('2026-06-14T18:25:30.000Z'),
      date: new Date('2026-06-14T00:00:00.000Z'),
    },
    {
      name: 'Reco chemins humides',
      kilometers: 24.8,
      durationSeconds: 4380,
      terrainType: 'MUD',
      startedAt: new Date('2026-06-16T06:50:00.000Z'),
      endedAt: new Date('2026-06-16T08:03:00.000Z'),
      date: new Date('2026-06-16T00:00:00.000Z'),
    },
  ] as const) {
    await prisma.activity.create({
      data: {
        ...activity,
        user: {
          connect: { id: demoUser.id },
        },
        source: 'APP_TRACKED',
        status: 'COMPLETED',
        tires: {
          create: [
            {
              tire: {
                connect: { id: frontTire.id },
              },
            },
            {
              tire: {
                connect: { id: rearTire.id },
              },
            },
          ],
        },
        gpsPoints: {
          create: [
            {
              latitude: 48.8566,
              longitude: 2.3522,
              altitude: 35,
              speed: 7.8,
              recordedAt: activity.startedAt,
            },
            {
              latitude: 48.865,
              longitude: 2.341,
              altitude: 41,
              speed: 8.2,
              recordedAt: new Date(
                activity.startedAt.getTime() +
                  Math.floor(activity.durationSeconds / 2) * 1000,
              ),
            },
            {
              latitude: 48.878,
              longitude: 2.315,
              altitude: 48,
              speed: 7.5,
              recordedAt: activity.endedAt,
            },
          ],
        },
      },
    });
  }

  console.log(`${tireResult.count} pneus Michelin insérés.`);
  console.log(`${retailResult.count} revendeurs pneus vélo Michelin insérés.`);
  console.log(
    `Utilisateur de démo créé : ${demoUserEmail} / ${demoUserPassword}`,
  );
  console.log(`${eventResult.count} événements insérés.`);
}

main()
  .catch((error) => {
    console.error('Erreur lors du seeding :', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
