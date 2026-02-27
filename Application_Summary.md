# Application Summary

## What It Is

An **AI-powered operations management system** for SME manufacturing managers in India. It helps factory floor managers detect equipment risks early, take AI-guided corrective actions, and discover government financial schemes to fund long-term fixes.

---

## Core Features

### 1. Factory Health Dashboard
Real-time monitoring of 6 machines with status indicators (Stable / Warning / Critical), a daily risk summary, active alerts panel, and an "AI Diagnostics" trigger.

### 2. Alert Detail View
Drills into a specific machine alert — shows production impact, AI confidence score, live sensor readings, spare parts availability, assigned personnel, and previous incidents.

### 3. AI Recommendations
Per-alert AI recommendations with confidence scoring, expected uptime gain, cost avoidance estimates, and a "Why follow this?" explanation. Includes a "Confirm & Notify Team" workflow and feedback mechanism.

### 4. Government Policy Support
Matches current operational issues to relevant MSME government schemes (CLCSS, PSI 2019, PMEGP, MSIS Grant). Calculates potential subsidies up to ₹45 Lakhs, verifies Udyam registration, and auto-fills ~70% of scheme applications.

### 5. Operations History
Audit trail of all alerts and manager decisions with resolution rate, average recovery time, and CSV export.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Express.js 5, TypeScript |
| Database | SQLite (better-sqlite3, auto-seeded on startup) |
| AI | Anthropic Claude API (with offline fallback mode) |

---

## What Is Pending / Incomplete

- **Authentication**: Demo credentials exist in `DEMO_FLOWS.md` but there is no real login/auth flow implemented — the app is open-access.
- **AI fallback**: When the Anthropic API key is not configured, AI recommendations fall back to static/mock responses rather than live inference.
- **Machine Simulator**: A `/simulator` route exists for injecting anomalies but is not wired into the main user workflow.
- **Analytics page**: A `/analytics` route is scaffolded but its depth of implementation is unclear.
- **Staff management**: A `/staff` route exists but team features were added late (last commit) and may lack full CRUD.
- **Mobile responsiveness**: Not explicitly tested or documented; UI is desktop-first.
- **Real sensor integration**: All sensor data is seeded/simulated — no live hardware or IoT connectivity.

---

*Built for BITSOM submission — targeting Indian SME factory operations.*
