# 🚀 Action Flow — Developer Productivity Assistant

> **Metrics → Interpretation → Action**
> A full-stack MVP that transforms raw engineering data into clear performance insights and actionable next steps.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

---

## 📋 Overview

**Action Flow** is a developer performance analytics dashboard that ingests data from an Excel workbook, computes five key productivity metrics per developer, and generates rule-based insights with actionable recommendations.

This is **not** a generic dashboard — it interprets what the numbers mean and tells you what to do about them.

Built as a clean, explainable MVP to demonstrate product thinking, data interpretation, and end-to-end full-stack development.

---

## ✨ Features

- 📊 **5 Key Metrics** — Lead Time, Cycle Time, Bug Rate, Deployment Frequency, PR Throughput
- 🎯 **Health Indicators** — Each metric card shows green / yellow / red status based on configurable thresholds
- 🧠 **Rule-Based Insights** — Natural-language interpretation of what the metrics indicate (no AI/ML models)
- ✅ **Actionable Suggestions** — Each recommendation is tagged with the specific metric that triggered it
- 📈 **Productivity Trend Chart** — Interactive line graph showing merged PRs and deployments over time (Recharts)
- 👤 **Developer Selector** — Dropdown populated from Excel data; switching developers refreshes everything dynamically
- 🌙 **Dark Mode** — Automatic dark/light mode based on system preference

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite, Tailwind CSS v4 | Dashboard UI with reactive data rendering |
| **Backend** | Node.js, Express | REST API for metrics, insights, and trend data |
| **Data Parsing** | SheetJS (`xlsx`) | Reads and converts Excel sheets to JSON at startup |
| **Charts** | Recharts | Interactive line chart for productivity trends |
| **Icons** | Lucide React | Clean, consistent iconography |

---

## 🏗️ Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Excel Workbook (.xlsx)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Dim_Developers│  │Fact_Jira_    │  │Fact_Pull_    │   │
│  │              │  │Issues        │  │Requests      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │Fact_CI_      │  │Fact_Bug_     │                     │
│  │Deployments   │  │Reports       │                     │
│  └──────────────┘  └──────────────┘                     │
└────────────────────────┬────────────────────────────────┘
                         │ Parsed at server startup
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js + Express Backend                   │
│                                                         │
│  GET /developers          → List all developers          │
│  GET /metrics/:devId      → Compute 5 metrics            │
│  GET /insights/:devId     → Generate insights + actions  │
│  GET /trend/:devId        → Time-series PR & deploy data │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                React Frontend (Vite)                     │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ MetricsCards │  │InsightsPanel │  │ActionSuggest.│   │
│  │ (5 cards)   │  │(interpretation)│ │(tagged items)│   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
│  ┌─────────────────────────────────────────────────┐    │
│  │            TrendChart (Recharts)                 │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Data joins** are performed using relational keys:
- `developer_id` — links developers to issues, PRs, deployments, and bugs
- `pr_id` — links PRs to deployments (for lead time calculation)
- `issue_id` — links issues to bug reports

---

## 📸 Screenshots

> _Add screenshots of your running dashboard here._

| Dashboard Overview | Developer Switch |
|---|---|
| _screenshot_ | _screenshot_ |

| Insight Panel | Trend Chart |
|---|---|
| _screenshot_ | _screenshot_ |

---

## ⚡ Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/Bhushan0455/Action-Flow.git
cd Action-Flow
```

### 2. Place your Excel data file

Copy `intern_assignment_support_pack_dev_only_v3.xlsx` into the project root directory.

### 3. Start the Backend

```bash
cd backend
npm install
node index.js
```

The API server will start at `http://localhost:3001`

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:5173`

---

## 🔍 How It Works

### Metric Calculations

| Metric | Formula | Source Sheets |
|--------|---------|---------------|
| **Lead Time** | `avg(Deployment.completed_at − PR.opened_at)` | Pull Requests + Deployments |
| **Cycle Time** | `avg(Issue.done_at − Issue.in_progress_at)` | Jira Issues |
| **Bug Rate** | `(bug count ÷ completed issues) × 100` | Bug Reports + Jira Issues |
| **Deploy Frequency** | `deployments ÷ active months` | CI Deployments |
| **PR Throughput** | `merged PRs ÷ active months` | Pull Requests |

### Insight Rules (Rule-Based Logic)

Insights are generated using independent if-else rules — each metric is evaluated separately:

```
Cycle Time > 4 days       → "Slower task completion detected"
PR Throughput < 3/mo      → "Delays in merging code"
Lead Time > 4 days        → "Changes take longer to reach production"
Bug Rate > 10%            → "Potential quality issues"
Deploy Frequency < 2/mo   → "Large or infrequent releases"
```

**Combined pattern detection:**
- High cycle time + low PR throughput → "Development or review bottlenecks"
- High bug rate + high deploy frequency → "Rushed deployments"

---

## 🧩 Project Structure

```
Action-Flow/
├── backend/
│   ├── index.js            # Express server, Excel parsing, all API endpoints
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx          # Main layout, data fetching, state management
│   │   │   ├── MetricsCards.jsx       # 5 metric cards with health color thresholds
│   │   │   ├── InsightsPanel.jsx      # AI Interpretation display panel
│   │   │   ├── ActionSuggestions.jsx   # Actionable steps with metric tags
│   │   │   └── TrendChart.jsx         # Recharts line chart (PRs + Deployments)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚧 Limitations

| Limitation | Context |
|---|---|
| **Excel-based data** | No real-time database; data is parsed from a static `.xlsx` file at server startup |
| **Rule-based insights** | Insights use simple if-else logic, not ML/AI models |
| **Small dataset** | ~4 PRs and ~4 issues per developer across 2 months |
| **No authentication** | Single-user MVP — no login or role-based access |
| **Static thresholds** | Metric health boundaries are hardcoded, not adaptive |

---

## 🔮 Future Improvements

- 🗄️ **Database Integration** — Migrate from Excel to MongoDB or PostgreSQL for persistent, queryable storage
- 📤 **File Upload** — Allow users to upload new Excel files dynamically via the UI
- 🤖 **Smarter Insights** — Evolve from rule-based to a scoring system or lightweight anomaly detection
- 📊 **Team-Level Views** — Aggregate metrics across teams for manager-level dashboards
- 🔐 **Authentication** — Add JWT-based auth for multi-user support
- ⚙️ **Configurable Thresholds** — Let users define what "healthy" means for their team
- 🔄 **Real-Time Data** — Connect to Jira, GitHub, and CI/CD APIs for live metric tracking

---

## 🎬 Demo

1. Start both servers (backend + frontend)
2. Open `http://localhost:5173`
3. Select a developer from the dropdown
4. Observe the metric cards, insight panel, action suggestions, and trend chart update dynamically
5. Switch developers to see how insights and recommendations change based on individual performance data

---

## 👤 Author

**Bhushan**
- GitHub: [@Bhushan0455](https://github.com/Bhushan0455)

---

## 📄 License

This project is built for educational and demonstration purposes.
