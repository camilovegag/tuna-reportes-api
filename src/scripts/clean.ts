import { sql } from "drizzle-orm";
import { db } from "../db";

async function clean() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to clean database in production environment!");
    process.exit(1);
  }
  console.log("🧹 Cleaning database...");

  // Truncate all tables with CASCADE to handle foreign keys
  // List tables in order of dependency if needed, or use cascade
  // Using sql to execute raw TRUNCATE
  const query = sql`TRUNCATE TABLE members, users, clients, events, serenade_bookings, attendances CASCADE`;

  await db.execute(query);

  console.log("✅ Database cleaned!");
  process.exit(0);
}

clean().catch((err) => {
  console.error("❌ Clean failed:", err);
  process.exit(1);
});
