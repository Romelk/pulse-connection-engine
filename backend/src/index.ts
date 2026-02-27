import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import sql, { initDB } from './database/db';

// Import routes
import dashboardRoutes from './routes/dashboard.routes';
import machinesRoutes from './routes/machines.routes';
import alertsRoutes from './routes/alerts.routes';
import policiesRoutes from './routes/policies.routes';
import operationsRoutes from './routes/operations.routes';
import simulatorRoutes from './routes/simulator.routes';
import aiRoutes from './routes/ai.routes';
import scraperRoutes from './routes/scraper.routes';
import teamRoutes from './routes/team.routes';
import telemetryRoutes from './routes/telemetry.routes';
import downtimeRoutes from './routes/downtime.routes';
import expansionRoutes from './routes/expansion.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

const DEFAULT_SENSOR_CONFIGS = {
  cnc: JSON.stringify([
    { sensor_type: 'temperature', unit: '°C',   normal_min: 20,  normal_max: 75,   critical_max: 90  },
    { sensor_type: 'vibration',   unit: 'mm/s', normal_min: 0,   normal_max: 5,    critical_max: 10  },
    { sensor_type: 'rpm',         unit: 'RPM',  normal_min: 200, normal_max: 3000, critical_max: 3500 },
  ]),
  lathe: JSON.stringify([
    { sensor_type: 'temperature', unit: '°C',   normal_min: 20, normal_max: 70,   critical_max: 85  },
    { sensor_type: 'vibration',   unit: 'mm/s', normal_min: 0,  normal_max: 4,    critical_max: 8   },
    { sensor_type: 'rpm',         unit: 'RPM',  normal_min: 100,normal_max: 2000, critical_max: 2500 },
  ]),
  packaging: JSON.stringify([
    { sensor_type: 'temperature', unit: '°C', normal_min: 15, normal_max: 45, critical_max: 60 },
    { sensor_type: 'load',        unit: '%',  normal_min: 0,  normal_max: 85, critical_max: 95 },
  ]),
  press: JSON.stringify([
    { sensor_type: 'pressure',    unit: 'bar', normal_min: 2,  normal_max: 8,  critical_max: 10 },
    { sensor_type: 'temperature', unit: '°C',  normal_min: 20, normal_max: 65, critical_max: 80 },
    { sensor_type: 'load',        unit: '%',   normal_min: 0,  normal_max: 80, critical_max: 95 },
  ]),
  utility: JSON.stringify([
    { sensor_type: 'temperature', unit: '°C',  normal_min: 5, normal_max: 35, critical_max: 45 },
    { sensor_type: 'pressure',    unit: 'bar', normal_min: 1, normal_max: 5,  critical_max: 7  },
  ]),
  conveyor: JSON.stringify([
    { sensor_type: 'load',      unit: '%',    normal_min: 0, normal_max: 90, critical_max: 100 },
    { sensor_type: 'vibration', unit: 'mm/s', normal_min: 0, normal_max: 3,  critical_max: 6   },
  ]),
};

async function seedIfEmpty() {
  try {
    const [plantCount] = await sql<{ count: number }[]>`SELECT COUNT(*)::int as count FROM plants`;
    if (plantCount.count === 0) {
      console.log('Database is empty, auto-seeding...');

      await sql`
        INSERT INTO plants (name, location, state, udyam_number, udyam_verified, udyam_tier, udyam_category, overall_health, status, last_ai_sync)
        VALUES ('Pune Plant Alpha', 'Pune', 'Maharashtra', 'UDYAM-MH-02-0012345', 1, 'Micro', 'Cat B', 98, 'stable', ${new Date(Date.now() - 2 * 60 * 1000).toISOString()})
      `;

      await sql`INSERT INTO shifts (plant_id, name, start_time, end_time, is_current) VALUES (1, 'Shift A', '06:00', '14:00', 1)`;
      await sql`INSERT INTO shifts (plant_id, name, start_time, end_time, is_current) VALUES (1, 'Shift B', '14:00', '22:00', 0)`;

      await sql`
        INSERT INTO machines (machine_id, name, type, plant_id, department, status, load_percentage, efficiency, temperature, vibration_level, icon_type, notes, purchase_cost, hourly_downtime_cost, planned_hours_per_day, sensor_configs, economics_configured)
        VALUES
          ('CNC-Alpha-01',       'CNC Machine 01',     'CNC',       1, 'Main Assembly Line',  'ACTIVE',  82, 94, NULL, NULL, 'cog',           NULL,              850000, 12000, 16, ${DEFAULT_SENSOR_CONFIGS.cnc}, 1),
          ('Lathe-04',           'Lathe Machine 04',   'Lathe',     1, 'Backup Station',      'IDLE',     0,  0, NULL, NULL, 'zap',           'Offline 4h',      450000,  8000, 16, ${DEFAULT_SENSOR_CONFIGS.lathe}, 1),
          ('Packaging-02',       'Packaging Unit 02',  'Packaging', 1, 'End-of-line',         'WARNING', 45, 78, 42,  NULL, 'alert-triangle','Temp: 42°C',      300000,  5000,  8, ${DEFAULT_SENSOR_CONFIGS.packaging}, 1),
          ('Hydraulic-Press-01', 'Hydraulic Press 01', 'Press',     1, 'Sheet Metal Dept',    'ACTIVE',  65, 89, NULL, NULL, 'wrench',        NULL,              650000, 10000, 16, ${DEFAULT_SENSOR_CONFIGS.press}, 1),
          ('Coolant-Sys-A',      'Coolant System A',   'Utility',   1, 'Shared Utility',      'ACTIVE',  50, 99, NULL, NULL, 'droplet',       'Flow: Optimal',   120000, 15000, 24, ${DEFAULT_SENSOR_CONFIGS.utility}, 1),
          ('Conveyor-Beta',      'Conveyor Beta',      'Conveyor',  1, 'Sorting Unit',        'IDLE',     0,  0, NULL, NULL, 'package',       'Shift Break',     250000,  6000,  8, ${DEFAULT_SENSOR_CONFIGS.conveyor}, 1)
      `;

      const now = new Date();
      await sql`
        INSERT INTO alerts (alert_id, plant_id, machine_id, severity, title, description, status, production_impact, ai_confidence, ai_recommendation, sensor_id, created_at)
        VALUES
          ('#AL-9850', 1, NULL, 'CRITICAL', 'Power Fluctuation detected',          'Spike detected in Sector 4. Recommend emergency circuit check.',                'active', -15, 92, 'Check power distribution panel', 'PWR-S4-01', ${new Date(now.getTime() - 0 * 3600000).toISOString()}),
          ('#AL-9849', 1, NULL, 'WARNING',  'Shift Change Overdue',                'Line C workers haven''t clocked out.',                                          'active', NULL, NULL, NULL, NULL, ${new Date(now.getTime() - 1 * 3600000).toISOString()}),
          ('#AL-9848', 1, NULL, 'SYSTEM',   'AI Model Updated',                    'Anomaly detection threshold refined.',                                          'active', NULL, NULL, NULL, NULL, ${new Date(now.getTime() - 2 * 3600000).toISOString()}),
          ('#AL-9842', 1, 1,    'CRITICAL', 'Machine 04 - High Vibration Detected','Unusual vibration patterns in main spindle assembly. Bearing failure imminent.','active', -15, 92, 'Schedule maintenance immediately', 'VIB-S4-A2', ${new Date(now.getTime() - 3 * 3600000).toISOString()})
      `;

      await sql`
        INSERT INTO risk_assessments (plant_id, title, description, risk_level, badge_text, icon_type, is_active)
        VALUES
          (1, 'Production Delay: Line B', 'Raw material arrival predicted 2.5 hours late', 'MEDIUM', 'MEDIUM RISK', 'clock', 1),
          (1, 'Abnormal Vibration: Oven 2', 'Maintenance required within 24 hours', 'MEDIUM', 'PREDICTIVE ALERT', 'activity', 1)
      `;

      await sql`
        INSERT INTO ai_recommendations (alert_id, priority, category, title, explanation, uptime_gain, cost_avoidance, why_reasons, confidence_score)
        VALUES (
          4, 'HIGH PRIORITY', 'MAINTENANCE', 'Schedule Preventive Maintenance at 4 PM',
          'Abnormal vibration frequencies detected. Bearing failure predicted within 6 hours.',
          '4 Hours Saved', 12500,
          ${JSON.stringify([
            { icon: 'moon',    title: 'Avoid Night Shift Breakdown', description: 'Failure at 10 PM would halt production until morning.' },
            { icon: 'history', title: 'Historical Context',          description: 'Similar patterns in October caused ₹85,000 spindle failure.' },
          ])}, 94
        )
      `;

      await sql`
        INSERT INTO government_schemes (name, short_name, ministry, level, state, max_benefit, benefit_type, benefit_unit, description, eligibility_criteria, tags, priority_match)
        VALUES
          ('Credit Linked Capital Subsidy Scheme (CLCSS)', 'CLCSS',    'MINISTRY OF MSME',    'central', NULL,          1500000, 'subsidy',          'Lakhs',     '15% capital subsidy for technology upgradation.',       ${JSON.stringify(['Udyam Registered','Manufacturing'])}, ${JSON.stringify(['Udyam Registered Units'])}, 1),
          ('Package Scheme of Incentives (PSI) 2019',      'PSI 2019', 'GOVT OF MAHARASHTRA', 'state',   'Maharashtra',  500000, 'interest_subsidy', 'Per Annum', 'Interest subsidies on machinery loans.',                ${JSON.stringify(['Zone C/D Area'])},                  ${JSON.stringify(['Zone C, D Area'])}, 0),
          ('PMEGP',                                         'PMEGP',    'MINISTRY OF MSME',    'central', NULL,          2500000, 'subsidy',          'Lakhs',     'Subsidy for new micro-enterprises.',                    ${JSON.stringify(['New Enterprise'])},                 ${JSON.stringify(['New Units Only'])}, 0),
          ('MSIS Grant',                                    'MSIS',     'GOVT OF MAHARASHTRA', 'state',   'Maharashtra', 1000000, 'grant',            'Lakhs',     'Innovation and Industry 4.0 adoption.',                 ${JSON.stringify(['Innovation'])},                     ${JSON.stringify(['Maharashtra Based'])}, 0)
      `;

      await sql`
        INSERT INTO operations_history (operation_id, plant_id, machine_id, alert_id, status, ai_recommendation, ai_recommendation_severity, action_taken, action_taken_by, outcome, recovery_time_minutes, timestamp, resolved_at)
        VALUES ('OP-2023-1024-001', 1, 1, NULL, 'resolved', 'Spindle temperature exceeding range.', 'warning', 'Bearings replaced by Suresh K.', 'Suresh K.', 'Machine restored to 100%.', 45, '2023-10-24T10:53:00.000Z', '2023-10-24T11:38:00.000Z')
      `;

      // Sample telemetry history for CNC Machine 01 (last 6 hours)
      const telemetryBase = new Date(Date.now() - 6 * 3600000);
      for (let i = 0; i < 12; i++) {
        const t = new Date(telemetryBase.getTime() + i * 1800000).toISOString();
        await sql`INSERT INTO telemetry_events (machine_id, sensor_type, value, unit, is_anomaly, anomaly_severity, recorded_at) VALUES (1, 'temperature', ${45 + Math.random() * 20},   '°C',   0,         NULL,                         ${t})`;
        await sql`INSERT INTO telemetry_events (machine_id, sensor_type, value, unit, is_anomaly, anomaly_severity, recorded_at) VALUES (1, 'vibration',   ${2  + Math.random() * 3},    'mm/s', ${i >= 10 ? 1 : 0}, ${i >= 10 ? 'WARNING' : null}, ${t})`;
        await sql`INSERT INTO telemetry_events (machine_id, sensor_type, value, unit, is_anomaly, anomaly_severity, recorded_at) VALUES (1, 'rpm',         ${2400 + Math.random() * 200}, 'RPM',  0,         NULL,                         ${t})`;
      }

      await sql`
        INSERT INTO downtime_events (machine_id, triggered_by_alert_id, start_time, end_time, duration_hours, repair_cost, repair_description, cause, status, total_loss, scheme_triggered, created_at)
        VALUES (3, NULL,
          ${new Date(Date.now() - 48 * 3600000).toISOString()},
          ${new Date(Date.now() - 45 * 3600000).toISOString()},
          3.0, 18500,
          'Replaced overheating conveyor belt motor and cooling fan',
          'Motor overheating due to coolant blockage',
          'resolved', ${18500 + (3 * 5000)}, 0,
          ${new Date(Date.now() - 48 * 3600000).toISOString()}
        )
      `;

      console.log('Database seeded successfully — PulseAI Vision build.');
    } else {
      console.log('Database already has data, skipping seed.');
    }

    // Seed users if none exist (runs even if plants already seeded)
    const [userCount] = await sql<{ count: number }[]>`SELECT COUNT(*)::int as count FROM users`;
    if (userCount.count === 0) {
      await sql`INSERT INTO users (email, password, role, company_id, name) VALUES ('admin@pulseai.in', 'admin123', 'super_admin', NULL, 'PulseAI Admin')`;
      await sql`INSERT INTO users (email, password, role, company_id, name) VALUES ('manager@puneplantalpha.com', 'demo123', 'local_admin', 1, 'Rajesh Kumar')`;
      console.log('Users seeded: super_admin + local_admin for Pune Plant Alpha.');
    }
  } catch (error) {
    console.error('Auto-seed error:', error);
  }
}

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'data', 'uploads')));

// API Routes
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/machines',   machinesRoutes);
app.use('/api/alerts',     alertsRoutes);
app.use('/api/policies',   policiesRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/simulator',  simulatorRoutes);
app.use('/api/ai',         aiRoutes);
app.use('/api/scraper',    scraperRoutes);
app.use('/api/team',       teamRoutes);
app.use('/api/telemetry',  telemetryRoutes);
app.use('/api/downtime',   downtimeRoutes);
app.use('/api/expansion',  expansionRoutes);
app.use('/api/auth',       authRoutes);
app.use('/api/admin',      adminRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function main() {
  await initDB();
  await seedIfEmpty();

  app.listen(config.port, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   PulseAI Backend Server                                  ║
  ║   AI-Powered Operations Assistant — Vision Build          ║
  ║                                                           ║
  ║   Server: http://localhost:${config.port}                          ║
  ║   Frontend: ${config.frontendUrl}                         ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
