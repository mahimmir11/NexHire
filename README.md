# NexHire — Internship & Placement Management System

NexHire is a full-stack Internship & Placement Management System engineered with a clean architectural separation between frontend, backend, and the database persistence layer.

---

## 🎯 Step 1: Foundation Overview

In **Step 1: Foundation Only**, the core infrastructure, build pipelines, ORM integration, environment architecture, and cross-tier health checks are established without introducing premature domain business logic or mock data.

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MySQL 8.0 (Database name: `nexhire`)
- **ORM**: Prisma ORM
- **Version Control**: Git (`.gitignore` configured for monorepo)

---

## 📁 Project Directory Structure

```text
NexHire/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── App.tsx             # System Foundation Verification Dashboard
│   │   ├── main.tsx            # React DOM Entrypoint
│   │   └── index.css           # Tailwind CSS directives & typography tokens
│   ├── index.html              # HTML shell & font definitions
│   ├── vite.config.ts          # Vite configuration with @tailwindcss/vite
│   ├── tsconfig.json           # Frontend TypeScript configuration
│   └── package.json            # Frontend scripts & dependencies
├── server/                     # Backend API Application
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts          # Typed environment loader & validator
│   │   │   └── database.ts     # PrismaClient singleton & DB health check
│   │   ├── controllers/
│   │   │   └── health.controller.ts  # GET /api/health handler
│   │   ├── routes/
│   │   │   ├── health.routes.ts      # Health routes
│   │   │   └── index.ts              # Central API router
│   │   ├── middlewares/
│   │   │   ├── errorHandler.ts       # Central error & 404 handler
│   │   │   └── requestLogger.ts      # HTTP request logging middleware
│   │   ├── scripts/
│   │   │   └── testDb.ts             # Standalone DB connection tester
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # Server bootstrap & startup verification
│   ├── tsconfig.json           # Server TypeScript configuration
│   └── package.json            # Backend scripts & dependencies
├── prisma/
│   └── schema.prisma           # Prisma MySQL datasource & foundation schema
├── .env                        # Local environment variables (Gitignored)
├── .env.example                # Template with required variables
├── .gitignore                  # Monorepo ignore rules
├── package.json                # Root orchestration scripts
└── README.md                   # This documentation
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root directory (and/or `server/.env`):

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express backend server |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `DATABASE_URL` | `mysql://root:YOUR_PASSWORD@localhost:3306/nexhire` | MySQL connection string for Prisma |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for frontend |

> [!NOTE]
> Replace `YOUR_PASSWORD` in `DATABASE_URL` with your local MySQL password.

---

## 🚀 Running the Project

### Option A: Run Both Concurrently (Recommended from Root)

From the `NexHire/` root directory:

```bash
# 1. Install dependencies
npm install

# 2. Run both Backend & Frontend in parallel
npm run dev
```

* **Frontend**: Accessible at [http://localhost:5173](http://localhost:5173)
* **Backend**: Accessible at [http://localhost:5000](http://localhost:5000)

---

### Option B: Run Services Independently

#### 1. Backend Server Only (`server/`)

```bash
cd server
npm install

# Run backend development server with hot-reload
npm run dev

# Run TypeScript build check
npm run build

# Test database connection
npm run test:db
```

#### 2. Frontend Client Only (`client/`)

```bash
cd client
npm install

# Run Vite dev server
npm run dev

# Run TypeScript build check & bundle
npm run build
```

---

## 🩺 Health Check Verification

The backend exposes an automated diagnostic endpoint:

```http
GET /api/health
```

### Response Example:

```json
{
  "status": "healthy",
  "message": "NexHire backend API is running successfully",
  "timestamp": "2026-09-23T18:07:08.468Z",
  "uptime": 16,
  "service": "NexHire API",
  "database": {
    "connected": true,
    "provider": "mysql",
    "databaseName": "nexhire"
  }
}
```

---

## 🗄️ Database Setup with Prisma

Once `DATABASE_URL` is set in your `.env` file:

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to MySQL database (creates nexhire database if not exists)
npm run prisma:push

# Verify database connection
npm run test:db
```
