# 🏛️ ArchivaTEC — Guía de Inicio Rápido

¡Bienvenido al repositorio de **ArchivaTEC**! Esta guía te permitirá poner a funcionar el sistema en tu máquina local en menos de 3 minutos. El sistema utiliza una base de datos local embebida, por lo que **no necesitas instalar bases de datos externas** (Postgres/MySQL) para probarlo.

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
¡A programar! 💻🚀
