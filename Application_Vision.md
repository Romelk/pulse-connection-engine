# PulseAI — Application Vision

**Product:** AI-Powered Operations Assistant
**Team:** PulseAI — BITSoM
**Version:** 2.0 Vision

---

## The Core Philosophy

**Plug and play for any industry.**

All PulseAI needs to come alive is access to telemetric data from the critical machines in an operation. From that single connection, it auto-builds dashboards, detects anomalies, quantifies downtime losses, and surfaces the financial tools available to the business — without any manual configuration of analytics or reporting.

The system is advisory by design. It never executes actions on behalf of the user. Every insight comes with a confidence score and a clear "why," leaving the decision with the manager.

---

## How It Works — The Three Pillars

### Pillar 1: Universal Telemetry Layer

```
Any Machine  →  Telemetry Ingest API  →  Threshold Engine  →  Auto-Alert  →  Dashboard
```

- Any industry connects their machines by sending sensor readings (temperature, vibration, RPM, pressure, current, etc.) to a single ingest endpoint.
- Each machine is registered with its sensor types and the normal operating thresholds for each sensor.
- When a reading crosses a threshold, an alert is auto-generated — no manual rule-writing required.
- The dashboard renders dynamically from whatever machines are registered. Add a machine, it appears. Configure its sensors, it starts showing health status.

**What is simulated in the MVP:** Since live hardware connections are not available, a dedicated Demo Simulator page allows a user to select any registered machine, dial in sensor values, and fire them into the real ingest API — triggering the same downstream reactions the live system would produce.

---

### Pillar 2: Machine Economics Configuration

```
Registered Machine  +  [Cost, Downtime Value, Hours, Sensor Thresholds]  →  Performance Intelligence
```

Once a machine is registered and telemetry is flowing, the system prompts the operator to configure its economics:

| Field | Purpose |
|---|---|
| Purchase / Replacement Cost | Anchors scheme eligibility calculations |
| Cost Per Hour of Downtime | Quantifies the business impact of any stoppage |
| Planned Operating Hours / Day | Establishes the production baseline |
| Sensor Configs + Thresholds | Defines what "normal" looks like for this machine |

With these inputs, PulseAI can answer: *"How much is this machine's poor health actually costing the business?"*

**When a machine goes down:**
1. Telemetry flags the stoppage (reading drops to zero or crosses a critical threshold).
2. The system opens a **Repair Cost Form** for the operator to log: parts cost, labour cost, repair description.
3. The system calculates total loss:

```
Total Loss = Repair Cost + (Downtime Duration × Hourly Downtime Cost)
```

---

### Pillar 3: Government Scheme Intelligence

Two distinct triggers surface government financial schemes — one reactive, one proactive.

#### Trigger A — Reactive (Machine in Distress)

When total loss from a downtime event crosses a configurable threshold (default ₹50,000):

> *"The cost of this repair + production loss has reached ₹1.2 Lakhs. You may be eligible for the CLCSS capital subsidy to fund a machinery upgrade and prevent recurrence. Here's why you qualify and the next step."*

The scheme suggestion is contextual — it uses the machine type, the nature of the failure, the plant's Udyam registration tier, and the calculated loss to identify the most relevant schemes.

#### Trigger B — Proactive (Business Expansion)

When the business is running well and the owner wants to grow, they provide a structured business intent:

- What is the business goal? (e.g., "Add a second production line to meet export demand")
- Investment range
- Timeline
- Target sector / geography

The AI parses this intent and:
- **If a scheme matches:** Returns the scheme name, benefit amount, eligibility criteria, and next steps.
- **If no scheme matches:** Returns a gap analysis — what would need to be true for a scheme to apply, and what the owner can do to position for future eligibility.

---

## The Demo Simulator

A clearly badged, demo-only page accessible from the sidebar. Its purpose is to make the invisible visible during a demonstration.

**What it does:**
- Lists all registered machines
- Lets the user select a machine and set sensor values via sliders (temperature, vibration, RPM, etc.)
- Fires the values into the real `POST /api/telemetry/ingest` endpoint
- Shows a live reaction panel: Was an anomaly detected? Was an alert created? Was a downtime event opened?
- Also supports simulating a "Repair Cost Submitted" event to trigger the scheme logic end-to-end

**Why it exists:** Real telemetry comes from hardware. In demos and evaluations, this page replaces the hardware without replacing any of the application logic.

---

## What Is Deliberately Out of Scope

| Item | Reason |
|---|---|
| Direct machine control | PulseAI advises, it does not act |
| ERP / payroll replacement | Different problem space |
| Financial disbursement | Handled by government portals |
| WhatsApp push delivery | Message is generated; delivery integration is post-MVP |
| Real-time streaming / WebSockets | Polling is sufficient for MVP |
| Multi-tenant / SaaS auth | Single-plant demo; auth is post-MVP |

---

## Success Looks Like

| Metric | Target |
|---|---|
| Downtime reduction | 20% within 6 months of deployment |
| Policy discovery time | Under 5 minutes from intent to matched scheme |
| Recommendation acceptance rate | >60% of AI suggestions acted upon |
| Scheme value identified | Tracked per plant, reported monthly |

---

## Build Status

| Pillar | Status |
|---|---|
| Telemetry ingest API | In progress |
| Machine economics config | In progress |
| Downtime event + repair cost capture | In progress |
| Reactive scheme trigger (cost threshold) | In progress |
| Proactive expansion intent + AI match | In progress |
| Demo Simulator (wired to real API) | In progress |
| Dashboard driven by live telemetry | In progress |
