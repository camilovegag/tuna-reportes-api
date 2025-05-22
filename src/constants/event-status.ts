export const EVENT_STATUS_CREATABLE = ["por_confirmar", "confirmado"] as const;

export const EVENT_STATUS = [
  "por_confirmar",
  "confirmado",
  "realizado",
  "cancelado",
] as const;

export type EventStatusCreatable = (typeof EVENT_STATUS_CREATABLE)[number];
export type EventStatus = (typeof EVENT_STATUS)[number];
