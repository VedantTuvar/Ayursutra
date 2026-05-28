# AyurSutra 🌿

AyurSutra is a complete, production-ready, fully working **Panchakarma Patient Management & Therapy Scheduling SaaS platform** for Ayurvedic clinics. Built using Node.js/TypeScript on the backend and React/TypeScript/Vite/Tailwind CSS on the frontend.

---

## 🚀 Features

- **Patient Registration & Profiling:** Store comprehensive Ayurvedic clinical files including **Prakriti (Constitutional assessment)** & **Vikriti (Pathological assessment)** profiles.
- **Treatment Plans:** Custom multi-week doctor plan designer with sequential day-by-day planned therapies.
- **Intelligent Multi-Resource Conflict Detection Engine:** Custom overlap checking that locks patient, room, and therapist simultaneously (returning `409 Conflict` on overlap).
- **Session Notes & Vitals Logging:** Therapist daily sessions tracker with vital reports and automated clinical inventory oil usage logs.
- **Inventory & Alert System:** Multi-category tracking with low-stock alerts, auto-deduction, and transaction logging.
- **GST-Compliant Invoicing:** Auto-generates billing invoices from completed therapies with custom discount options and 18% standard GST breakdown, printable as high-quality PDF.
- **Role-Based Access Dashboard:** Multi-role dashboards supporting Clinics Admin, Doctors, Therapists, and Receptionists.
- **Real-Time Synchronization:** Live status updates driven by socket.io.

---

## 🛠️ Tech Stack

### Backend
- **Node.js 20 LTS** & **TypeScript 5**
- **Express.js** API Framework
- **Prisma 5 ORM** with **PostgreSQL**
- **Redis 7** & **BullMQ** for background job notifications and stock level verification scans
- **JSON Web Tokens (JWT)** with Redis rotation for authentications
- **bcrypt** for password hashing (cost factor 12)
- **Zod** request validation
- **Socket.io** real-time workspace updates
- **Winston** structured JSON logs
- **Nodemailer** SMTP notifications
- **pdfkit** for backend invoice PDF creation

### Frontend
- **React 18** & **Vite** & **TypeScript**
- **Zustand** client-side stores & **TanStack React Query v5** server-state manager
- **Tailwind CSS v3** visual styles
- **FullCalendar.js** React interactive grids
- **Recharts** reporting diagrams
- **Axios** with auth interceptors

---

## 📦 Directory Structure

```
ayursutra/
├── packages/
│   └── shared-types/           ← Shared enums, types, interfaces
├── apps/
│   ├── api/                    ← Express/Prisma/PostgreSQL backend API service
│   └── web/                    ← React/Vite/Tailwind CSS frontend client
├── docker-compose.yml          ← Postgres & Redis local images config
├── package.json                ← Monorepo workspace setup
└── README.md                   ← Project documentation
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** v20 LTS
- **Docker Desktop**
- **npm** (comes with Node)

### 2. Monorepo Setup
From the root workspace directory, install all package dependencies:
```bash
npm install
```

### 3. Spin up Infrastructure Containers
Start local PostgreSQL and Redis servers:
```bash
docker-compose up -d postgres redis
```

### 4. Database Schema Setup & Seeding
Apply database migrations and populate the demo clinical seed:
```bash
# Enter the API app directory
cd apps/api

# Run migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

### 5. Running Development Servers
To run both backend and frontend development servers concurrently from the root directory:
```bash
# Return to the monorepo root
cd ../..

# Run dev mode
npm run dev
```

The web application will be accessible at: **`http://localhost:5173`**
The backend API server runs at: **`http://localhost:3001`**
API Interactive Swagger UI Docs: **`http://localhost:3001/api/docs`**

---

## 🔐 Demo Credentials

Use these credentials to log in and test different user workflows immediately:

| Role | Name | Email | Password |
|---|---|---|---|
| **Clinic Admin** | Admin User | `admin@demo.com` | `Password123!` |
| **Doctor** | Dr. Meera Sharma | `doctor@demo.com` | `Password123!` |
| **Therapist** | Lakshmi Therapist | `therapist@demo.com` | `Password123!` |
| **Receptionist** | Ramesh Reception | `reception@demo.com` | `Password123!` |

---

## 🧪 Testing

To run the full test suite (unit and integration tests) for the API:
```bash
cd apps/api
npm run test
```
