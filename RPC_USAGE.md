# Using Hono RPC with Tuna Reportes API

This guide explains how to use the tuna-reportes-api with full end-to-end type safety in your frontend application (React, Vue, Svelte, etc.).

## Prerequisites

- TypeScript frontend project
- Bun or npm package manager

## Installation

```bash
# Using bun
bun add hono

# Or using npm
npm install hono
```

## Setup

### 1. Import the API types

Create a `types` or `api` directory in your frontend and add the RPC type import:

```typescript
// src/types/api.ts
export type { AppType } from "../../tuna-reportes-api/src/types/rpc";
```

**Note:** Adjust the path based on your monorepo structure. Alternatively, you can:

- Publish the API types as a separate npm package
- Copy the type definition files to your frontend
- Use TypeScript project references

### 2. Create an API client

```typescript
// src/lib/api-client.ts
import { hc } from "hono/client";
import type { AppType } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = hc<AppType>(API_BASE_URL, {
  init: {
    credentials: "include", // Enable cookies if using session-based auth
  },
});
```

### 3. Authentication Handler

For authenticated requests, create a helper to attach the JWT token:

```typescript
// src/lib/api-client.ts
import { hc } from "hono/client";
import type { AppType } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Get token from localStorage or your auth state management
const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

// Create client with auth headers
export const createAuthenticatedClient = () => {
  const token = getAuthToken();

  return hc<AppType>(API_BASE_URL, {
    init: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
};

// For unauthenticated requests (auth, public endpoints)
export const publicApi = hc<AppType>(API_BASE_URL);
```

## Usage Examples

### Authentication

```typescript
// Login
const handleLogin = async (email: string, password: string) => {
  const res = await publicApi.auth.login.$post({
    json: { email, password },
  });

  if (res.ok) {
    const data = await res.json();
    // data is typed: { token: string, user: { id, email, role } }
    localStorage.setItem("auth_token", data.token);
    return data;
  }

  const error = await res.json();
  throw new Error(error.error.message);
};

// Register
const handleRegister = async (
  email: string,
  password: string,
  vinculationCode: string,
) => {
  const res = await publicApi.auth.register.$post({
    json: { email, password, vinculationCode },
  });

  if (res.ok) {
    const data = await res.json();
    // data is typed: { id: string, message: string }
    return data;
  }

  const error = await res.json();
  throw new Error(error.error.message);
};
```

### Fetching Data (GET requests)

```typescript
// Get all events
const fetchEvents = async () => {
  const api = createAuthenticatedClient();
  const res = await api.events.$get();

  if (res.ok) {
    const data = await res.json();
    // data is typed: { events: Event[], count: number, total: number, limit: number, offset: number }
    return data;
  }
};

// Get event by ID
const fetchEvent = async (id: string) => {
  const api = createAuthenticatedClient();
  const res = await api.events[":id"].$get({
    param: { id },
  });

  if (res.ok) {
    const data = await res.json();
    // data is typed: Event
    return data;
  }
};

// Get current user profile
const fetchMe = async () => {
  const api = createAuthenticatedClient();
  const res = await api.users.me.$get();

  if (res.ok) {
    const data = await res.json();
    return data;
  }
};
```

### Creating Resources (POST requests)

```typescript
// Create a new event
const createEvent = async (eventData: {
  name: string;
  date: string;
  location: string;
  type:
    | "serenata"
    | "ensayo"
    | "festival"
    | "certamen"
    | "remate"
    | "parche"
    | "viaje";
}) => {
  const api = createAuthenticatedClient();
  const res = await api.events.$post({
    json: eventData, // Fully typed! IDE will show validation errors
  });

  if (res.ok) {
    const data = await res.json();
    // data is typed: { id: string, message: string }
    return data;
  }

  const error = await res.json();
  // error is typed: ErrorResponse
  throw new Error(error.error.message);
};

// Create a member
const createMember = async (memberData: {
  rank: "aspirante" | "bulto" | "tuno";
  birthDate: string;
  nickname: string;
  fullName: string;
}) => {
  const api = createAuthenticatedClient();
  const res = await api.members.$post({
    json: memberData,
  });

  return res.ok ? await res.json() : null;
};
```

### Updating Resources (PATCH requests)

```typescript
// Update an event
const updateEvent = async (
  id: string,
  updates: Partial<{
    name?: string;
    date?: string;
    location?: string;
    status?: "por_confirmar" | "confirmado" | "realizado" | "cancelado";
  }>,
) => {
  const api = createAuthenticatedClient();
  const res = await api.events[":id"].$patch({
    param: { id },
    json: updates,
  });

  if (res.ok) {
    const data = await res.json();
    // data is typed: Event
    return data;
  }
};
```

### Error Handling

```typescript
import type { ErrorResponse } from "../../tuna-reportes-api/src/types/error";

const handleApiError = async (res: Response) => {
  if (!res.ok) {
    const error = (await res.json()) as ErrorResponse;

    switch (error.error.code) {
      case "VALIDATION":
        console.error("Validation errors:", error.error.details);
        break;
      case "UNAUTHORIZED":
        // Redirect to login
        window.location.href = "/login";
        break;
      case "FORBIDDEN":
        alert("You do not have permission to perform this action");
        break;
      case "NOT_FOUND":
        alert("Resource not found");
        break;
      default:
        alert(error.error.message);
    }

    throw new Error(error.error.message);
  }
};
```

## React Hook Example

```typescript
// src/hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createAuthenticatedClient } from "../lib/api-client";

export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const api = createAuthenticatedClient();
      const res = await api.events.$get();
      if (!res.ok) throw new Error("Failed to fetch events");
      return await res.json();
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: {
      name: string;
      date: string;
      location: string;
      type: string;
    }) => {
      const api = createAuthenticatedClient();
      const res = await api.events.$post({ json: eventData });
      if (!res.ok) throw new Error("Failed to create event");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};
```

## Benefits

✅ **Full Type Safety**: Autocomplete for all API routes and payloads  
✅ **Compile-Time Errors**: Catch API contract mismatches before runtime  
✅ **No Code Generation**: Types are inferred directly from your backend  
✅ **Refactoring Support**: Rename routes/fields and get instant feedback  
✅ **Better DX**: IDE shows exactly what data each endpoint expects and returns

## Troubleshooting

### Types not updating

If changes to the backend aren't reflected in the frontend:

1. Restart your TypeScript server
2. Ensure the import path is correct
3. Check that your frontend TypeScript can resolve the backend files

### CORS errors

Make sure the backend's CORS configuration includes your frontend origin:

```typescript
// In backend src/app/index.ts
cors({
  origin: "http://localhost:5173", // Your frontend URL
});
```
