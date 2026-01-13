# Instalando tuna-reportes-api como Paquete de Tipos

Esta guía explica cómo usar este backend como un paquete instalable para obtener **type-safety completo** en tu frontend usando Hono RPC.

## 🎯 ¿Por qué esta solución?

Cuando tu frontend y backend son **repositorios separados** (no monorepo), necesitas una forma de compartir los tipos TypeScript. Hono RPC permite esto instalando el backend como una dependencia de desarrollo.

### Ventajas:

- ✅ **Type-safety end-to-end** sin duplicar código
- ✅ **No code generation** - tipos inferidos directamente
- ✅ **Autocomplete completo** en el frontend
- ✅ **Refactoring seguro** - cambios en el backend se reflejan en el frontend
- ✅ **Sin monorepo** - repos independientes

---

## 📦 Configuración del Backend (Ya está lista)

El `package.json` ya está configurado para ser instalable:

```json
{
  "name": "tuna-reportes-api",
  "version": "1.0.0",
  "private": false, // Permite instalación
  "types": "src/types/rpc.ts", // Punto de entrada de tipos
  "exports": {
    ".": {
      "types": "./src/types/rpc.ts",
      "default": "./src/index.ts"
    }
  },
  "files": ["src"] // Incluye src/ en el paquete
}
```

### ¿Qué exporta?

El archivo `src/types/rpc.ts` exporta:

- `AppType` - Tipo principal de toda la API
- Tipos individuales de cada router (opcional)

---

## 🚀 Instalación en el Frontend

### Opción 1: Desde GitHub (Recomendado)

```bash
# Repositorio público
bun add github:camilovegag/tuna-reportes-api

# Repositorio privado (con SSH configurado)
bun add git+ssh://git@github.com/camilovegag/tuna-reportes-api.git
```

### Opción 2: Desde Local (Para desarrollo)

```bash
# En el frontend
bun add ../tuna-reportes-api
```

### Opción 3: Usando link (Para desarrollo activo)

```bash
# En el backend
bun link

# En el frontend
bun link tuna-reportes-api
```

---

## 💻 Uso en el Frontend

### 1. Crear el cliente API

```typescript
// src/lib/api-client.ts
import { hc } from "hono/client";
import type { AppType } from "tuna-reportes-api"; // ✨ Importación limpia

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Cliente público (sin auth)
export const publicApi = hc<AppType>(API_URL);

// Cliente autenticado
export const createAuthenticatedClient = () => {
  const token = localStorage.getItem("auth_token");
  return hc<AppType>(API_URL, {
    init: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
};
```

### 2. Usar en componentes

```typescript
// Login con tipos completos
const handleLogin = async (email: string, password: string) => {
  const res = await publicApi.auth.login.$post({
    json: { email, password },
  });

  if (res.ok) {
    const data = await res.json();
    // data es typed: { token: string, user: { id, email, role } }
    localStorage.setItem("auth_token", data.token);
    return data;
  }
};

// Fetch events con autocomplete
const fetchEvents = async () => {
  const api = createAuthenticatedClient();
  const res = await api.events.$get();

  if (res.ok) {
    const { events, count, total } = await res.json();
    // Todos los campos están tipados!
    return events;
  }
};

// Crear evento con validación en compilación
const createEvent = async () => {
  const api = createAuthenticatedClient();
  const res = await api.events.$post({
    json: {
      name: "Serenata de Navidad",
      date: "2026-12-24",
      location: "Plaza Mayor",
      type: "serenata", // ✅ Autocomplete muestra todos los tipos válidos
    },
  });
};
```

### 3. React Hook Example

```typescript
// src/hooks/useEvents.ts
import { useQuery } from "@tanstack/react-query";
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
```

---

## 🔄 Workflow de Desarrollo

### Cuando cambias el backend:

1. **Haces cambios** en rutas, schemas, etc.
2. **Commiteas y pusheas** al repo del backend
3. **Actualizas en el frontend**:
   ```bash
   bun update tuna-reportes-api
   ```
4. **TypeScript te avisa** si algo se rompió en el contrato

### Durante desarrollo activo:

Si estás trabajando en ambos proyectos simultáneamente, usa `bun link`:

```bash
# Una sola vez - en el backend
cd tuna-reportes-api
bun link

# Una sola vez - en el frontend
cd tuna-reportes-web
bun link tuna-reportes-api
```

Ahora los cambios en el backend se reflejan **inmediatamente** en el frontend.

---

## 🎨 Beneficios en Acción

### Antes (sin RPC):

```typescript
// ❌ Sin tipos, propenso a errores
const res = await fetch("http://localhost:3000/events", {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json(); // data: any 😢
```

### Después (con RPC):

```typescript
// ✅ Completamente tipado
const api = createAuthenticatedClient();
const res = await api.events.$get();
const data = await res.json();
// data: { events: Event[], count: number, total: number, ... } 🎉
```

---

## 🐛 Troubleshooting

### "Cannot find module 'tuna-reportes-api'"

**Solución**: Verifica que el paquete esté instalado:

```bash
bun install
```

### Los tipos no se actualizan

**Solución**: Reinicia el TypeScript server en tu IDE:

- VSCode: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
- O actualiza el paquete: `bun update tuna-reportes-api`

### CORS errors

**Solución**: Asegúrate de que el backend permita tu frontend:

```typescript
// En backend src/app/index.ts
cors({
  origin: "http://localhost:5173", // Tu frontend URL
});
```

---

## 📚 Recursos

- [Hono RPC Documentation](https://hono.dev/docs/guides/rpc)
- [RPC_USAGE.md](./RPC_USAGE.md) - Guía completa con más ejemplos
- [AGENTS.md](./AGENTS.md) - Guía de desarrollo del proyecto

---

## ✅ Checklist de Verificación

Antes de usar en producción, verifica:

- [ ] `package.json` tiene `"types": "src/types/rpc.ts"`
- [ ] `package.json` tiene `"private": false`
- [ ] `src/app/index.ts` exporta `export type AppType = typeof app`
- [ ] El backend está pusheado a GitHub
- [ ] El frontend puede instalar el paquete
- [ ] Los tipos se importan correctamente
- [ ] El autocomplete funciona en el IDE

---

**¿Preguntas?** Revisa [RPC_USAGE.md](./RPC_USAGE.md) o contacta al equipo.

🎵 **Type-safe desde el backend hasta el frontend**
