# Expense Analytics Dashboard

<div align="center">

A **premium, full-stack expense tracking and analytics platform** with a dark-glassmorphic UI, interactive charts, real-time filtering, intelligent category auto-detection, and secure CRUD operations.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## Screenshots

### Dashboard
![Dashboard](assets/screenshots/dashboard.png)

### Expenses
![Expenses](assets/screenshots/expenses.png)

### Analytics
![Analytics](assets/screenshots/analytics.png)

### Upload
![Upload](assets/screenshots/upload.png)

### Export
![Export](assets/screenshots/export.png)

---

## Key Features

### Dashboard
- **Monthly Heatmap Calendar** – Day-aligned calendar grid showing spending intensity via color-scaled blocks. Hover for detailed tooltips; click any day to view all transactions for that date.
- **Category Breakdown Donut Chart** – [Recharts](https://recharts.org/) SVG donut with centered totals and slim-scroll custom legends.
- **KPI Cards** – Real-time cards tracking Monthly Total, Daily Average, Peak Spending Day, and transaction count.

### Analytics
- **Weekly Spending Bars** – Cumulative weekly totals rendered as gradient bar charts.
- **Weekday vs. Weekend Dynamics** – Side-by-side breakdowns of transaction count, total spend, and average transaction value.
- **Transaction Size Distribution** – Progress-meter groupings: Micro/Small (< ₹250), Medium (₹250–₹1000), Large (> ₹1000).
- **Automated Smart Insights** – Auto-detected spending spikes, top category totals, frequency counts, and month-half volume trend indicators.

### Expenses
- **Filterable & Sortable Table** – Filter by category, month, and full-text search. Multi-key sort (Date/Day, Amount, Description) with explicit order labels (Newest First / Oldest First, Highest First / Lowest First, A–Z / Z–A).
- **Quick View Insights Bar** – Live stat cards (Visible Spend Total, Visible Average, Top Category, Top Single Expense) that update with the current page view.
- **Expense Detail Page** – Full-screen expense card with similar expense list grouped by date.
- **Add / Edit / Delete** – Full CRUD with dialogs rendered at the page root (outside any CSS containing-block context), password-protected deletion with SHA-256 verification.
- **Global Floating Action Button (FAB)** – Rendered in the root layout, available on both mobile and desktop, bypasses any `backdrop-filter` containing-block issues.

### Upload
- **Drag-and-Drop Dropzone** – Accepts CSV and Excel (.xlsx, .xls) files.
- **Auto-Category Detection** – Server-side rule engine classifies transactions by keyword matching (Breakfast, Lunch, Dinner, Groceries, Transport, Shopping, Drinks, Others).
- **PDF Preview** – Mobile-friendly embedded PDF viewer for uploaded statements.

### Export
- Downloadable expense reports as filtered PDF exports with statement period and category filters.

### Design System
- **Dark Mode Glassmorphism** – Pitch-black (`#000000`) background with semi-transparent navy card backdrops and soft border glows.
- **Light Mode** – Soft pastel teal backdrop (`hsl(168, 63%, 97%)`).
- **Premium Typography** – [Google Fonts Inter](https://fonts.google.com/specimen/Inter) with consistent heading hierarchy across all pages.
- **Micro-animations** – Page-level fade-in, hover scale, and smooth dialog zoom transitions.
- **FAB** – Teal-to-indigo gradient pill button with rotating `+` icon on hover.
- **Dark Mode Selects** – Global CSS override ensures `<select>` / `<option>` elements use solid slate-900 backgrounds in dark mode for legibility across all browsers.

---

## Built With

<div align="center">

| | Technology | Role |
|:---:|:---|:---|
| [![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/) | **Next.js 14** | Frontend framework with App Router & React Server Components |
| [![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/) | **React 18** | UI component model with hooks |
| [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) | **TypeScript 5** | End-to-end static typing (frontend & backend) |
| [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) | **TailwindCSS 3** | Utility-first styling with custom design tokens |
| [![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/) | **Node.js v18+** | JavaScript runtime for the backend |
| [![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/) | **Express 4** | REST API server with typed controllers |
| [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/) | **MongoDB + Mongoose 8** | NoSQL database with typed schema models |
| [![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/) | **Docker Compose** | Full-stack containerized deployment |
| [![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://recharts.org/) | **Recharts 2** | SVG charts with gradients and custom tooltips |
| [![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)](https://axios-http.com/) | **Axios** | HTTP client for API communication |
| [![Lucide](https://img.shields.io/badge/Lucide-f67373?style=flat-square&logo=lucide&logoColor=white)](https://lucide.dev/) | **Lucide React** | Unified icon library |
| [![Google Fonts](https://img.shields.io/badge/Inter_Font-4285F4?style=flat-square&logo=google&logoColor=white)](https://fonts.google.com/specimen/Inter) | **Inter** | Premium Google Font via `next/font` |
| [![Multer](https://img.shields.io/badge/Multer-cb3837?style=flat-square&logo=npm&logoColor=white)](https://github.com/expressjs/multer) | **Multer + xlsx + csv-parser** | File upload and multi-format parsing |

</div>

---

## Directory Structure

```
expense-dashboard/
├── backend/
│   ├── src/
│   │   ├── app.ts                    # Express app entrypoint, CORS, middleware
│   │   ├── controllers/
│   │   │   ├── expenseController.ts  # CRUD for expenses, search, pagination
│   │   │   ├── analyticsController.ts
│   │   │   └── uploadController.ts   # File parse + category auto-detect
│   │   ├── middleware/
│   │   │   └── auth.ts               # Password hash verification (SHA-256)
│   │   ├── models/
│   │   │   ├── Expense.ts            # Mongoose schema: day, amount, reason, category, month
│   │   │   └── MonthlySummary.ts
│   │   ├── routes/
│   │   │   ├── expenses.ts
│   │   │   ├── analytics.ts
│   │   │   └── upload.ts
│   │   ├── services/
│   │   │   └── analyticsService.ts   # Aggregation pipelines, smart insight logic
│   │   └── utils/
│   │       ├── csvParser.ts
│   │       ├── xlsxParser.ts
│   │       └── categoryDetector.ts   # Keyword-based auto-categorization
│   ├── .env                          # PORT, MONGO_URI
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout: Navigation + FAB + ShutdownWatcher
│   │   ├── globals.css               # Design tokens, scrollbar, dark mode overrides
│   │   ├── page.tsx                  # Redirect → /dashboard
│   │   ├── dashboard/page.tsx        # Heatmap + KPI cards + Donut chart
│   │   ├── expenses/
│   │   │   ├── page.tsx              # Expense table, filters, CRUD dialogs (page-root rendered)
│   │   │   └── [id]/page.tsx         # Expense detail + similar expenses
│   │   ├── analytics/page.tsx        # Weekly bars, weekday/weekend, smart insights
│   │   ├── upload/page.tsx           # File upload dropzone + PDF preview
│   │   └── export/page.tsx           # PDF export with filters
│   │
│   ├── components/
│   │   ├── navigation.tsx            # Responsive nav bar with dark/light toggle
│   │   ├── desktop-fab.tsx           # Global FAB button + AddExpenseDialog (layout-level)
│   │   ├── charts/monthly-heatmap.tsx # Calendar-aligned weekday heatmap with tooltips
│   │   └── expenses/
│   │       ├── expense-table.tsx     # Table with pagination; fires onEdit/onDeleteRequest
│   │       ├── expense-filters.tsx   # Search, category, month, sort filters
│   │       ├── add-expense-dialog.tsx
│   │       └── edit-expense-dialog.tsx
│   │
│   ├── hooks/
│   │   ├── useExpenses.ts            # Paginated expense fetching + expense-added event listener
│   │   └── useDashboard.ts           # Dashboard summary data fetching
│   │
│   ├── services/api.ts               # Axios instance (NEXT_PUBLIC_API_URL)
│   └── types/                        # Shared TypeScript interfaces
│
├── assets/screenshots/               # App page screenshots
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml                # Orchestrates frontend + backend + MongoDB
└── README.md
```

---

## Architecture Notes

### Dialog Positioning
All modal dialogs (`AddExpenseDialog`, `EditExpenseDialog`, delete confirmation) are rendered **at the page root level** — outside `ExpenseTable`'s `overflow-hidden` card — to avoid CSS containing-block issues from `backdrop-filter`. Dialog panels use `style={{ backdropFilter: 'none' }}` and `z-[200]` to float above all other layers.

### Custom Event Bus
The global FAB dispatches a `window` custom event `expense-added` on success. Both `useExpenses` and `useDashboard` hooks subscribe to this event, enabling cross-component data refresh without prop drilling.

### Search Regex Safety
The backend escapes all special regex characters from the search query before building the MongoDB `$regex` filter, preventing crashes for inputs containing `(`, `)`, `[`, `]`, etc.

### Security
Expense deletion requires a password via the `x-delete-password` HTTP header. The backend compares the SHA-256 hash of the submitted password against the stored hash before authorizing.

---

## Setup & Local Development

### Prerequisites

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-local_or_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-tracker
```

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
# Open http://localhost:3000
```

---

## Docker Deployment

[![Docker](https://img.shields.io/badge/Docker_Compose-one_command_deploy-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

Spin up the full stack (Frontend + Backend + MongoDB) with a single command:

```bash
docker-compose up --build
```

| Service | URL |
|:---|:---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| MongoDB | mongodb://localhost:27017 |
