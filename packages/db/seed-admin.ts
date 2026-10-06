import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load root and server env files to get DATABASE_URL and ADMIN_EMAIL
config({ path: path.resolve(__dirname, "../../.env") });
config({ path: path.resolve(__dirname, "../../apps/server/.env") });

const { prisma } = await import("./src");

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error("ADMIN_EMAIL is not set in apps/server/.env (or root .env).");
    process.exit(1);
  }

  console.log(`Seeding admin authorized user for email: ${adminEmail}`);

  const authorizedUser = await prisma.authorizedUser.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      role: "ADMIN",
    },
  };

  console.log(
    `Authorized user saved. email=${authorizedUser.email}, role=${authorizedUser.role}`,
  );

  console.log("Seed admin complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

