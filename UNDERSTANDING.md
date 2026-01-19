# FactoryHealth AI - Operations Assistant for SME Manufacturing

## Overview

An AI-powered operations management dashboard designed for SME manufacturing managers in India. The application helps managers monitor factory health, respond to operational risks, connect issues to government financial support programs, and track decision history.

**Target Users**: Plant Managers, Shift Supervisors, Operations Teams at SME manufacturing units

**Key Value Propositions**:
- Real-time factory health monitoring
- AI-powered maintenance recommendations
- Government scheme discovery and application assistance
- Complete audit trail of decisions and outcomes

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 15.x |
| UI Framework | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4 |
| Icons | Lucide React | Latest |
| Backend | Express.js | 5.x |
| Database | SQLite (better-sqlite3) | Embedded |
| State Management | React Context | Built-in |

---

## Application Sections

### 1. Factory Health Dashboard (`/overview`)

**Purpose**: Real-time operations monitoring hub - the primary landing page for plant managers.

**Features**:
| Feature | Description |
|---------|-------------|
| Factory Status Card | Overall health percentage (0-100%) with status indicator |
| AI Sync Status | Shows when AI diagnostics last ran |
| Risk Summary | Today's risk assessments with severity badges |
| Machine Grid | Visual overview of all machines with status |
| Active Alerts | Real-time alert sidebar with severity coding |
| Run AI Diagnostics | Trigger on-demand AI analysis |

**Screenshot Areas**:
- Left sidebar navigation
- Main content with factory status and machine grid
- Right sidebar with active alerts

**API Endpoints Used**:
- `GET /api/dashboard/overview`
- `GET /api/dashboard/risks`
- `GET /api/machines`
- `GET /api/alerts/active`

---

### 2. Alert Detail View (`/alerts/[id]`)

**Purpose**: Deep-dive into specific operational alerts with full context for decision-making.

**Features**:
| Feature | Description |
|---------|-------------|
| Severity Badge | CRITICAL / WARNING / INFO / SYSTEM classification |
| Production Impact | Estimated % impact on daily output |
| AI Confidence | Reliability score for the AI assessment |
| Sensor Feed | Live visualization of sensor data |
| Issue Description | Detailed explanation of the problem |
| Previous Incidents | Historical context for this machine |
| Spare Parts | Availability status for required parts |
| Assigned Personnel | Who is responsible for resolution |

**User Actions**:
- Mark as Resolved
- View AI Recommendation
- View Logs

**API Endpoints Used**:
- `GET /api/alerts/:id`
- `GET /api/alerts/:id/recommendation`
- `POST /api/alerts/:id/resolve`

---

### 3. AI Recommendations (`/recommendations/[id]`)

**Purpose**: Present AI-generated maintenance recommendations with business impact analysis.

**Features**:
| Feature | Description |
|---------|-------------|
| Smart Insight Badge | Indicates AI-generated content |
| Priority Label | HIGH PRIORITY / MEDIUM / LOW |
| Category | MAINTENANCE / SAFETY / EFFICIENCY |
| Expected Benefits | Uptime gain and cost avoidance calculations |
| Why Section | 2 reason cards explaining the recommendation |
| Confidence Score | AI engine reliability percentage |

**User Actions**:
- Confirm & Notify Team (executes recommendation)
- Remind in 1 hour (snooze)
- Dismiss (reject recommendation)
- Feedback (thumbs up/down)

**API Endpoints Used**:
- `GET /api/alerts/:alertId/recommendation`
- `POST /api/alerts/:id/resolve`

---

### 4. Government Policy Support (`/policy-support`)

**Purpose**: Connect operational issues to relevant government financial support programs.

**Features**:
| Feature | Description |
|---------|-------------|
| Subsidy Calculator | Total potential benefit across all schemes |
| Eligible Schemes | Count of Central vs State programs |
| Success Rate | Application success likelihood |
| Scheme Cards | Detailed cards for each government scheme |
| Eligibility Tags | Visual indicators for requirements |
| Save for Later | Bookmark schemes for future reference |
| Udyam Status | MSME registration verification |

**Scheme Information Displayed**:
- Ministry/Government source
- Maximum benefit amount (in Lakhs)
- Interest subsidy rates
- Eligibility criteria
- Required documentation

**User Actions**:
- View Scheme Details (opens modal)
- Save for Later
- Begin Smart Application (AI-assisted form filling)

**API Endpoints Used**:
- `GET /api/policies/schemes`
- `GET /api/policies/summary`
- `GET /api/policies/udyam-status`
- `POST /api/policies/schemes/:id/save`

---

### 5. Operations History (`/history`)

**Purpose**: Complete audit trail of AI alerts and management decisions.

**Features**:
| Feature | Description |
|---------|-------------|
| Total Actions | Count of logged operations |
| Resolution Rate | Percentage of successfully resolved issues |
| Avg Recovery Time | Mean time to resolve issues |
| Timeline View | Chronological list of all operations |
| Search & Filter | Find specific machines, actions, or dates |
| Export CSV | Download data for external analysis |

**Timeline Entry Contains**:
- Date and timestamp
- Machine identification
- Alert ID reference
- AI Recommendation (what AI suggested)
- Action Taken (what manager did)
- Outcome (result of the action)
- Recovery time

**User Actions**:
- Log Action (manual entry)
- Export CSV
- Search/Filter

**API Endpoints Used**:
- `GET /api/operations/history`
- `GET /api/operations/metrics`
- `POST /api/operations/log-action`
- `GET /api/operations/export`

---

### 6. Supporting Pages

#### Machines (`/machines`)
Machine inventory management with status filtering.
- Filter by status: ACTIVE / IDLE / WARNING / DOWN / MAINTENANCE
- View efficiency, load percentage, temperature
- Quick navigation to related alerts

#### Staff (`/staff`)
Team directory and availability tracking.
- On-duty / On-break / Off-duty status
- Contact information
- Role assignments

#### Analytics (`/analytics`)
Performance metrics and insights dashboard.
- KPI cards: OEE, Production Output, Downtime Hours, Quality Rate
- Weekly production trends chart
- Machine utilization breakdown
- AI-Powered Insights section

#### Settings (`/settings`)
Application preferences and configuration.
- Notification preferences (Email, SMS, Critical Only)
- AI & Automation toggles
- Language and timezone settings
- Application version information

---

## Navigation Structure

### Primary Sidebar (All Pages)

| Menu Item | Path | Icon |
|-----------|------|------|
| Overview | `/overview` | Dashboard |
| Machines | `/machines` | Cog |
| Staff | `/staff` | Users |
| Analytics | `/analytics` | Chart |
| Settings | `/settings` | Settings |

### Contextual Navigation

**Dashboard Context**:
- Live Alerts (with count badge)
- Operations History
- Machine Logs

**Policy Context**:
- Dashboard
- Operational Issues
- Policy Support
- Compliance

### User Flow Diagram

```
                    ┌─────────────────┐
                    │    Dashboard    │
                    │   (/overview)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ Risk Card  │  │  Machine   │  │   Alert    │
     │   Click    │  │   Click    │  │   Click    │
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                  ┌────────────────┐
                  │  Alert Detail  │
                  │ (/alerts/[id]) │
                  └───────┬────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   AI Recommendation   │
              │(/recommendations/[id])│
              └───────────┬───────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
      ┌─────────┐   ┌─────────┐   ┌─────────┐
      │ Confirm │   │ Remind  │   │ Dismiss │
      └────┬────┘   └─────────┘   └─────────┘
           │
           ▼
   ┌───────────────┐
   │   Dashboard   │
   │  (with toast) │
   └───────────────┘
```

---

## API Architecture

### Dashboard APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/overview` | GET | Factory health, current shift, AI sync status |
| `/api/dashboard/risks` | GET | Today's risk assessments |
| `/api/dashboard/run-diagnostics` | POST | Trigger AI diagnostics scan |

### Machine APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/machines` | GET | List all machines with status and alerts |
| `/api/machines/:id` | GET | Single machine details |
| `/api/machines/:id/status` | PUT | Update machine status |

### Alert APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts` | GET | List alerts with optional filters |
| `/api/alerts/active` | GET | Only active alerts (for sidebar) |
| `/api/alerts/:id` | GET | Full alert details with machine info |
| `/api/alerts/:id/recommendation` | GET | AI recommendation for this alert |
| `/api/alerts/:id/acknowledge` | POST | Mark alert as acknowledged |
| `/api/alerts/:id/resolve` | POST | Mark alert as resolved |
| `/api/alerts/:id/dismiss` | POST | Dismiss alert |

### Policy APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/policies/schemes` | GET | List government schemes |
| `/api/policies/schemes/:id` | GET | Single scheme details |
| `/api/policies/summary` | GET | Subsidy totals and statistics |
| `/api/policies/udyam-status` | GET | Udyam registration verification |
| `/api/policies/saved` | GET | User's saved schemes |
| `/api/policies/schemes/:id/save` | POST | Save scheme to list |
| `/api/policies/schemes/:id/save` | DELETE | Remove from saved |

### Operations APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/operations/history` | GET | Timeline entries (filterable) |
| `/api/operations/metrics` | GET | Aggregated metrics |
| `/api/operations/log-action` | POST | Log new operational action |
| `/api/operations/export` | GET | Export as CSV file |

---

## Database Schema

### Core Tables

```sql
-- Factory/Plant Information
plants (
    id, name, location, state,
    udyam_number, udyam_verified, udyam_tier, udyam_category,
    overall_health, status, last_ai_sync,
    created_at
)

-- Manufacturing Equipment
machines (
    id, machine_id, name, type,
    plant_id, department, status,
    load_percentage, efficiency, temperature, vibration_level,
    icon_type, notes, created_at
)

-- Operational Alerts
alerts (
    id, alert_id, plant_id, machine_id,
    severity, title, description, status,
    production_impact, ai_confidence, ai_recommendation,
    sensor_id, created_at, acknowledged_at, resolved_at
)

-- Daily Risk Assessments
risk_assessments (
    id, plant_id, title, description,
    risk_level, badge_text, icon_type,
    is_active, created_at
)

-- AI-Generated Recommendations
ai_recommendations (
    id, alert_id, priority, category,
    title, explanation, uptime_gain, cost_avoidance,
    why_reasons, confidence_score, created_at
)

-- Government Support Schemes
government_schemes (
    id, name, short_name, ministry, level, state,
    max_benefit, benefit_type, benefit_unit,
    description, eligibility_criteria, tags,
    priority_match, is_active, created_at
)

-- User's Saved Schemes
saved_schemes (
    id, scheme_id, saved_at
)

-- Operations Audit Trail
operations_history (
    id, operation_id, plant_id, machine_id, alert_id,
    status, ai_recommendation, ai_recommendation_severity,
    action_taken, action_taken_by, outcome,
    recovery_time_minutes, timestamp, resolved_at
)
```

### Entity Relationships

```
plants ─────┬───── machines
            │
            ├───── alerts ────── ai_recommendations
            │
            ├───── risk_assessments
            │
            └───── operations_history

government_schemes ────── saved_schemes
```

---

## Running the Application

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

**Server runs on**: `http://localhost:8080`

The SQLite database auto-creates on first start at `backend/data/operations.db`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Application runs on**: `http://localhost:3002`

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

---

## AI Integration Status

### Current Implementation: Database-Driven Simulation

The application presents AI features through the UI but uses **pre-seeded database records** rather than real-time AI processing.

| Feature | Current Implementation |
|---------|----------------------|
| AI Recommendations | Pre-generated records in `ai_recommendations` table |
| Confidence Scores | Static values stored per recommendation |
| Production Impact | Hardcoded percentages per alert |
| Cost Projections | Pre-calculated values in database |
| Policy Matching | SQL joins with `priority_match` flag |
| AI Diagnostics | Updates `last_ai_sync` timestamp |

### What's NOT Currently Implemented

- External AI API calls (OpenAI, Claude, Gemini)
- Machine learning models
- Real-time sensor data analysis
- Predictive maintenance algorithms
- Anomaly detection

---

## Future AI Integration Plan

### Phase 1: Dynamic Recommendation Generation
Integrate Claude or OpenAI API to generate contextual maintenance recommendations based on:
- Alert details and severity
- Machine history and specifications
- Sensor data patterns
- Industry best practices

### Phase 2: Sensor Data Analysis
Add AI-powered analysis of vibration, temperature, and pressure readings to:
- Detect anomalies in real-time
- Generate alerts with calculated confidence scores
- Identify patterns indicating potential failures

### Phase 3: Intelligent Policy Matching
Replace SQL-based matching with AI to:
- Analyze plant profile and operational issues
- Match against scheme eligibility using semantic understanding
- Rank schemes by actual relevance and benefit potential

### Phase 4: Predictive Maintenance
Implement ML models for:
- Failure probability forecasting
- Optimal maintenance scheduling
- Cost-benefit analysis of preventive vs. reactive maintenance

---

## Project Structure

```
BITSOM_SUBMISSION/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              # Express app entry
│   │   ├── config/index.ts       # Configuration
│   │   ├── database/
│   │   │   ├── db.ts             # SQLite connection
│   │   │   └── seed.ts           # Demo data seeding
│   │   ├── routes/
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── machines.routes.ts
│   │   │   ├── alerts.routes.ts
│   │   │   ├── policies.routes.ts
│   │   │   └── operations.routes.ts
│   │   ├── services/             # Business logic
│   │   └── types/                # TypeScript definitions
│   └── data/
│       └── operations.db         # SQLite database
│
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── app/
    │   ├── layout.tsx            # Root layout with providers
    │   ├── page.tsx              # Redirect to /overview
    │   ├── globals.css           # Global styles
    │   ├── overview/page.tsx     # Dashboard
    │   ├── machines/page.tsx     # Machine inventory
    │   ├── staff/page.tsx        # Staff directory
    │   ├── analytics/page.tsx    # Analytics dashboard
    │   ├── settings/page.tsx     # Settings page
    │   ├── alerts/[id]/page.tsx  # Alert detail
    │   ├── recommendations/[id]/page.tsx  # AI recommendation
    │   ├── policy-support/page.tsx        # Government schemes
    │   └── history/page.tsx      # Operations history
    ├── components/
    │   ├── ui/                   # Reusable UI components
    │   ├── layout/               # Header, Sidebar, Breadcrumb
    │   ├── dashboard/            # Dashboard-specific components
    │   ├── alerts/               # Alert components
    │   ├── recommendations/      # Recommendation components
    │   ├── policy/               # Policy components
    │   └── operations/           # Operations components
    ├── lib/
    │   ├── api/client.ts         # API client functions
    │   ├── types/index.ts        # TypeScript types
    │   └── utils.ts              # Utility functions
    └── public/                   # Static assets
```

---

## Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Blue (Primary) | `#2563EB` | Primary actions, links, active states |
| Green (Success) | `#22C55E` | Success states, positive indicators |
| Orange (Warning) | `#F97316` | Warnings, medium severity |
| Red (Critical) | `#EF4444` | Critical alerts, errors |
| Gray (Neutral) | `#6B7280` | Text, borders, disabled states |

### Component Patterns

- **Cards**: White background, subtle shadow, rounded corners (8px)
- **Badges**: Colored backgrounds with matching text, small caps
- **Buttons**: Primary (blue filled), Outline (bordered), Danger (red)
- **Icons**: Lucide React throughout for consistency

### Indian Context Elements

- Currency displayed in INR (₹) with Lakhs notation
- Udyam registration status for MSME verification
- Government scheme names from MSME and state ministries
- Indian state names (Maharashtra, etc.)
- IST timezone default

---

## License

This project was created for the BITSOM submission.

---

## Contact

For questions about this application, please refer to the submission documentation.
