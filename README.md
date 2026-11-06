# SQP Queue

A web-based queuing management system designed for amusement parks and attractions. SQP Queue aims to simplify visitor queue management, improve operational efficiency, and provide a better queuing experience through a centralized digital platform.

---

## Tech Stack

- **Frontend:** Next.js, TypeScript
- **Backend:** Node.js, Express.js, TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Infrastructure & Tools:** Docker, pgAdmin 4, npm Workspaces

---

## Project Structure

```text
sqp-queue/
│
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express.js backend
│       ├── prisma/
│       │   ├── migrations/
│       │   └── schema.prisma
│       ├── src/
│       │   ├── app.ts
│       │   └── server.ts
│       ├── prisma.config.ts
│
├── packages/                # Shared packages
├── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

Before getting started, make sure you have installed:
- **Node.js** (v22 recommended)
- **npm**
- **PostgreSQL** (v18 recommended)
- **Docker Desktop** (optional)
- **Git**

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/looopsicle/sqp-queue.git
cd sqp-queue
```

### 2. Install Dependencies

Install all workspace dependencies from the project root:

```bash
npm install
```

### 3. Configure Environment Variables

Create environment files from the provided examples.

**Root environment:**
```bash
cp .env.example .env
```

**API environment:**
```bash
cp apps/api/.env.example apps/api/.env
```

**Web environment:**
```bash
cp apps/web/.env.example apps/web/.env.local
```

> **Note:** On Windows CMD, use `copy` instead of `cp`.

Update the environment variables according to your local configuration.

### 4. Set Up PostgreSQL

1. Make sure your PostgreSQL server is running.
2. Create the application database:

```sql
CREATE DATABASE sqp_queue;
```

3. Configure the database connection in `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sqp_queue?schema=public"
```

### 5. Set Up Prisma

Generate the Prisma Client:

```bash
npm run generate --workspace=@app/api
```

Apply database migrations:

```bash
npx prisma migrate dev --workspace=@app/api --name init
```

> **Note:** Run migrations after the Prisma schema and initial database models have been prepared.

### 6. Run pgAdmin (Optional)

pgAdmin is used to manage and inspect the PostgreSQL database through a web interface.

Start pgAdmin using Docker:

```bash
docker compose up -d pgadmin
```

Access the dashboard at `http://localhost:5050` and configure the PostgreSQL connection using:
- **Host:** `host.docker.internal`
- **Port:** `5432`
- **Maintenance Database:** `postgres`
- **Username:** Your PostgreSQL username
- **Password:** Your PostgreSQL password

### 7. Run the Development Environment

Start both frontend and backend from the project root:

```bash
npm run dev
```

Or run them independently:

- **Frontend:** `npm run dev:web`
- **Backend:** `npm run dev:api`

---

## Development URLs

| Service | URL |
| :--- | :--- |
| **Frontend** | `http://localhost:3000` |
| **Backend API** | `http://localhost:4000` |
| **API Health Check** | `http://localhost:4000/api/health` |
| **pgAdmin** | `http://localhost:5050` |

---

## Available Scripts

Run these commands from the project root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start frontend and backend |
| `npm run dev:web` | Start frontend only |
| `npm run dev:api` | Start backend only |
| `npm run build` | Build all workspaces |
| `npm run typecheck` | Type-check all workspaces |

---

## Database Management

SQP Queue uses PostgreSQL as its primary database and Prisma ORM for database access and migrations.

Useful Prisma commands (run from `apps/api`):

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply a migration
npx prisma migrate dev --name migration_name

# Check database status
npx prisma migrate status

# Open Prisma Studio
npx prisma studio
```

**Important Guidelines:**
- Commit all migration files to Git.
- Do not commit `.env` files.
- Do not commit generated Prisma Client files.
- Keep database schema changes synchronized across the team.

---

## Team Development Guidelines

To maintain consistency across the development team:
1. Pull the latest changes before starting development.
2. Install dependencies after pulling changes when necessary.
3. Never commit environment files or sensitive credentials.
4. Always commit Prisma migrations when modifying the database schema.
5. Use consistent TypeScript conventions.
6. Test your changes before creating a pull request.

---

## License

This project is currently under development.