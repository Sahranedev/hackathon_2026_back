import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { michelinRetails } from './data/michelin-retails';

const fallbackDatabaseUrl =
  'postgresql://hackasaumon:hackasaumon@localhost:5433/hackasaumon?schema=public';

const connectionString = process.env.DATABASE_URL ?? fallbackDatabaseUrl;

const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString),
});

async function main() {
  await prisma.retail.deleteMany();

  const result = await prisma.retail.createMany({
    data: michelinRetails,
  });

  console.log(`${result.count} revendeurs pneus vélo Michelin insérés.`);
}

main()
  .catch((error) => {
    console.error('Erreur lors du seeding :', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
