import { faker } from "@faker-js/faker";
import { db } from "../db";
import {
  attendances,
  clients,
  events,
  members,
  serenadeBookings,
  users,
} from "../db/schema";

async function seed() {
  console.log("🌱 Starting seed...");

  // 1. Create Members
  console.log("Creating members...");
  const createdMembers = await db
    .insert(members)
    .values(
      Array.from({ length: 10 }).map(() => ({
        fullName: faker.person.fullName(),
        nickname: faker.person.firstName(), // Simple nickname
        birthDate:
          faker.date.birthdate().toISOString().split("T")[0] ?? "1970-01-01",
        rank: faker.helpers.arrayElement(["aspirante", "tuno", "bulto"]),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        documentNumber: faker.string.numeric(10),
        isActive: true,
        vinculationCode: faker.string.uuid(),
      })),
    )
    .returning();

  // 2. Create Users for Members
  console.log("Creating users...");
  const passwordHash = await Bun.password.hash("password"); // Universal password for seeded users

  await db.insert(users).values(
    createdMembers.map((member) => ({
      email: member.email || faker.internet.email(),
      memberId: member.id,
      role: faker.helpers.arrayElement(["editor", "viewer", "admin"]),
      provider: "local" as "local",
      passwordHash,
    })),
  );

  // Create one specific Admin user for testing
  const adminMember = await db
    .insert(members)
    .values({
      fullName: "Admin User",
      nickname: "admin",
      birthDate: "1990-01-01",
      rank: "tuno",
      email: "admin@tuna.com",
      vinculationCode: faker.string.uuid(),
    })
    .returning();

  if (adminMember[0]) {
    await db.insert(users).values({
      email: "admin@tuna.com",
      memberId: adminMember[0].id,
      role: "admin",
      passwordHash,
    });
  }

  // 3. Create Clients
  console.log("Creating clients...");
  const createdClients = await db
    .insert(clients)
    .values(
      Array.from({ length: 5 }).map(() => ({
        name: faker.company.name(),
        phone: faker.phone.number({ style: "human" }).slice(0, 20),
        email: faker.internet.email(),
        notes: faker.lorem.sentence(),
      })),
    )
    .returning();

  // 4. Create Events
  console.log("Creating events...");
  const createdEvents = await db
    .insert(events)
    .values(
      Array.from({ length: 5 }).map(() => ({
        name: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        date: faker.date.future().toISOString(),
        location: faker.location.streetAddress(),
        type: faker.helpers.arrayElement([
          "ensayo",
          "festival",
          "serenata",
          "parche",
          "certamen",
          "remate",
          "viaje",
        ]),
        status: "confirmado" as "confirmado",
        isInternational: faker.datatype.boolean(),
        // createdBy: ... (optional)
      })),
    )
    .returning();

  // 5. Create Serenade Bookings (linked to events of type 'serenata' and clients)
  console.log("Creating serenade bookings...");
  const serenadeEvents = createdEvents.filter((e) => e.type === "serenata");

  if (serenadeEvents.length > 0 && createdClients.length > 0) {
    await db.insert(serenadeBookings).values(
      serenadeEvents.map((event) => ({
        eventId: event.id,
        clientId: faker.helpers.arrayElement(createdClients).id,
        price: Number(
          faker.commerce.price({ min: 100000, max: 500000, dec: 0 }),
        ), // Integer price
        occasion: faker.helpers.arrayElement([
          "cumpleanos",
          "matrimonio",
          "grado",
          "quince_anos",
          "aniversario",
          "despedida",
          "otro",
        ]),
        occasionDetails: faker.lorem.sentence(),
      })),
    );
  }

  // 6. Create Attendances
  console.log("Creating attendances...");
  const attendanceData = [];
  for (const event of createdEvents) {
    for (const member of createdMembers) {
      if (Math.random() > 0.5) {
        // 50% chance of attendance record
        attendanceData.push({
          eventId: event.id,
          memberId: member.id,
          status: faker.helpers.arrayElement([
            "asiste",
            "no_asiste",
            "por_confirmar",
            "no_responde",
          ]),
        });
      }
    }
  }
  if (attendanceData.length > 0) {
    await db.insert(attendances).values(attendanceData);
  }

  console.log("✅ Seed completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
