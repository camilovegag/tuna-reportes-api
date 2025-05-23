import { z } from "zod/v4";
import { Hono } from "hono";
import { eventSchema } from "../schemas/event.schema";
import { supabase } from "../lib/supabase";

const eventsRouter = new Hono();

eventsRouter.post("/", async (c) => {
  const body = await c.req.json();
  const result = eventSchema.safeParse(body);

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

  const eventData = result.data;

  const { data, error } = await supabase
    .from("events")
    .insert([eventData])
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ id: data.id, message: "Event created" }, 201);
});

export default eventsRouter;
