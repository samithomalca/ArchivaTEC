# 🏛️ Archivatec — Guía de Contexto Técnico para IAs Asistentes

Este archivo sirve como fuente de verdad técnica y de contexto global para cualquier Inteligencia Artificial Asistente que colabore en el desarrollo de **Archivatec**. Consúltalo antes de realizar cualquier refactorización, creación de módulos o cambios en el esquema.

---

## 🧭 Visión General del Proyecto
**Archivatec** es una plataforma web para la digitalización, control de inventario de cajas, expedientes y préstamos documentales del **Instituto Tecnológico Superior de Escárcega (ITSE)**. 

### Identidad Visual y UI
- **Paleta de Colores Institucional**: El color primario es el **Guinda/Vino (#800020)**. Utiliza acentos suaves, grises profesionales y toques de naranja institucionales.
- **Tipografía**: Fuente técnica pequeña, compacta y profesional usando `Inter`.
- **Aesthetics**: Diseño premium, moderno (micro-animaciones, efectos hover no invasivos, glassmorphic tooltips en áreas clave).
- **Consistencia**: Todos los modales de interacción destructiva o confirmación crítica deben usar el diseño institucional de modales implementado en `app.js` (`openModal`), evitando los `alert()` o `confirm()` nativos del navegador.

---

## 🗄️ Arquitectura del Backend e Infraestructura

El backend está desarrollado sobre **Bun** y **Hono** en una arquitectura de capas bien definida:
1. **Rutas e Inyección (`src/api`)**: Define los endpoints Http y middlewares.
2. **Servicios (`src/application`)**: Contiene la lógica de negocio pura.
### Persistencia e Infraestructura (`src/infrastructure`)
   - ORM: **Drizzle ORM**
   - Driver BD: **Postgres-js** (conectando exclusivamente a Supabase PostgreSQL).
   - Migraciones: Controladas por **Drizzle Kit** (tablas de la app) y por **archivos SQL en `supabase/migrations/`** (funciones RPC, RLS, triggers de Auth — cosas propias de Supabase que Drizzle no modela).

### ⚠️ Base de Datos Única: Supabase
El sistema depende exclusivamente de una instancia de **Supabase** para todos los entornos (desarrollo y producción). 
1. **Configuración**: Asegúrate de tener configurado `DATABASE_URL` en tu archivo `.env` o en Vercel.
2. **PostgreSQL Estándar**: Se usa PostgreSQL real, permitiendo el uso de extensiones nativas (como `pgcrypto` para `gen_random_uuid()`).
3. **Idempotencia**: Los scripts de inicialización (`migrate.ts`) usan `IF NOT EXISTS` para ser ejecutados de forma segura en cada arranque.

---

## 🚨 Gotchas Operativos (leer antes de desplegar o tocar Supabase)

Estos tres puntos causaron horas de debugging real en este proyecto — no son teóricos:

1. **Vercel (plan Hobby) bloquea deployments si el autor del commit no es miembro del team de Vercel del proyecto, en repos privados.** El repo ya se hizo público para evitar esto, pero por convención del equipo **`samithomalca` sigue siendo quien mergea los PRs a `main`**. Si un deployment "no refleja" un cambio reciente, sospecha primero de esto antes de buscar bugs de código — revisa los checks del PR en GitHub.
2. **Las migraciones de `supabase/migrations/` NO se aplican solas.** El workflow de CI que lo hacía fue eliminado. Después de mergear un PR con una migración nueva, hay que aplicarla a mano (SQL Editor del dashboard de Supabase, o vía MCP si tienes acceso al proyecto) — de lo contrario el código puede referenciar una función/columna que todavía no existe en producción.
3. **Nunca hardcodees credenciales reales en `.env.example`.** Ya pasó una vez: una `service_role key` real quedó en ese archivo, se filtró por completo al hacer público el repo, y hubo que rotarla/deshabilitarla de emergencia en Supabase. `.env.example` solo lleva placeholders — las credenciales reales se piden a un miembro del equipo por canal seguro.

---

## 🔐 Modelo de Seguridad y RBAC (Role-Based Access Control)

El sistema implementa seguridad granular tanto en el Frontend como en el Backend a través de 5 permisos booleanos e independientes:
1. `crearUsuarios`: Capacidad de administrar cuentas de usuarios, asignar roles y resetear contraseñas.
2. `subirArchivos`: Permiso para indexar y subir nuevos expedientes o digitalizaciones.
3. `modificarArchivos`: Permiso para actualizar metadatos o estados de los registros.
4. `eliminarArchivos`: Permiso para borrar expedientes o cajas del inventario.
5. `verOtrasDivisiones`: Filtro de visibilidad. Si es `false`, el usuario solo puede ver expedientes de su propio departamento/división. Si es `true`, tiene visibilidad global.

### Mapeo Predeterminado de Roles (`ROLES_PERMISOS`)
- **Administrador**: Todos los 5 permisos en `true`.
- **Gestor de Archivos**: `subirArchivos: true`, `modificarArchivos: true`, `verOtrasDivisiones: true`. Resto en `false`.
- **Usuario de Consulta**: `verOtrasDivisiones: true`. Resto en `false`.

### Integración en la Interfaz (Widget de Permisos Granulares)
- En la barra superior (`topbar-left`) junto al saludo de bienvenida, se renderiza un chip interactivo que muestra el Rol en uso.
- Al pasar el mouse por encima del chip, se activa un tooltip flotante premium que muestra el listado detallado de los 5 permisos específicos y su estado de activación actual en verde (Sí) o rojo (No).
- La pestaña **Administración de Usuarios** está protegida por un guardia en JS. Si un usuario sin `crearUsuarios` intenta entrar a través del inspector de elementos o por consola, la UI lo redirecciona automáticamente al Inicio de forma segura.

---

## 📡 Catálogo de Endpoints Principales (Módulo Auth & Usuarios)

### Autenticación
- `POST /api/v1/auth/login`: Inicia sesión, retorna el token JWT y el perfil de usuario.
- `GET /api/v1/auth/me`: Retorna los datos y permisos del usuario logueado usando el token.

### Administración de Usuarios (Exclusivos para usuarios con permiso `crearUsuarios` / ADMIN)
- `GET /api/v1/usuarios`: Lista todos los usuarios con su rol y permisos desglosados (normalizados para la tabla).
- `POST /api/v1/usuarios`: Registra un nuevo usuario con permisos personalizables.
- `PATCH /api/v1/usuarios/:id`: Actualiza el nombre, división, rol, permisos y **opcionalmente cambia la contraseña** del usuario si se suministra el campo `nuevaPassword` (hasheada de forma segura).
- `DELETE /api/v1/usuarios/:id`: Elimina la cuenta de usuario de la base de datos de manera definitiva.

---

## ⚡ Reglas para el Desarrollo de Frontend (`public/app.js` & `public/style.css`)

1. **Evita la duplicidad de flujos**:
   - No recrees tarjetas de creación de usuarios en el menú general. Todo el ciclo de vida de administración de usuarios (creación, edición y eliminación) debe residir dentro de la pestaña "Administración de Usuarios".
2. **Actualización Optimista del Caché Local**:
   - Para garantizar que la UI se sienta instantánea y premium, las llamadas de creación, edición y eliminación de usuarios deben actualizar primero la variable de caché local `_usuariosCache` y ejecutar la función de renderizado `renderUsuariosAdmin(_usuariosCache)` antes de requerir un recarga completa de la página. Esto también sirve como un excelente fallback funcional en caso de operar en modo offline/demo.
3. **Mapeo e Interacción Reactiva**:
   - En el modal de creación y edición, la selección del selector de Rol debe desencadenar automáticamente el autocompletado en los checkboxes de permisos mediante el mapa `ROLES_PERMISOS`, pero debe permitir siempre la edición granular por parte del administrador (los checkboxes individuales son la fuente de verdad al guardar).

---
¡Gracias por tu colaboración! Mantengamos el código limpio, ordenado y técnicamente impecable.
