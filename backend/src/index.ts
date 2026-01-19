import express from 'express';
import cors from 'cors';
import { config } from './config';
import db from './database/db';

// Import routes
import dashboardRoutes from './routes/dashboard.routes';
import machinesRoutes from './routes/machines.routes';
import alertsRoutes from './routes/alerts.routes';
import policiesRoutes from './routes/policies.routes';
import operationsRoutes from './routes/operations.routes';
import simulatorRoutes from './routes/simulator.routes';
import aiRoutes from './routes/ai.routes';
import scraperRoutes from './routes/scraper.routes';

// Auto-seed database if empty
function seedIfEmpty() {
  try {
    const plantCount = db.prepare('SELECT COUNT(*) as count FROM plants').get() as { count: number };
    if (plantCount.count === 0) {
      console.log('Database is empty, auto-seeding...');

      // Seed Plants
      db.prepare(`INSERT INTO plants (name, location, state, udyam_number, udyam_verified, udyam_tier, udyam_category, overall_health, status, last_ai_sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('Pune Plant Alpha', 'Pune', 'Maharashtra', 'UDYAM-MH-02-0012345', 1, 'Micro', 'Cat B', 98, 'stable', new Date(Date.now() - 2 * 60 * 1000).toISOString());

      // Seed Shifts
      db.prepare(`INSERT INTO shifts (plant_id, name, start_time, end_time, is_current) VALUES (?, ?, ?, ?, ?)`).run(1, 'Shift A', '06:00', '14:00', 1);
      db.prepare(`INSERT INTO shifts (plant_id, name, start_time, end_time, is_current) VALUES (?, ?, ?, ?, ?)`).run(1, 'Shift B', '14:00', '22:00', 0);

      // Seed Machines
      const machines = [
        ['CNC-Alpha-01', 'CNC Machine 01', 'CNC', 1, 'Main Assembly Line', 'ACTIVE', 82, 94, null, null, 'cog', null],
        ['Lathe-04', 'Lathe Machine 04', 'Lathe', 1, 'Backup Station', 'IDLE', 0, 0, null, null, 'zap', 'Offline 4h'],
        ['Packaging-02', 'Packaging Unit 02', 'Packaging', 1, 'End-of-line', 'WARNING', 45, 78, 42, null, 'alert-triangle', 'Temp: 42°C'],
        ['Hydraulic-Press-01', 'Hydraulic Press 01', 'Press', 1, 'Sheet Metal Dept', 'ACTIVE', 65, 89, null, null, 'wrench', null],
        ['Coolant-Sys-A', 'Coolant System A', 'Utility', 1, 'Shared Utility', 'ACTIVE', 50, 99, null, null, 'droplet', 'Flow: Optimal'],
        ['Conveyor-Beta', 'Conveyor Beta', 'Conveyor', 1, 'Sorting Unit', 'IDLE', 0, 0, null, null, 'package', 'Shift Break'],
      ];
      const insertMachine = db.prepare(`INSERT INTO machines (machine_id, name, type, plant_id, department, status, load_percentage, efficiency, temperature, vibration_level, icon_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      machines.forEach(m => insertMachine.run(...m));

      // Seed Alerts
      const now = new Date();
      const alerts = [
        ['#AL-9850', 1, null, 'CRITICAL', 'Power Fluctuation detected', 'Spike detected in Sector 4. Recommend emergency circuit check.', 'active', -15, 92, 'Check power distribution panel', 'PWR-S4-01'],
        ['#AL-9849', 1, null, 'WARNING', 'Shift Change Overdue', "Line C workers haven't clocked out.", 'active', null, null, null, null],
        ['#AL-9848', 1, null, 'SYSTEM', 'AI Model Updated', 'Anomaly detection threshold refined.', 'active', null, null, null, null],
        ['#AL-9842', 1, 1, 'CRITICAL', 'Machine 04 - High Vibration Detected', 'Unusual vibration patterns in main spindle assembly.', 'active', -15, 92, 'Schedule maintenance immediately', 'VIB-S4-A2'],
      ];
      const insertAlert = db.prepare(`INSERT INTO alerts (alert_id, plant_id, machine_id, severity, title, description, status, production_impact, ai_confidence, ai_recommendation, sensor_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      alerts.forEach((a, i) => insertAlert.run(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], new Date(now.getTime() - i * 3600000).toISOString()));

      // Seed Risk Assessments
      db.prepare(`INSERT INTO risk_assessments (plant_id, title, description, risk_level, badge_text, icon_type, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`).run(1, 'Production Delay: Line B', 'Raw material arrival predicted 2.5 hours late', 'MEDIUM', 'MEDIUM RISK', 'clock');
      db.prepare(`INSERT INTO risk_assessments (plant_id, title, description, risk_level, badge_text, icon_type, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)`).run(1, 'Abnormal Vibration: Oven 2', 'Maintenance required within 24 hours', 'MEDIUM', 'PREDICTIVE ALERT', 'activity');

      // Seed AI Recommendations
      db.prepare(`INSERT INTO ai_recommendations (alert_id, priority, category, title, explanation, uptime_gain, cost_avoidance, why_reasons, confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        4, 'HIGH PRIORITY', 'MAINTENANCE', 'Schedule Preventive Maintenance at 4 PM',
        'Abnormal vibration frequencies detected. Bearing failure predicted within 6 hours.',
        '4 Hours Saved', 12500,
        JSON.stringify([
          { icon: 'moon', title: 'Avoid Night Shift Breakdown', description: 'Failure at 10 PM would halt production until morning.' },
          { icon: 'history', title: 'Historical Context', description: 'Similar patterns in October caused ₹85,000 spindle failure.' }
        ]), 94
      );

      // Seed Government Schemes
      const schemes = [
        ['Credit Linked Capital Subsidy Scheme (CLCSS)', 'CLCSS', 'MINISTRY OF MSME', 'central', null, 1500000, 'subsidy', 'Lakhs', '15% capital subsidy for technology upgradation.', JSON.stringify(['Udyam Registered', 'Manufacturing']), JSON.stringify(['Udyam Registered Units']), 1],
        ['Package Scheme of Incentives (PSI) 2019', 'PSI 2019', 'GOVT OF MAHARASHTRA', 'state', 'Maharashtra', 500000, 'interest_subsidy', 'Per Annum', 'Interest subsidies on machinery loans.', JSON.stringify(['Zone C/D Area']), JSON.stringify(['Zone C, D Area']), 0],
        ['PMEGP', 'PMEGP', 'MINISTRY OF MSME', 'central', null, 2500000, 'subsidy', 'Lakhs', 'Subsidy for new micro-enterprises.', JSON.stringify(['New Enterprise']), JSON.stringify(['New Units Only']), 0],
        ['MSIS Grant', 'MSIS', 'GOVT OF MAHARASHTRA', 'state', 'Maharashtra', 1000000, 'grant', 'Lakhs', 'Innovation and Industry 4.0 adoption.', JSON.stringify(['Innovation']), JSON.stringify(['Maharashtra Based']), 0],
      ];
      const insertScheme = db.prepare(`INSERT INTO government_schemes (name, short_name, ministry, level, state, max_benefit, benefit_type, benefit_unit, description, eligibility_criteria, tags, priority_match) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      schemes.forEach(s => insertScheme.run(...s));

      // Seed Operations History
      db.prepare(`INSERT INTO operations_history (operation_id, plant_id, machine_id, alert_id, status, ai_recommendation, ai_recommendation_severity, action_taken, action_taken_by, outcome, recovery_time_minutes, timestamp, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('OP-2023-1024-001', 1, 1, null, 'resolved', 'Spindle temperature exceeding range.', 'warning', 'Bearings replaced by Suresh K.', 'Suresh K.', 'Machine restored to 100%.', 45, '2023-10-24T10:53:00.000Z', '2023-10-24T11:38:00.000Z');

      console.log('Database seeded successfully!');
    } else {
      console.log('Database already has data, skipping seed.');
    }
  } catch (error) {
    console.error('Auto-seed error:', error);
  }
}

// Run auto-seed on startup
seedIfEmpty();

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/policies', policiesRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/scraper', scraperRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   OpsAssistant AI Backend Server                          ║
  ║   AI-Powered Operations Assistant for SME Manufacturing   ║
  ║                                                           ║
  ║   Server running on: http://localhost:${config.port}               ║
  ║   Frontend URL: ${config.frontendUrl}                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
