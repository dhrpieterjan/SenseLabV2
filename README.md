# SenseLab

A Next.js 16 application with TypeScript, Kysely ORM for MSSQL, and Tailwind CSS.

## Project Structure

```
senselab/
├── src/
│   ├── app/              # Next.js routes (App Router)
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   ├── actions/          # Server actions
│   ├── lib/              # Library setup
│   │   ├── db.ts         # Kysely database configuration
│   │   └── types.ts      # Database type definitions
│   └── services/         # Database query logic
├── .env.local            # Environment variables (not in git)
├── .env.example          # Environment variables template
└── package.json
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database ORM**: Kysely
- **Database**: Microsoft SQL Server
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Code Quality**: ESLint + Prettier

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your MSSQL credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=1433
DATABASE_NAME=your_database_name
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_ENCRYPT=true
DATABASE_TRUST_SERVER_CERTIFICATE=false
```

**Note**: For local development, you may need to set `DATABASE_TRUST_SERVER_CERTIFICATE=true`

### 3. Define Your Database Schema

Update the `Database` interface in `src/lib/db.ts` to match your database schema:

```typescript
export interface Database {
  users: {
    id: number;
    name: string;
    email: string;
    created_at: Date;
  };
  // Add more tables here
}
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Development Workflow

### Architecture Pattern

This project follows a layered architecture:

1. **Components** (`src/components/`) - UI components (Client or Server Components)
2. **Server Actions** (`src/actions/`) - Handle form submissions and mutations
3. **Services** (`src/services/`) - Business logic and database operations
4. **Database** (`src/lib/`) - Database configuration and type definitions

### Example Flow

```
Component → Server Action → Service → Database
```

### Creating a New Feature

1. **Define your database schema** in `src/lib/db.ts`
2. **Create a service** in `src/services/` with database query logic
3. **Create server actions** in `src/actions/` that call your service
4. **Create components** in `src/components/` that use your server actions
5. **Create routes** in `src/app/` that use your components

### Example: Users Feature

```typescript
// 1. Define schema in src/lib/db.ts
export interface Database {
  users: {
    id: number;
    name: string;
    email: string;
  };
}

// 2. Create service in src/services/users.service.ts
export async function getAllUsers() {
  return await db.selectFrom('users').selectAll().execute();
}

// 3. Create action in src/actions/users.actions.ts
('use server');
export async function getUsersAction() {
  return await getAllUsers();
}

// 4. Create component in src/components/users-list.tsx
('use client');
export function UsersList() {
  // Use getUsersAction()
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Database Queries with Kysely

Kysely provides type-safe database queries:

```typescript
// Select
const users = await db.selectFrom('users').selectAll().execute();

// Insert
await db.insertInto('users').values({ name: 'John', email: 'john@example.com' }).execute();

// Update
await db.updateTable('users').set({ name: 'Jane' }).where('id', '=', 1).execute();

// Delete
await db.deleteFrom('users').where('id', '=', 1).execute();
```

## Deployment

This project is configured for easy deployment to Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Note**: When deploying to Vercel, replace `.env.local` usage with Vercel environment variables.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Kysely Documentation](https://kysely.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zod Documentation](https://zod.dev)

## License

MIT
