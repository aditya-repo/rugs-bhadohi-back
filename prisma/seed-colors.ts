import { PrismaClient } from "@prisma/client";
import { DEFAULT_COLORS } from "../src/modules/colors/default-colors";

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < DEFAULT_COLORS.length; i++) {
    const item = DEFAULT_COLORS[i];
    await prisma.color.upsert({
      where: { name: item.name },
      update: {
        hex: item.hex.toUpperCase(),
        sortOrder: i + 1,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        name: item.name,
        hex: item.hex.toUpperCase(),
        sortOrder: i + 1,
        status: "ACTIVE",
      },
    });
  }
  console.log(`Colors seeded: ${DEFAULT_COLORS.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
