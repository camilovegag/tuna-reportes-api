# 🎵 Tuna Reportes API

API REST para la gestión integral de una tuna universitaria: miembros, eventos, asistencias y usuarios.

[![Tests](https://img.shields.io/badge/tests-88%20passing-brightgreen)]()
[![Bun](https://img.shields.io/badge/bun-v1.2.8-black)]()
[![TypeScript](https://img.shields.io/badge/typescript-100%25-blue)]()

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Endpoints](#-endpoints)
- [Flujo de Autenticación](#-flujo-de-autenticación)
- [Base de Datos](#️-base-de-datos)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)

---

## ✨ Características

- **Autenticación JWT** con soporte para Google OAuth (futuro)
- **CRUD completo** de miembros, eventos, asistencias y usuarios
- **Validación robusta** con Zod + Drizzle
- **Type-safe** al 100% con TypeScript
- **Tests comprehensivos** (88 tests pasando)
- **Soft deletes** para miembros
- **Audit trail** en asistencias y eventos
- **Query filtering** en endpoints de listado

---

## 🛠️ Stack Tecnológico

### Core

- **[Bun](https://bun.sh)** - Runtime JavaScript ultrarrápido
- **[Hono](https://hono.dev)** - Framework web minimalista
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático

### Base de Datos

- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos relacional
- **[Drizzle ORM](https://orm.drizzle.team/)** - ORM type-safe
- **[Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)** - Migraciones y Studio

### Validación & Seguridad

- **[Zod](https://zod.dev/)** - Validación de schemas
- **[drizzle-zod](https://orm.drizzle.team/docs/zod)** - Integración Drizzle + Zod
- **JWT** - Autenticación con tokens

### Desarrollo

- **[ESLint](https://eslint.org/)** - Linting
- **[Prettier](https://prettier.io/)** - Formateo de código
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[Bun Test](https://bun.sh/docs/cli/test)** - Testing

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

| Método | Endpoint      | Auth | Descripción               |
| ------ | ------------- | ---- | ------------------------- |
| GET    | `/events`     | ✅   | Listar todos los eventos  |
| GET    | `/events/:id` | ✅   | Obtener evento específico |
| POST   | `/events`     | ✅   | Crear nuevo evento        |
| PATCH  | `/events/:id` | ✅   | Actualizar evento         |

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

### Resetear Base de Datos

```bash
# Detener y borrar todo
docker-compose down -v

# Iniciar limpio
docker-compose up -d
sleep 3
bun run db:migrate
```

---

## 💻 Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
bun run dev              # Servidor con hot-reload
bun run format           # Formatear código con Prettier
bun run lint             # Lint código con ESLint

# Base de Datos
bun run db:studio        # Abrir Drizzle Studio
bun run db:generate      # Generar migraciones
bun run db:migrate       # Aplicar migraciones
bun run db:drop          # Eliminar migraciones

# Testing
bun test                 # Ejecutar todos los tests
bun test --watch         # Tests en modo watch
```

### Estructura del Proyecto

```
src/
├── app/                 # Configuración de Hono
├── constants/           # Constantes (error codes)
├── controllers/         # Lógica de negocio
├── db/                  # Schema y configuración de DB
├── middlewares/         # Middlewares (auth)
├── routers/             # Definición de rutas
├── schemas/             # Validación con Zod
├── types/               # Tipos TypeScript
├── utils/               # Utilidades
└── tests/               # Tests
```

### Git Hooks

El proyecto usa Husky para ejecutar automáticamente:

- **Pre-commit**: ESLint + Prettier en archivos staged

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
bun test

# Con coverage
bun test --coverage

# Modo watch
bun test --watch
```

### Resultados Actuales

```
✅ 88 tests passing
⏭️  7 tests todo
❌ 0 tests failing
⏱️  ~10s execution time
```

### Coverage por Módulo

- **Attendances**: 12 tests ✅
- **Users**: 12 tests ✅
- **Members**: 18 tests ✅
- **Events**: 42 tests ✅
- **Auth**: 26 tests ✅
- **Ping**: 2 tests ✅

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Convenciones de Código

- **Formateo**: Prettier (2 espacios, sin semicolons)
- **Linting**: ESLint con configuración estándar
- **Commits**: Mensajes descriptivos en inglés
- **Tests**: Obligatorios para nuevas features

---

## 📝 Licencia

Este proyecto es privado y confidencial.

---

## 👥 Autores

- **Camilo Vega** - Desarrollo inicial

---

**¿Preguntas?** Abre un issue o contacta al equipo de desarrollo.

🎵 **Hecho con ❤️ para la Tuna**
