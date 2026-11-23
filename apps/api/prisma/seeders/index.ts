
import { prisma } from "../../src/lib/prisma.js";

import { seedAttractions } from "./attraction.seed.js";
// Nanti:
// import { seedUsers } from "./user.seed.js";
// import { seedStaffProfiles } from "./staff-profile.seed.js";
// import { seedQueueSessions } from "./queue-session.seed.js";

async function main() {
  console.log("Starting database seeding...");

  // Master data
  await seedAttractions();

  // User and staff data
  // await seedUsers();
  // await seedStaffProfiles();

  // Operational data
  // await seedQueueSessions();

  console.log("Database seeding completed successfully.");
}

main()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
