# Guía de Contribución 🤝

¡Bienvenido al equipo de **Archivatec**! Esta guía te ayudará a entender cómo trabajar en el proyecto de manera eficiente.

## 🛠️ Entorno de Desarrollo

1. **Bun**: Usamos Bun como runtime. Asegúrate de usar la versión más reciente (`bun upgrade`).
2. **Editor**: Recomendamos **VS Code** con las extensiones de *TypeScript*, *ESLint* y *Drizzle*.
3. **Base de Datos**: El proyecto usa **Supabase (PostgreSQL)** exclusivamente. Asegúrate de configurar la `DATABASE_URL` en tu archivo `.env` local apuntando a tu instancia de Supabase.

## 🏗️ Arquitectura

El proyecto sigue una estructura modular:
- **`src/modules`**: Contiene la lógica dividida por dominios (auth, expedientes, etc.). Cada módulo tiene sus propias rutas (`.routes.ts`) y lógica.
- **`src/infrastructure`**: Manejo de base de datos, esquemas de Drizzle y clientes externos.
- **`src/middleware`**: Middlewares globales (auth, logger, error handler).

## 📜 Flujo de Trabajo

1. **Rutas**: Define tus rutas en `src/modules/[modulo]/[modulo].routes.ts`.
2. **Validación**: Usa `Zod` para validar la entrada de las peticiones.
3. **Esquema**: Si necesitas cambiar la base de datos, edita `src/infrastructure/database/schema.ts` y corre `bun run db:generate`.
4. **Migraciones**: El esquema se inicializa automáticamente al arrancar el servidor mediante scripts idempotentes. Para cambios mayores, usa `supabase db push`.

## 🧪 Pruebas

Puedes ejecutar los tests con:
```bash
bun test
```

## 📝 Reglas de Estilo

- Usa **TypeScript** estricto.
- Prefiere `async/await` sobre Promesas.
- Nombra los archivos en `camelCase`.
- Documenta los endpoints importantes ( Swagger se genera automáticamente si sigues el patrón de Hono).

## 🚀 Despliegue

Para preparar el proyecto para producción:
1. Cambia `NODE_ENV` a `production` en el `.env`.
2. Asegúrate de configurar una `DATABASE_URL` real (PostgreSQL).
3. Ejecuta `bun run start`.

---
¡Gracias por ayudar a mejorar Archivatec!
