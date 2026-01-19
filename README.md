# AI-Powered Operations Assistant for SME Manufacturing

An intelligent operations management system designed for SME manufacturing managers in India. This application helps managers detect operational risks early, decide the right corrective action, and identify government financial support for long-term fixes.

## Features

### 1. Factory Health Dashboard
- Real-time factory status monitoring (Stable/Warning/Critical)
- Today's Risk Summary with predictive alerts
- Machine Status Overview with 6 machine cards
- Active Alerts panel with severity levels
- AI Diagnostics capability

### 2. Alert Detail View
- Production impact assessment (-15% Output)
- AI Confidence Level (92% Reliable)
- Live Sensor Feed visualization
- Issue Description with recommended actions
- Previous incidents, spare parts availability, assigned personnel

### 3. AI Recommended Action
- Smart insights with confidence scoring
- Expected benefits (Uptime Gain, Cost Avoidance)
- "Why follow this recommendation?" explanations
- Confirm & Notify Team workflow
- Feedback mechanism

### 4. Government Policy Support
- AI-driven scheme recommendations based on operational issues
- Potential subsidy calculations (up to ₹45 Lakhs)
- CLCSS, PSI 2019, and other scheme details
- Udyam verification status
- Smart Application with 70% auto-fill capability

### 5. Operations History Timeline
- Audit trail of AI alerts and management decisions
- Total Actions, Resolution Rate, Avg Recovery Time metrics
- Timeline view with AI recommendations and outcomes
- Export to CSV functionality

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS 3.4 |
| Icons | Lucide React |
| Backend | Express.js 5, TypeScript |
| Database | SQLite (better-sqlite3) |

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/romelkumar/Desktop/BITSOM_SUBMISSION
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Seed the database**
   ```bash
   npm run seed
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

**Option 1: Using the start script**
```bash
./start.sh
```

**Option 2: Manual start**

Terminal 1 - Start Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Start Frontend:
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

## Project Structure

```
BITSOM_SUBMISSION/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express server
│   │   ├── config/            # Configuration
│   │   ├── database/          # SQLite schema & seed
│   │   ├── routes/            # API endpoints
│   │   └── types/             # TypeScript types
│   └── data/
│       └── operations.db      # SQLite database
│
├── frontend/
│   ├── app/
│   │   ├── overview/          # Screen 1: Factory Dashboard
│   │   ├── alerts/[id]/       # Screen 2: Alert Detail
│   │   ├── recommendations/   # Screen 3: AI Recommendation
│   │   ├── policy-support/    # Screen 4: Government Policies
│   │   └── history/           # Screen 5: Operations Timeline
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── layout/           # Header, Sidebar
│   │   ├── dashboard/        # Dashboard components
│   │   └── ...
│   └── lib/
│       ├── api/              # API client
│       ├── types/            # TypeScript types
│       └── utils.ts          # Utility functions
│
├── start.sh                   # Quick start script
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard/overview` | Factory status, health %, last sync |
| `GET /api/dashboard/risks` | Today's risk assessments |
| `GET /api/machines` | Machine list with status |
| `GET /api/alerts/active` | Active alerts |
| `GET /api/alerts/:id` | Alert detail |
| `GET /api/alerts/:id/recommendation` | AI recommendation |
| `GET /api/policies/schemes` | Government schemes |
| `GET /api/policies/summary` | Subsidy totals |
| `GET /api/operations/history` | Timeline entries |
| `GET /api/operations/metrics` | Operations metrics |

## Screen Routes

| Route | Screen |
|-------|--------|
| `/overview` | Factory Health Dashboard |
| `/alerts/:id` | Alert Detail View |
| `/recommendations/:id` | AI Recommended Action |
| `/policy-support` | Government Policy Support |
| `/history` | Operations History Timeline |

## Design Notes

- **Color Palette**: Blue primary (#2563EB), Green success (#22C55E), Orange warning (#F97316), Red critical (#EF4444)
- **Typography**: Clean sans-serif, large readable text for factory floor use
- **Cards**: White background, subtle shadows, rounded corners
- **Indian Context**: ₹ currency, Udyam registration, MSME schemes

## License

This project was created for the BITSOM submission.

---

**© 2024 OpsAssistant AI - Helping SME Manufacturing thrive in India**
