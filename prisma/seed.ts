import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ActivityStatus,
  PrismaClient,
  TerrainType,
} from '../src/generated/prisma/client';
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

const demoUserEmail = 'demo@email.test';
const demoUserPassword = 'password';
const defaultTireImageUrl =
  'https://dxm.contentcenter.michelin.com/api/wedia/dam/transform/b98rpyxf61b4xxh5ifhzwrhwxr/bi-165_3528706657283_tire_michelin_city-cargo-comp-line_20-x-2-point-40_a_main_1-30_nopad.webp';

const demoAsphaltTireModels = [
  '28"-25mm POWER CUP TUBULAR BLACK',
  '28"-25mm POWER CUP TUBULAR CLASSIC',
  '28"-28mm POWER CUP TUBULAR BLACK',
] as const;

async function main() {
  await prisma.alert.deleteMany();
  await prisma.tireSensorReading.deleteMany();
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
    where: {
      model: { in: [...demoAsphaltTireModels] },
    },
    orderBy: {
      id: 'asc',
    },
  });

  if (demoTires.length < 3) {
    throw new Error(
      'Impossible de trouver les pneus route asphalte pour la démo.',
    );
  }

  const [frontCatalogTire, rearCatalogTire, spareCatalogTire] = demoTires;

  const frontTire = await prisma.userTire.create({
    data: {
      user: {
        connect: { id: demoUser.id },
      },
      tire: {
        connect: { id: frontCatalogTire.id },
      },
      position: 'FRONT',
      deviceId: 'tyre-front-001',
      kilometers: 420,
      smartTire: true,
      isActive: true,
    },
  });

  await prisma.tireSensorReading.create({
    data: {
      deviceId: 'tyre-front-001',
      userTireId: frontTire.id,
      pressureBar: frontCatalogTire.minPressure - 1.5,
      temperatureC: 22,
      measuredAt: new Date(),
    },
  });

  const rearTire = await prisma.userTire.create({
    data: {
      user: {
        connect: { id: demoUser.id },
      },
      tire: {
        connect: { id: rearCatalogTire.id },
      },
      position: 'REAR',
      deviceId: 'demo-rear-001',
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
        connect: { id: spareCatalogTire.id },
      },
      position: 'SPARE',
      deviceId: 'tyre-spare-001',
      kilometers: 3100,
      smartTire: false,
      isActive: false,
    },
  });

  const demoActivities = [
    {
      name: 'Sortie route matinale',
      kilometers: 42.6,
      durationSeconds: 6420,
      terrainType: TerrainType.ASPHALT,
      status: ActivityStatus.COMPLETED,
      startedAt: new Date('2026-06-12T07:30:00.000Z'),
      endedAt: new Date('2026-06-12T09:17:00.000Z'),
      date: new Date('2026-06-12T00:00:00.000Z'),
    },
    {
      name: 'Entrainement route',
      kilometers: 58.2,
      durationSeconds: 8130,
      terrainType: TerrainType.ASPHALT,
      status: ActivityStatus.COMPLETED,
      startedAt: new Date('2026-06-14T16:10:00.000Z'),
      endedAt: new Date('2026-06-14T18:25:30.000Z'),
      date: new Date('2026-06-14T00:00:00.000Z'),
    },
    {
      name: 'Entrainement route',
      kilometers: 42.6,
      durationSeconds: 6420,
      terrainType: TerrainType.ASPHALT,
      status: ActivityStatus.COMPLETED,
      startedAt: new Date('2026-06-14T16:10:00.000Z'),
      endedAt: new Date('2026-06-14T18:25:30.000Z'),
      date: new Date('2026-06-14T00:00:00.000Z'),
    },
  ] as const;

  for (const activity of demoActivities) {
    const midPointAt =
      activity.durationSeconds != null
        ? new Date(
            activity.startedAt.getTime() +
              Math.floor(activity.durationSeconds / 2) * 1000,
          )
        : null;

    await prisma.activity.create({
      data: {
        name: activity.name,
        kilometers: activity.kilometers,
        durationSeconds: activity.durationSeconds,
        terrainType: activity.terrainType,
        startedAt: activity.startedAt,
        endedAt: activity.endedAt,
        date: activity.date,
        user: {
          connect: { id: demoUser.id },
        },
        source: 'APP_TRACKED',
        status: activity.status,
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
              latitude: 45.8992,
              longitude: 6.1294,
              altitude: 448,
              speed: 7.8,
              recordedAt: activity.startedAt,
            },
            ...(midPointAt
              ? [
                  {
                    latitude: 45.9058,
                    longitude: 6.1182,
                    altitude: 462,
                    speed: 8.2,
                    recordedAt: midPointAt,
                  },
                ]
              : []),
            ...(activity.endedAt
              ? [
                  {
                    latitude: 45.9124,
                    longitude: 6.1068,
                    altitude: 471,
                    speed: 7.5,
                    recordedAt: activity.endedAt,
                  },
                ]
              : []),
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
