# 🏛️ ArchivaTEC — Guía de Inicio Rápido

¡Bienvenido al repositorio de **ArchivaTEC**! Esta guía te permitirá poner a funcionar el sistema en tu máquina local en menos de 3 minutos. El sistema requiere una conexión a **Postgres** (vía `DATABASE_URL`) — normalmente el Supabase compartido del equipo; pide las credenciales como se indica en el Paso 2.

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
