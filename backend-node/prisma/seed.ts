import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@threatlens.local" },
    update: {},
    create: {
      name: "ThreatLens Admin",
      email: "admin@threatlens.local",
      password,
      role: "admin"
    }
  });

  await prisma.apiSource.createMany({
    data: [
      { name: "AbuseIPDB" },
      { name: "VirusTotal" },
      { name: "URLhaus" },
      { name: "AlienVault OTX" }
    ],
    skipDuplicates: true
  });
}

main().finally(async () => prisma.$disconnect());

