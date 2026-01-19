# FactoryHealth AI - Complete Demo Flows

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Plant Manager | manager@puneplantalpha.com | demo123 |
| Shift Supervisor | supervisor@puneplantalpha.com | demo123 |
| System Admin | admin@factoryhealth.ai | admin123 |

---

## Flow 1: Machine Anomaly Detection & AI Response

**Scenario**: A machine starts showing abnormal temperature readings. The system detects this, generates an alert, and provides an AI-powered maintenance recommendation.

### Steps:

1. **Login**
   - Navigate to `http://localhost:3002`
   - Login as Plant Manager: `manager@puneplantalpha.com` / `demo123`
   - You'll be redirected to the Overview dashboard

2. **Open Machine Simulator**
   - Click **"Simulator"** in the left sidebar
   - You'll see the Machine Parameter Simulator page

3. **Select a Machine**
   - From the dropdown, select **"CNC Machine 04"** (or any machine)
   - Note the current parameters and threshold indicators

4. **Simulate Anomaly - Push Temperature Beyond Threshold**
   - Drag the **Temperature** slider to **65°C** (beyond the 60°C critical threshold)
   - Optionally increase **Vibration** to **7 mm/s** (beyond 6 mm/s critical)
   - Notice the threshold indicators turn **red** showing "CRITICAL"

5. **Apply Parameters & Generate Alert**
   - Click the **"Apply Parameters & Generate Alerts"** button
   - The system will:
     - Update machine parameters in the database
     - Generate a CRITICAL alert automatically
     - Change machine status to WARNING or DOWN

6. **View Generated Alert**
   - You'll see the generated alert(s) appear below
   - Click **"View Alert Details"** to see the full alert

7. **Alert Detail Page**
   - See the alert severity (CRITICAL), production impact (-15% to -20%)
   - View AI Confidence Level (85-95%)
   - See sensor feed information

8. **Get AI Recommendation**
   - Click **"See AI Recommendation"** button
   - The system calls Claude AI to generate a dynamic recommendation

9. **AI Recommendation Page**
   - See the AI-generated maintenance recommendation
   - View expected benefits: Uptime Gain, Cost Avoidance
   - Read "Why follow this recommendation?" explanations

10. **Take Action**
    - Click **"Confirm & Notify Team"** to accept the recommendation
    - Or click **"Remind in 1 hour"** to defer
    - Or click **"Dismiss"** to ignore

11. **Return to Dashboard**
    - Navigate back to **Overview**
    - See the machine status has changed (WARNING/DOWN)
    - See the alert in "Active Alerts" sidebar

12. **Reset (Optional)**
    - Go back to Simulator
    - Click **"Reset Machine"** to restore normal parameters
    - Active alerts for that machine will be resolved

---

## Flow 2: Government Policy Support & Scheme Discovery

**Scenario**: A plant manager needs to modernize machinery and wants to find applicable government subsidies and schemes.

### Steps:

1. **Login**
   - Navigate to `http://localhost:3002`
   - Login as Plant Manager: `manager@puneplantalpha.com` / `demo123`

2. **Navigate to Policy Support**
   - Click **"Policy Support"** in the left sidebar
   - You'll see the Government Schemes page

3. **View Udyam Status**
   - On the left sidebar, see your **Udyam Status**: VERIFIED
   - Note your tier (Micro), category, and state (Maharashtra)

4. **Sync Latest Schemes**
   - Click the **"Refresh Schemes"** button (Database icon)
   - This syncs 12 verified government schemes to the database
   - Wait for the success toast notification

5. **Review Summary Cards**
   - **Potential Total Subsidy**: Up to ₹45+ Lakhs available
   - **Eligible Schemes**: 4+ programs (Central + State level)
   - **Application Success Rate**: Based on data completeness

6. **Browse Recommended Schemes**
   - See schemes tagged as "HIGH PRIORITY MATCH"
   - Key schemes include:
     - **CLCSS** - Up to ₹15 Lakhs for technology upgradation
     - **PSI 2024** - Interest subsidy for Maharashtra units
     - **PMEGP** - Up to ₹25 Lakhs for new micro-enterprises

7. **View Scheme Details**
   - Click **"View Scheme Details"** on any scheme card
   - A modal shows:
     - Full description
     - Eligibility criteria
     - Maximum benefit amount
     - Ministry/Government source

8. **Save Schemes for Later**
   - Click **"Save for Later"** on schemes you're interested in
   - These are saved to your profile

9. **Begin Smart Application**
   - Click **"BEGIN SMART APPLICATION"** in the dark blue CTA card
   - The AI engine can pre-fill up to 70% of application documents
   - Features: Encrypted data handling, 2x faster filing

---

## Flow 3: Alert Response & Operations History

**Scenario**: An active alert needs to be acknowledged, resolved, and the action logged for audit purposes.

### Steps:

1. **Login**
   - Navigate to `http://localhost:3002`
   - Login as Shift Supervisor: `supervisor@puneplantalpha.com` / `demo123`

2. **View Dashboard**
   - On the **Overview** page, check the right sidebar
   - See **Active Alerts** with severity indicators (CRITICAL, WARNING, SYSTEM)

3. **Acknowledge an Alert**
   - Find a CRITICAL or WARNING alert
   - Click **"Acknowledge"** to mark it as being handled
   - The alert status changes to "acknowledged"

4. **View Alert Details**
   - Click on the alert title or card
   - See full details including:
     - Production impact percentage
     - AI confidence level
     - Sensor feed information
     - Previous incidents for this machine

5. **Get AI Recommendation**
   - Click **"See AI Recommendation"**
   - Review the AI-generated maintenance suggestion
   - Note the priority level (HIGH/MEDIUM/LOW)

6. **Confirm Action**
   - Click **"Confirm & Notify Team"**
   - The system logs this action automatically
   - Team members are notified (simulated)

7. **Resolve the Alert**
   - Return to the alert detail page
   - Click **"Mark as Resolved"** (checkmark button)
   - Provide resolution notes if prompted

8. **View Operations History**
   - Navigate to **Operations History** (via Overview sidebar or top nav)
   - See the timeline of all actions taken

9. **Review Audit Trail**
   - Find your recent action in the timeline
   - See:
     - Date/time and machine info
     - AI Recommendation that was given
     - Action Taken by personnel
     - Outcome and recovery time

10. **Export for Compliance**
    - Click **"Export CSV"** to download the audit trail
    - Use for compliance reporting and analysis

---

## Flow 4: Machine Monitoring & Analytics

**Scenario**: Monitor overall factory health and analyze machine performance trends.

### Steps:

1. **Login**
   - Login as any user

2. **Dashboard Overview**
   - On **Overview**, see:
     - **Factory Status Card**: Overall health percentage (target: 95%+)
     - **Last AI Sync**: When diagnostics last ran
     - **Machine Status Overview**: Active, Idle, Warning, Down counts

3. **Run AI Diagnostics**
   - Click **"Run AI Diagnostics"** button
   - The system analyzes all machine data
   - Updates the "Last AI sync" timestamp

4. **View Risk Summary**
   - Check **Today's Risk Summary** cards
   - Each card shows:
     - Risk title and description
     - Risk level badge (LOW/MEDIUM/HIGH/CRITICAL)

5. **Navigate to Machines**
   - Click **"Machines"** in the sidebar
   - See full inventory with filters

6. **Filter by Status**
   - Click status filter buttons: All, ACTIVE, IDLE, WARNING, DOWN
   - Find machines needing attention

7. **View Machine Details**
   - Click on a machine card
   - See efficiency, load, temperature metrics
   - If machine has an alert, click **"View Alert"**

8. **Analytics Dashboard**
   - Navigate to **"Analytics"**
   - View:
     - KPI metrics (OEE, Production Output, Downtime Hours)
     - Weekly production trends chart
     - Machine utilization breakdown
     - AI-Powered Insights cards

---

## Flow 5: Multi-Agent Integration (Ops Monitor + Policy Hunter)

**Scenario**: Demonstrate the multi-agent architecture where an operational alert automatically triggers policy scheme recommendations, combining maintenance guidance with funding opportunities.

### Multi-Agent Architecture Overview

```
Agent 1 (Ops Monitor)          Agent 2 (Policy Hunter)
        │                              │
        ▼                              │
Machine Telemetry ──► Alert ──► AI Recommendation ──┬──► Policy Matching
                                                    │
                                                    ▼
                                        Combined Output:
                                        • Maintenance Action
                                        • Funding Opportunities
                                        • WhatsApp Notification
```

### Steps:

1. **Login**
   - Navigate to `http://localhost:3002`
   - Login as Plant Manager: `manager@puneplantalpha.com` / `demo123`

2. **Create an Operational Issue via Simulator**
   - Click **"Simulator"** in the left sidebar
   - Select **"CNC Machine 04"** from the dropdown
   - Push **Temperature** to **70°C** (critical threshold)
   - Click **"Apply Parameters & Generate Alerts"**
   - An alert is generated (Agent 1: Ops Monitor triggered)

3. **View the Generated Alert**
   - Click **"View Alert Details"** on the generated alert
   - See the alert severity, production impact, and AI confidence

4. **Get AI Recommendation (Triggers Policy Hunter)**
   - Click **"See AI Recommendation"** button
   - The system now performs two operations:
     - **Agent 1**: Generates maintenance recommendation
     - **Agent 2**: Automatically matches relevant government schemes

5. **View Combined Recommendation**
   - See the **Maintenance Action** at the top:
     - Priority level (HIGH/MEDIUM/LOW)
     - Recommended action title
     - Expected benefits (Uptime Gain, Cost Avoidance)
   - Scroll down to see the **"Funding Opportunities Available"** section:
     - Collapsible card with matched government schemes
     - Total potential benefit (e.g., ₹35,00,000)
     - Priority match count

6. **Explore Matched Schemes**
   - Click to expand the Funding Opportunities card
   - See scheme cards with:
     - **PRIORITY MATCH** badge for highly relevant schemes
     - Scheme name and ministry
     - Maximum benefit amount
     - Eligibility criteria tags
   - Example: "Machine showing high vibration" → CLCSS for technology upgradation

7. **Share via WhatsApp**
   - Click the **"Share"** button on the Funding Opportunities card
   - A WhatsApp message opens with pre-formatted notification:
     ```
     🏭 *FactoryHealth AI Alert*
     ━━━━━━━━━━━━━━━━━━

     ⚠️ *Issue Detected*
     CNC Machine 04 - High Temperature Detected

     🔧 *Recommended Action*
     Schedule Preventive Maintenance

     💰 *Funding Opportunities Found!*
     • CLCSS (up to ₹15,00,000)
     • TUFS (up to ₹20,00,000)

     📊 *Total Potential Benefit: ₹35,00,000*
     ```

8. **Apply for a Scheme**
   - Click **"Apply"** on any scheme card
   - System marks the scheme as "applied" for tracking
   - Toast notification confirms action

9. **Confirm Maintenance Action**
   - Click **"Confirm & Notify Team"** on the main recommendation
   - Both the maintenance action and policy linking are logged
   - Team is notified (simulated)

10. **Verify in Policy Support**
    - Navigate to **"Policy Support"** in the sidebar
    - See the same schemes are available for browsing
    - Schemes linked to operational issues are prioritized

### Key Boundaries Demonstrated

| Boundary | How It's Shown |
|----------|----------------|
| **System advises only** | User must click "Confirm" to take action |
| **Shows confidence scores** | AI confidence % displayed on recommendations |
| **Human decision making** | User chooses to confirm, remind, or dismiss |
| **Auditability** | All actions logged to operations history |

### Technical Flow

1. `POST /api/simulator/update-machine` → Alert created
2. `GET /api/alerts/:id/recommendation` → AI recommendation generated
3. `linkPoliciesToRecommendation()` → Policy Hunter triggered
4. `matchPolicySchemes()` → Claude AI matches schemes
5. Response includes both `recommendation` + `linked_policies`
6. Frontend displays combined output in unified UI

---

## Flow 6: Quick Demo (5-minute version)

**For presentations or quick demonstrations:**

1. **Login** (30 sec)
   - Use `manager@puneplantalpha.com` / `demo123`

2. **Show Dashboard** (1 min)
   - Point out Factory Health (98%)
   - Show Active Alerts sidebar
   - Highlight Machine Status grid

3. **Trigger Alert via Simulator** (1.5 min)
   - Go to Simulator
   - Select machine, push temperature to 70°C
   - Click Apply - show alert generated

4. **Show AI Recommendation + Policy Matching** (1.5 min)
   - Click View Alert → See AI Recommendation
   - Highlight the dynamic maintenance recommendation
   - Scroll to **"Funding Opportunities Available"** section
   - Show matched government schemes with potential benefit
   - Click **"Share"** to show WhatsApp notification format

5. **Policy Support** (30 sec)
   - Navigate to Policy Support
   - Show Udyam verification
   - Show available schemes (₹45 Lakhs potential)

---

## Key Features to Highlight

### For Investors/Stakeholders:
- AI-powered predictive maintenance
- Government scheme integration (unique value prop)
- **Multi-agent architecture** linking operations to funding
- Audit trail for compliance
- Real-time factory monitoring
- WhatsApp-ready notifications for fast adoption

### For Technical Reviewers:
- **Multi-agent system**: Ops Monitor + Policy Hunter
- Claude AI integration for dynamic recommendations
- Automatic policy matching based on operational context
- Machine simulator for anomaly testing
- Web scraping with curated fallback for schemes
- SQLite database with proper schema

### For End Users (Factory Managers):
- Simple login with role-based views
- Clear alert visualization
- Actionable recommendations
- **Combined guidance**: Maintenance action + Funding opportunity
- Policy discovery and application assistance
- One-click WhatsApp sharing

---

## Troubleshooting

### Application Not Loading
```bash
cd frontend
rm -rf .next
npm run dev
```

### Backend Not Responding
```bash
cd backend
npm run dev
# Check it's running on port 8080
```

### Schemes Not Loading
- Click "Refresh Schemes" on Policy Support page
- Check backend logs for scraper errors

### AI Recommendations Not Working
- Verify `.env` file has `ANTHROPIC_API_KEY`
- Restart backend after adding key
