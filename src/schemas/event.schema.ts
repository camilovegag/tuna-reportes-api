import { z } from "zod/v4";

export const eventSchema = z.object({
  name: z.string().min(1, "name is required"),
});
