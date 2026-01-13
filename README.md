# 🎵 Tuna Reportes API

API REST para la gestión integral de una tuna universitaria: miembros, eventos, asistencias y usuarios.

[![Tests](https://img.shields.io/badge/tests-112%20passing-brightgreen)]()
[![Bun](https://img.shields.io/badge/bun-v1.2.8-black)]()
[![TypeScript](https://img.shields.io/badge/typescript-100%25-blue)]()
[![Biome](https://img.shields.io/badge/biome-2.3-60a5fa)]()

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Endpoints](#-endpoints)
- [RPC Client (Type-Safe)](#-rpc-client-type-safe)
- [Flujo de Autenticación](#-flujo-de-autenticación)
- [Base de Datos](#️-base-de-datos)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Documentación Adicional](#-documentación-adicional)

---

## ✨ Características

- **Autenticación JWT** con soporte para Google OAuth (futuro)
- **CRUD completo** de miembros, eventos, asistencias y usuarios
- **Validación robusta** con Zod v4 + Drizzle
- **Type-safe al 100%** con TypeScript strict mode
- **Hono RPC** para integración type-safe con frontends
- **Service Layer** con patrón `ServiceResult<T>` para manejo de errores
- **Tests comprehensivos** (112+ tests pasando)
- **Soft deletes** para miembros
- **Audit trail** en asistencias y eventos
- **Query filtering** con paginación en endpoints de listado

---

## 🛠️ Stack Tecnológico

### Core

| Tecnología                                          | Descripción                       |
| --------------------------------------------------- | --------------------------------- |
| **[Bun](https://bun.sh)** v1.2.8+                   | Runtime JavaScript ultrarrápido   |
| **[Hono](https://hono.dev)** v4                     | Framework web minimalista con RPC |
| **[TypeScript](https://www.typescriptlang.org/)** 5 | Tipado estático (strict mode)     |

### Base de Datos

| Tecnología                                                    | Descripción              |
| ------------------------------------------------------------- | ------------------------ |
| **[PostgreSQL](https://www.postgresql.org/)**                 | Base de datos relacional |
| **[Drizzle ORM](https://orm.drizzle.team/)**                  | ORM type-safe            |
| **[Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)** | Migraciones y Studio     |

### Validación & Seguridad

| Tecnología                                           | Descripción               |
| ---------------------------------------------------- | ------------------------- |
| **[Zod](https://zod.dev/)** v4                       | Validación de schemas     |
| **[drizzle-zod](https://orm.drizzle.team/docs/zod)** | Integración Drizzle + Zod |
| **JWT**                                              | Autenticación con tokens  |

### Desarrollo

| Tecnología                                     | Descripción                                                |
| ---------------------------------------------- | ---------------------------------------------------------- |
| **[Biome](https://biomejs.dev/)** v2.3         | Linting + Formateo unificado (reemplaza ESLint + Prettier) |
| **[Husky](https://typicode.github.io/husky/)** | Git hooks                                                  |
| **[Bun Test](https://bun.sh/docs/cli/test)**   | Testing nativo                                             |

---

## 🚀 Inicio Rápido

### Requisitos Previos

- [Bun](https://bun.sh) v1.2.8+
- [Docker](https://www.docker.com/) (para PostgreSQL)
- [Git](https://git-scm.com/)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd tuna-reportes-api

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales

# 4. Iniciar PostgreSQL
docker-compose up -d

# 5. Aplicar migraciones
bun run db:migrate

# 6. Iniciar el servidor
bun run dev
```

El servidor estará disponible en **http://localhost:3000**

### Variables de Entorno

```bash
# .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/default
JWT_SECRET=tu-secreto-super-seguro-cambialo-en-produccion
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

---

## 🔌 Endpoints

### 🏓 Health Check

```http
GET /ping
```

### 🔐 Autenticación

| Método | Endpoint         | Auth | Descripción             |
| ------ | ---------------- | ---- | ----------------------- |
| POST   | `/auth/register` | ❌   | Registrar nuevo usuario |
| POST   | `/auth/login`    | ❌   | Login y obtener JWT     |

### 👥 Miembros

| Método | Endpoint                | Auth | Descripción                      |
| ------ | ----------------------- | ---- | -------------------------------- |
| GET    | `/members/registration` | ❌   | Lista para registro (público)    |
| GET    | `/members`              | ✅   | Listar miembros activos          |
| GET    | `/members/:id`          | ✅   | Obtener miembro específico       |
| POST   | `/members`              | ✅   | Crear nuevo miembro              |
| PATCH  | `/members/:id`          | ✅   | Actualizar miembro               |
| DELETE | `/members/:id`          | ✅   | Desactivar miembro (soft delete) |

### 📅 Eventos

| Método | Endpoint      | Auth | Descripción                  |
| ------ | ------------- | ---- | ---------------------------- |
| GET    | `/events`     | ✅   | Listar eventos (con filtros) |
| GET    | `/events/:id` | ✅   | Obtener evento específico    |
| POST   | `/events`     | ✅   | Crear nuevo evento           |
| PATCH  | `/events/:id` | ✅   | Actualizar evento            |

**Query Parameters para `GET /events`:**

| Param    | Tipo               | Ejemplo                    | Descripción                               |
| -------- | ------------------ | -------------------------- | ----------------------------------------- |
| `status` | string (comma-sep) | `confirmado,por_confirmar` | Filtrar por estado                        |
| `type`   | string (comma-sep) | `serenata,ensayo`          | Filtrar por tipo                          |
| `from`   | ISO date           | `2026-01-01`               | Eventos desde fecha                       |
| `to`     | ISO date           | `2026-12-31`               | Eventos hasta fecha                       |
| `limit`  | number             | `20`                       | Máximo resultados (default: 50, max: 100) |
| `offset` | number             | `0`                        | Saltar N resultados                       |

### ✅ Asistencias

| Método | Endpoint                    | Auth | Descripción                          |
| ------ | --------------------------- | ---- | ------------------------------------ |
| GET    | `/attendances`              | ✅   | Listar asistencias (soporta filtros) |
| GET    | `/attendances?eventId=xxx`  | ✅   | Filtrar por evento                   |
| GET    | `/attendances?memberId=xxx` | ✅   | Filtrar por miembro                  |
| GET    | `/attendances/:id`          | ✅   | Obtener asistencia específica        |
| POST   | `/attendances`              | ✅   | Crear asistencia                     |
| PATCH  | `/attendances/:id`          | ✅   | Actualizar estado de asistencia      |
| DELETE | `/attendances/:id`          | ✅   | Eliminar asistencia                  |

### 👤 Usuarios

| Método | Endpoint     | Auth | Descripción                |
| ------ | ------------ | ---- | -------------------------- |
| GET    | `/users/me`  | ✅   | Obtener usuario actual     |
| GET    | `/users`     | ✅   | Listar todos los usuarios  |
| GET    | `/users/:id` | ✅   | Obtener usuario específico |
| PATCH  | `/users/:id` | ✅   | Actualizar rol de usuario  |

---

## 🔗 RPC Client (Type-Safe)

Este proyecto expone tipos para crear un cliente RPC completamente type-safe en tu frontend.

### Instalación en Frontend

```bash
bun add hono
```

### Crear Cliente

```typescript
// src/lib/api-client.ts
import { hc } from "hono/client";
import type { AppType } from "../../tuna-reportes-api/src/types/rpc";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const createAuthenticatedClient = () => {
  const token = localStorage.getItem("auth_token");
  return hc<AppType>(API_URL, {
    init: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
};
```

> **📦 Repositorios Separados**: Si tu frontend y backend no están en un monorepo, puedes instalar este proyecto como paquete desde GitHub. Ver [INSTALL_AS_PACKAGE.md](./INSTALL_AS_PACKAGE.md) para la guía completa.

### Uso

```typescript
// Login con tipos completos
const res = await publicApi.auth.login.$post({
  json: { email, password },
});
const data = await res.json(); // { token: string, user: {...} }

// Fetch events con autocomplete
const api = createAuthenticatedClient();
const res = await api.events.$get();
const { events, count, total } = await res.json();

// Crear evento con validación en tiempo de compilación
await api.events.$post({
  json: { name, date, location, type: "serenata" },
});
```

### Beneficios

| ✅  | Beneficio                                                               |
| --- | ----------------------------------------------------------------------- |
| 🎯  | **Full Type Safety**: Autocomplete para todas las rutas y payloads      |
| 🔴  | **Compile-Time Errors**: Detecta errores de contrato antes del runtime  |
| ⚡  | **No Code Generation**: Tipos inferidos directamente del backend        |
| 🔄  | **Refactoring Support**: Renombra rutas/campos con feedback instantáneo |

> 📄 Ver [RPC_USAGE.md](./RPC_USAGE.md) para documentación completa con ejemplos de React hooks.

---

## 🔐 Flujo de Autenticación

### 1. Registro de Usuario

```http
POST /auth/register
Content-Type: application/json

{
  "email": "usuario@tuna.com",
  "password": "MiPassword123!",
  "vinculationCode": "uuid-del-miembro"
}
```

**Respuesta** (201):

```json
{
  "id": "uuid",
  "message": "User created"
}
```

### 2. Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@tuna.com",
  "password": "MiPassword123!"
}
```

**Respuesta** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "usuario@tuna.com",
    "role": "viewer"
  }
}
```

### 3. Usar el Token

```http
GET /members
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### ⏰ Expiración del Token

Los tokens JWT tienen una duración de **7 días**. Después de este tiempo, el usuario deberá volver a autenticarse.

---

## 🗄️ Base de Datos

### Schema

El proyecto utiliza 4 tablas principales:

- **users** - Usuarios del sistema (vinculados a members)
- **members** - Miembros de la tuna
- **events** - Eventos (serenatas, ensayos, festivales, etc.)
- **attendances** - Asistencias de miembros a eventos

### Drizzle Studio

Explora la base de datos visualmente:

```bash
bun run db:studio
```

Abre **http://localhost:4983** en tu navegador.

### Migraciones

```bash
# Generar nueva migración después de cambiar schema.ts
bun run db:generate

# Aplicar migraciones pendientes
bun run db:migrate

# Eliminar migraciones (⚠️ cuidado)
bun run db:drop
```

---

## 💻 Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
bun run dev              # Servidor con hot-reload
bun run format           # Formatear código con Biome
bun run lint             # Lint código con Biome
bun run check            # Lint + Format en un comando

# Base de Datos
bun run db:studio        # Abrir Drizzle Studio
bun run db:generate      # Generar migraciones
bun run db:migrate       # Aplicar migraciones
bun run db:drop          # Eliminar migraciones
bun run db:seed          # Seed de datos de prueba
bun run db:clean         # Limpiar base de datos

# Testing
bun test                 # Ejecutar todos los tests
bun test --watch         # Tests en modo watch
```

### Estructura del Proyecto

```
src/
├── app/                 # Configuración de Hono
├── constants/           # Constantes (error codes, roles)
├── db/                  # Schema y configuración de DB
├── middlewares/         # Middlewares (auth, validation)
├── routers/             # Definición de rutas (thin layer)
├── schemas/             # Validación con Zod
├── scripts/             # Scripts de DB (seed, clean)
├── services/            # Lógica de negocio (ServiceResult<T>)
├── types/               # Tipos TypeScript + RPC types
├── utils/               # Utilidades (test helpers)
├── tests/               # Integration tests
└── index.ts             # Entry point (Bun.serve)
```

### Code Style (Biome)

El proyecto usa **Biome** para linting y formateo unificado:

| Configuración   | Valor         |
| --------------- | ------------- |
| Semicolons      | Required      |
| Quotes          | Double quotes |
| Trailing commas | All           |
| Indent          | 2 spaces      |
| Line width      | 80 characters |

### Git Hooks

El proyecto usa Husky con lint-staged:

- **Pre-commit**: `biome check --write` en archivos staged

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
bun test

# Archivo específico
bun test src/tests/events.router.test.ts

# Por nombre
bun test -t "should create event"

# Modo watch
bun test --watch
```

### Resultados Actuales

```
✅ 112+ tests passing
⏭️  Tests todo pendientes
❌ 0 tests failing
⏱️  ~10s execution time
```

### Coverage por Módulo

- **Auth**: tests de registro y login
- **Members**: CRUD + soft delete
- **Events**: CRUD + filtros de query
- **Attendances**: CRUD + filtros
- **Users**: perfil + gestión de roles

---

## 📚 Documentación Adicional

| Documento                                        | Descripción                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| [AGENTS.md](./AGENTS.md)                         | Guía para AI agents trabajando en el codebase                    |
| [RPC_USAGE.md](./RPC_USAGE.md)                   | Guía completa de integración RPC con frontends                   |
| [INSTALL_AS_PACKAGE.md](./INSTALL_AS_PACKAGE.md) | Cómo instalar el backend como paquete de tipos (repos separados) |

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Convenciones de Código

- **Formateo**: Biome (2 espacios, semicolons, double quotes)
- **Linting**: Biome con reglas recomendadas
- **Commits**: Mensajes descriptivos en inglés
- **Tests**: Obligatorios para nuevas features
- **Imports**: `zod/v4` siempre, nunca `zod`

---

## 📝 Licencia

Este proyecto es privado y confidencial.

---

## 👥 Autores

- **Camilo Vega** - Desarrollo inicial

---

**¿Preguntas?** Abre un issue o contacta al equipo de desarrollo.

🎵 **Hecho con ❤️ para la Tuna**
