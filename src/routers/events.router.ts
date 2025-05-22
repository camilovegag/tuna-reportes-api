import { z } from "zod/v4";
import { Hono } from "hono";
import { eventSchema } from "../schemas/event.schema";

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
  return c.json({ id: "some-uuid", message: "created" }, 201);
});

export default eventsRouter;
