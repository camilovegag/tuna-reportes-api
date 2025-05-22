import { z } from "zod/v4";
import { EVENT_TYPES, type EventType } from "../constants/event-types";
import {
  EVENT_STATUS_CREATABLE,
  type EventStatusCreatable,
} from "../constants/event-status";

function requiredFieldError(field: string) {
  return {
    error: (issue: any) => {
      if (issue.input === undefined) return `${field} is required`;
    },
  };
}

export const eventSchema = z.object({
  name: z.string(requiredFieldError("name")).min(1, "name is required"),
  location: z
    .string(requiredFieldError("location"))
    .min(1, "location is required"),
  type: z
    .string(requiredFieldError("type"))
    .refine((val) => EVENT_TYPES.includes(val as EventType), {
      error: "invalid event type",
    }),
  date: z.iso.datetime(requiredFieldError("date")),
  status: z
    .string(requiredFieldError("status"))
    .refine(
      (val) => EVENT_STATUS_CREATABLE.includes(val as EventStatusCreatable),
      {
        error: "invalid event status",
      },
    ),
});
