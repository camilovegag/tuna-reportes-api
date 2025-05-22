export const EVENT_TYPES = [
  "serenata",
  "ensayo",
  "festival",
  "certamen",
  "remate",
  "parche",
  "viaje",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
