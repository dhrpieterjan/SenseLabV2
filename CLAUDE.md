# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SenseLab is a Next.js 16 application using TypeScript, Kysely ORM for MSSQL database operations, and Tailwind CSS v4. It uses the App Router architecture with a strict layered pattern.

## Commands

### Development

- `npm run dev` - Start Next.js development server on port 3000
- `npm run build` - Build production bundle
- `npm start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint checks
- `npm run format` - Auto-format all files with Prettier
- `npm run format:check` - Check formatting without making changes

## Architecture & Code Organization

### Layered Architecture Pattern

The codebase follows a strict unidirectional data flow:

```
Component → Server Action → Service → Database
```

Each layer has specific responsibilities:

1. **Database Layer** ([src/lib/](src/lib/))
   - [db.ts](src/lib/db.ts): Kysely database instance and `Database` interface defining schema
   - [types.ts](src/lib/types.ts): Type helpers using Kysely's `Selectable`, `Insertable`, `Updateable`
   - All database schema changes MUST be reflected in the `Database` interface

2. **Service Layer** ([src/services/](src/services/))
   - Contains all database query logic using Kysely
   - Returns structured responses: `{ success: boolean, data?: T, error?: string }`
   - NO business logic or validation here - pure database operations
   - Import `db` from `@/lib/db`

3. **Server Actions Layer** ([src/actions/](src/actions/))
   - Files MUST start with `'use server'` directive
   - Handle form submissions and mutations
   - Validate input using Zod schemas
   - Call service functions
   - Return structured responses to client

4. **Component Layer** ([src/components/](src/components/))
   - Client or Server Components
   - Server Components for direct data fetching (call services directly)
   - Client Components use Server Actions for mutations

5. **App Router** ([src/app/](src/app/))
   - Next.js App Router structure
   - [layout.tsx](src/app/layout.tsx): Root layout
   - [page.tsx](src/app/page.tsx): Route pages

### Path Aliases

- `@/*` maps to `src/*` for imports

### Environment Configuration

Environment variables are stored in `.env.local` (not committed). Use [.env.example](.env.example) as template:

- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- `DATABASE_ENCRYPT` (true for Azure SQL)
- `DATABASE_TRUST_SERVER_CERTIFICATE` (set true for local dev)

## Database Operations with Kysely

### Schema Definition

Always update the `Database` interface in [src/lib/db.ts](src/lib/db.ts) first when adding/modifying tables.

### Type-Safe Queries

Kysely provides compile-time type checking for all queries:

```typescript
// Select
await db.selectFrom('table_name').selectAll().execute();

// Insert with returning
await db.insertInto('table_name').values(data).returningAll().executeTakeFirst();

// Update
await db.updateTable('table_name').set(data).where('id', '=', id).execute();

// Delete
await db.deleteFrom('table_name').where('id', '=', id).execute();
```

Use `.executeTakeFirst()` for single row results, `.execute()` for multiple rows.

## Adding New Features

When implementing a new feature (e.g., "posts"):

1. Define schema in [src/lib/db.ts](src/lib/db.ts) `Database` interface
2. Create type helpers in [src/lib/types.ts](src/lib/types.ts) using Kysely's `Selectable`/`Insertable`/`Updateable`
3. Create service file `src/services/posts.service.ts` with database operations
4. Create actions file `src/actions/posts.actions.ts` with `'use server'` directive and Zod validation
5. Create components in `src/components/` that use the actions
6. Create routes in `src/app/` using the components

## Key Technical Details

- **MSSQL Connection**: Uses Tedious driver through Kysely's MssqlDialect
- **Connection Pooling**: Configured in [src/lib/db.ts](src/lib/db.ts) with min: 0, max: 10
- **TypeScript**: Strict mode enabled, target ES2017
- **Query Logging**: Uncomment the `log` option in [src/lib/db.ts](src/lib/db.ts) to debug SQL queries
