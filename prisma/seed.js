"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../src/generated/prisma/client");
const michelin_retails_1 = require("./data/michelin-retails");
const fallbackDatabaseUrl = 'postgresql://hackasaumon:hackasaumon@localhost:5433/hackasaumon?schema=public';
const connectionString = process.env.DATABASE_URL ?? fallbackDatabaseUrl;
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg(connectionString),
});
async function main() {
    await prisma.retail.deleteMany();
    const result = await prisma.retail.createMany({
        data: michelin_retails_1.michelinRetails,
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
//# sourceMappingURL=seed.js.map