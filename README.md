# 🏛️ ArchivaTEC

[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

## ¿Qué es?

**ArchivaTEC** es un sistema de gestión de archivo documental para el **Instituto Tecnológico Superior de Escárcega (ITSE)**: control de cajas físicas, expedientes (de alumnos, personal y series administrativas), digitalización de documentos a PDF, préstamos con seguimiento de devolución, y control de acceso granular por rol (Administrador / Gestor de Archivos / Usuario de Consulta — ver detalle de permisos en [CONTEXT_FOR_AI.md](CONTEXT_FOR_AI.md#-modelo-de-seguridad-y-rbac-role-based-access-control)).

Es un **proyecto de equipo**, no personal — el repositorio es público, el backend corre en Vercel (`archivatec.vercel.app`) y la base de datos/storage es un proyecto de Supabase compartido. Antes de tocar nada, revisa la sección [🔄 Flujo de Trabajo en Equipo](#-flujo-de-trabajo-en-equipo) más abajo — hay reglas no obvias (quién mergea los PRs, cómo se aplican las migraciones) que rompen cosas si se ignoran.

## 🏗️ Stack y Arquitectura

```
Backend:  Bun (runtime) + Hono (framework HTTP) + TypeScript estricto
ORM:      Drizzle ORM → tablas de la app (src/infrastructure/database/schema.ts)
BD:       PostgreSQL vía Supabase (compartida por todo el equipo, dev y prod)
Auth:     JWT propio (bcryptjs) + Supabase Auth en paralelo (login social/externo)
Storage:  Supabase Storage (PDFs digitalizados)
Frontend: HTML/CSS/JS servido como estático desde public/
Deploy:   Vercel (serverless, api/index.ts como entrypoint)
```

Estructura de carpetas principales:
```
├── api/                    # Entrypoint serverless para Vercel
├── src/
│   ├── modules/            # Lógica por dominio (auth, expedientes, digitalizacion, usuarios...)
│   ├── infrastructure/     # Drizzle, cliente de Supabase Storage, DB
│   └── middleware/         # Auth, logger, manejo de errores
├── public/                 # Frontend estático (HTML/CSS/JS)
├── supabase/migrations/    # SQL de funciones RPC, RLS, triggers de Auth
└── .github/workflows/      # keep-alive de Supabase, etc.
```

Para el detalle de cada capa, permisos RBAC, endpoints y reglas de desarrollo frontend, consulta **[CONTEXT_FOR_AI.md](CONTEXT_FOR_AI.md)** (pensado para que cualquier IA o dev nuevo tenga contexto completo sin depender de nadie) y **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## 🚀 Cómo correr el proyecto en 3 pasos

### Paso 1: Instalar Bun
Este proyecto utiliza **Bun** por su velocidad. Si no lo tienes instalado, abre una consola (PowerShell en Windows) y ejecuta:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

*(En Mac/Linux puedes instalarlo con `curl -fsSL https://bun.sh/install | bash`)*.

---

### Paso 2: Instalar Dependencias y Configurar el .env
Clona el proyecto, abre tu terminal en la carpeta raíz y ejecuta:

1. Instalar las librerías:
   ```bash
   bun install
   ```

2. Crear tu archivo de configuración:
   ```bash
   copy .env.example .env
   ```
   *(Si estás en Mac/Linux usa: `cp .env.example .env`)*.

> 💡 **Nota**: Pide las credenciales de Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`) y el `DATABASE_URL` a un miembro del equipo por un canal seguro (no por chat público) y pégalas en tu `.env` local. Nunca las subas al repositorio.

---

### Paso 3: Iniciar el Servidor
Ejecuta el siguiente comando para levantar el servidor y compilar el frontend:

```bash
bun run dev
```

¡Listo! Abre tu navegador favorito y accede a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Usuarios de Ejemplo para Pruebas (RBAC)

Al iniciar el sistema por primera vez, la base de datos se inicializa automáticamente con los siguientes usuarios de demostración física para que puedas interactuar con los distintos niveles de permisos granulares:

| Usuario para el Login | Nombre del Encargado | Rol Asignado | Contraseña | ¿Qué puede hacer en el sistema? |
| :--- | :--- | :--- | :--- | :--- |
| **`admin`** | Administrador del Sistema | **Administrador** | **`Admin@1234!`** | Control absoluto. Acceso a la pestaña "Administración de Usuarios". |
| **`jgarcia`** | Jesús García López | **Administrador** | **`Password@123`** | Control absoluto. Acceso a la pestaña "Administración de Usuarios". |
| **`rmendez`** | Rosa Méndez Juárez | **Gestor de Archivos** | **`Password@123`** | Puede subir y modificar archivos en el sistema. |
| **`aperez`** | Ana Pérez Castillo | **Usuario de Consulta** | **`Password@123`** | **Solo lectura**. Únicamente puede consultar y visualizar expedientes. |
| **`chernandez`** | Carlos Hernández Ruiz | **Gestor de Archivos** | **`Password@123`** | Puede subir y modificar archivos en el sistema. |

---

## 📖 Documentación de la API
Si deseas revisar o testear los endpoints y la API de Hono de forma interactiva (Swagger UI), ingresa a:
👉 **[http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)**

---

## 🔄 Flujo de Trabajo en Equipo

### Ramas y Pull Requests
- Nunca se hace commit directo a `main`. Cada cambio va en su propia rama (`fix/...`, `feat/...`, `chore/...`, `docs/...`) y se sube mediante un Pull Request.
- **Los PRs los mergea `samithomalca`.** Origen de la regla: Vercel (plan Hobby) bloquea los deployments cuando el autor del commit no es miembro del team de Vercel del proyecto, en un repositorio privado. El repo ya se hizo público (lo que en teoría permitiría que cualquier colaborador mergee sin ese bloqueo), pero por ahora mantenemos la convención por consistencia. Si el equipo decide relajarla, actualiza esta sección.

### Migraciones de Supabase
- Las migraciones SQL viven en `supabase/migrations/` (ver [supabase/README.md](supabase/README.md) para el detalle).
- **No hay CI que las aplique automáticamente** a la base de datos remota — hay que aplicarlas a mano después de mergear el PR, vía el SQL Editor del dashboard de Supabase, o pidiéndole a Claude que las aplique directo si tiene acceso MCP al proyecto.

### Credenciales
- **Nunca** hardcodees valores reales en `.env.example` — solo placeholders. Las credenciales reales se piden a un miembro del equipo por un canal seguro (no por chat público).
- Si una credencial llega a filtrarse, rótala/deshabilítala de inmediato en Supabase (o el servicio correspondiente) y notifica al equipo.

### Mantenimiento automatizado
- `.github/workflows/keep_alive.yml` hace ping diario a Supabase para evitar que el proyecto (plan Free) se pause por 7 días de inactividad.

---
¡A programar! 💻🚀
