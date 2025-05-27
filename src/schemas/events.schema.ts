import { createInsertSchema } from "drizzle-zod";
import { dbSchema } from "../db";

export const eventInsertSchema = createInsertSchema(dbSchema.events);
