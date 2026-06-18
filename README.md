# Expense Tracker & Analytics Dashboard

An interactive, high-fidelity expense tracking and analytics dashboard. This application provides real-time financial metrics, visual trend analysis, interactive charts, and automated insights from uploaded transaction files.

---

## 🚀 Key Features

### 1. Interactive Dashboard
* **Dynamic Calendar Heatmap**: Displays daily spending intensity mapped to color-scaled blocks relative to the month's peak spending. Hovering displays tooltips (responsive overflow-safe) and clicking any day opens a details modal showing all transactions for that date.
* **Category Breakdown Donut Chart**: Hover-interactive Recharts donut chart with a centered total spending label and custom slim-scroll legends.
* **Key KPI Cards**: Real-time cards tracking Monthly Total, Daily Average, Peak Spending Day, and transaction count.

### 2. Deep Financial Analytics Insights
* **Weekly Spending Comparison**: Visual Recharts bar graph displaying cumulative weekly totals using a teal linear gradient and minimal axes design.
* **Weekday vs. Weekend Dynamics**: Side-by-side transaction count, total spend, and average transaction value comparisons.
* **Transaction Size Distribution**: Progress meters grouping transactions into Micro/Small (< ₹250), Medium (₹250 - ₹1000), and Large (> ₹1000) spending brackets.
* **Automated Smart Insights**: Custom calculations detecting spending spikes, highest category totals, transaction frequency count, and month-half volume trends (increasing/decreasing warnings).

### 3. Expense Management & Security
* **Transaction Table**: Filterable and searchable expense table with responsive category indicators.
* **Easy Upload**: Dropzone file upload parsing CSV/Excel spreadsheets with auto-category detection.
* **Security Controls**: Secure transaction deletion requiring a matching password comparison verifying against SHA-256 hash representation of `3684#Monitor`.

### 4. Visual Design System
* **Premium Theme toggling**: Seamless Light Mode (`rgb(242, 252, 250)` soft pastel teal backdrop) and Dark Mode (`#000000` pitch black background with dark navy glassmorphic card backdrops and soft border glows).
* **Responsive Layout**: Navigation bar wraps into a responsive mobile hamburger-menu panel; scrollbars are styled globally; charts scale down seamlessly.

---

## 🛠️ Technology Stack

| Component | Tech / Library | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 / Next.js 14 | App Router structure |
| **Styling** | TailwindCSS / PostCSS | Premium typography (Inter) & animations |
| **Visual Charts** | Recharts | SVG gradients, custom tooltips |
| **Icons** | Lucide React | Minimalist navigation & indicator set |
| **Backend API** | Node.js / Express | REST API controllers & services |
| **Database** | MongoDB / Mongoose | Models for Expense transactions & Monthly Summaries |
| **Parsing Engine** | Multer / csv-parser / xlsx | File parsing utilities |

---

## 📁 Directory Structure

```
expense-dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route controllers (expense, analytics, etc.)
│   │   ├── models/           # Mongoose Database schemas
│   │   ├── routes/           # Express router endpoints
│   │   ├── services/         # Calculation & analytical services
│   │   ├── utils/            # CSV/Excel parsers & category detectors
│   │   └── app.ts            # Entrypoint file
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/                  # Next.js App Router pages (analytics, dashboard, etc.)
│   ├── components/           # UI kits & visual charts components
│   ├── hooks/                # Custom React query/fetch state hooks
│   ├── services/             # Axios API client wrapper
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Setup & Local Running

### Prerequisite
* [Node.js](https://nodejs.org/) (v18+)
* [MongoDB](https://www.mongodb.com/) (running instance or cloud URI)

### Local Development Setup

#### 1. Backend Server Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the backend root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/expense-tracker
   ```
4. Run in development mode (using nodemon):
   ```bash
   npm run dev
   ```

#### 2. Frontend Next.js Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the frontend root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
4. Start the next dev hot-reload server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` inside your browser.

---

## 🐳 Docker Deployment

To spin up the entire application stack (Frontend, Backend, and MongoDB database) in a unified environment:

1. Build and boot up all containerized pods:
   ```bash
   docker-compose up --build
   ```
2. Once starting completes:
   * Access the Frontend Dashboard on: `http://localhost:3000`
   * Access Backend API endpoints on: `http://localhost:5000/api`
