import { Hono } from "hono";
import { z } from "zod/v4";
import { db, dbSchema } from "../db";
import { eventInsertSchema } from "../schemas/events.schema";

const eventsRouter = new Hono();

eventsRouter.post("/", async (c) => {
  const body = await c.req.json();
  const result = eventInsertSchema.safeParse(body);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
    const flatErrors = Object.fromEntries(
      Object.entries(tree.properties ?? {}).map(([key, value]) => [
        key,
        value.errors,
      ]),
    );

    return c.json({ error: flatErrors }, 400);
  }

  try {
    const [data] = await db
      .insert(dbSchema.events)
      .values(result.data)
      .returning({ id: dbSchema.events.id });

    return c.json({ id: data?.id, message: "Event created" }, 201);
  } catch (error) {
    return c.json({ error }, 500);
  }
});

export default eventsRouter;
