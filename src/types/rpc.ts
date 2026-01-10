/**
 * RPC Types Export
 *
 * This file aggregates all router types for frontend consumption via Hono RPC.
 * Import `AppType` to get fully typed API client with autocomplete and type inference.
 *
 * @example
 * ```typescript
 * // In your frontend (React, Vue, etc.):
 * import { hc } from 'hono/client';
 * import type { AppType } from '@/types/rpc'; // Adjust path as needed
 *
 * const client = hc<AppType>('http://localhost:3000');
 *
 * // Fully typed autocomplete and inference!
 * const res = await client.events.$get();
 * const data = await res.json(); // Type: { events: Event[], count: number }
 * ```
 */

// Individual router types
export type { PingRouterType } from "../routers/ping.router";
export type { AuthRouterType } from "../routers/auth.router";
export type { EventsRouterType } from "../routers/events.router";
export type { MembersRouterType } from "../routers/members.router";
export type { AttendancesRouterType } from "../routers/attendances.router";
export type { UsersRouterType } from "../routers/users.router";
export type { ClientsRouterType } from "../routers/clients.router";
export type { SerenadeBookingsRouterType } from "../routers/serenade-bookings.router";

// Main app type - import this in your frontend
export type { AppType } from "../app";
