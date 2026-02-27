import sql, { initDB } from './db';

async function seed() {
  await initDB();
  console.log('Seeding database...');

  // Clear existing data
  await sql`DELETE FROM operations_history`;
  await sql`DELETE FROM ai_recommendations`;
  await sql`DELETE FROM saved_schemes`;
  await sql`DELETE FROM government_schemes`;
  await sql`DELETE FROM risk_assessments`;
  await sql`DELETE FROM alerts`;
  await sql`DELETE FROM machines`;
  await sql`DELETE FROM shifts`;
  await sql`DELETE FROM plants`;

  // Seed Plants
  await sql`
    INSERT INTO plants (name, location, state, udyam_number, udyam_verified, udyam_tier, udyam_category, overall_health, status, last_ai_sync)
    VALUES ('Pune Plant Alpha', 'Pune', 'Maharashtra', 'UDYAM-MH-02-0012345', 1, 'Micro', 'Cat B', 98, 'stable', ${new Date(Date.now() - 2 * 60 * 1000).toISOString()})
  `;

  // Seed Shifts
  await sql`INSERT INTO shifts (plant_id, name, start_time, end_time, is_current) VALUES (1, 'Shift A', '06:00', '14:00', 1)`;
  await sql`INSERT INTO shifts (plant_id, name, start_time, end_time, is_current) VALUES (1, 'Shift B', '14:00', '22:00', 0)`;

  // Seed Machines
  const sensorConfigs = {
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

  await sql`
    INSERT INTO machines (machine_id, name, type, plant_id, department, status, load_percentage, efficiency, temperature, vibration_level, icon_type, notes)
    VALUES
      ('CNC-Alpha-01',       'CNC Machine 01',     'CNC',       1, 'Main Assembly Line',  'ACTIVE',  82, 94, NULL, NULL, 'cog',           NULL),
      ('Lathe-04',           'Lathe Machine 04',   'Lathe',     1, 'Backup Station',      'IDLE',     0,  0, NULL, NULL, 'zap',           'Offline 4h'),
      ('Packaging-02',       'Packaging Unit 02',  'Packaging', 1, 'End-of-line',         'WARNING', 45, 78, 42,   NULL, 'alert-triangle','Temp: 42°C'),
      ('Hydraulic-Press-01', 'Hydraulic Press 01', 'Press',     1, 'Sheet Metal Dept',    'ACTIVE',  65, 89, NULL, NULL, 'wrench',        NULL),
      ('Coolant-Sys-A',      'Coolant System A',   'Utility',   1, 'Shared Utility',      'ACTIVE',  50, 99, NULL, NULL, 'droplet',       'Flow: Optimal'),
      ('Conveyor-Beta',      'Conveyor Beta',      'Conveyor',  1, 'Sorting Unit',        'IDLE',     0,  0, NULL, NULL, 'package',       'Shift Break - Resuming in 15m')
  `;

  // Seed Alerts
  const now = new Date();
  await sql`
    INSERT INTO alerts (alert_id, plant_id, machine_id, severity, title, description, status, production_impact, ai_confidence, ai_recommendation, sensor_id, created_at)
    VALUES
      ('#AL-9850', 1, NULL, 'CRITICAL', 'Power Fluctuation detected',          'Spike detected in Sector 4. Recommend emergency circuit check.',                                                                   'active', -15, 92, 'Check power distribution panel and reset if needed', 'PWR-S4-01', ${new Date(now.setHours(14, 32)).toISOString()}),
      ('#AL-9849', 1, NULL, 'WARNING',  'Shift Change Overdue',                'Line C workers haven''t clocked out. Efficiency tracking paused.',                                                                 'active', NULL, NULL, NULL, NULL, ${new Date(now.setHours(14, 5)).toISOString()}),
      ('#AL-9848', 1, NULL, 'SYSTEM',   'AI Model Updated',                    'Anomaly detection threshold refined for humid conditions.',                                                                        'active', NULL, NULL, NULL, NULL, ${new Date(now.setHours(13, 45)).toISOString()}),
      ('#AL-9842', 1, 1,    'CRITICAL', 'Machine 04 - High Vibration Detected','Unusual vibration patterns detected in the main spindle assembly. Continuous operation may lead to imminent bearing failure.','active', -15, 92, 'Spindle temperature exceeding normal operating range by 15%. Scheduled maintenance advised immediately.', 'VIB-S4-A2', ${new Date(now.setHours(10, 53)).toISOString()})
  `;

  // Seed Risk Assessments
  await sql`
    INSERT INTO risk_assessments (plant_id, title, description, risk_level, badge_text, icon_type, is_active)
    VALUES
      (1, 'Production Delay: Line B', 'Raw material arrival predicted 2.5 hours late due to logistics bottleneck in Chakan', 'MEDIUM', 'MEDIUM RISK', 'clock', 1),
      (1, 'Abnormal Vibration: Oven 2', 'Sensor data indicates maintenance required within 24 hours to avoid thermal shutdown', 'MEDIUM', 'PREDICTIVE ALERT', 'activity', 1)
  `;

  // Seed AI Recommendations
  await sql`
    INSERT INTO ai_recommendations (alert_id, priority, category, title, explanation, uptime_gain, cost_avoidance, why_reasons, confidence_score)
    VALUES (
      4, 'HIGH PRIORITY', 'MAINTENANCE', 'Schedule Preventive Maintenance at 4 PM',
      'Our sensors detected abnormal vibration frequencies in Milling Machine #4. We predict a critical bearing failure will occur within the next 6 hours.',
      '4 Hours Saved', 12500,
      ${JSON.stringify([
        { icon: 'moon', title: 'Avoid Night Shift Breakdown', description: 'A failure at 10 PM would result in zero production until tomorrow morning, as the maintenance crew is off-site.' },
        { icon: 'history', title: 'Historical Context', description: 'Similar vibration patterns in October led to a total spindle failure that cost ₹85,000 in parts alone.' }
      ])},
      94
    )
  `;

  // Seed Government Schemes
  await sql`
    INSERT INTO government_schemes (name, short_name, ministry, level, state, max_benefit, benefit_type, benefit_unit, description, eligibility_criteria, tags, priority_match)
    VALUES
      ('Credit Linked Capital Subsidy Scheme (CLCSS)',     'CLCSS',    'MINISTRY OF MSME, GOVT OF INDIA', 'central', NULL,          1500000, 'subsidy',          'Lakhs',     'Specifically designed to facilitate technology up-gradation by providing 15% capital subsidy (up to ₹15 lakhs) to MSE units.',             ${JSON.stringify(['Udyam Registered', 'Manufacturing Sector', 'Technology Upgrade'])}, ${JSON.stringify(['Udyam Registered Units', 'Technical Upgrade Only'])}, 1),
      ('Package Scheme of Incentives (PSI) 2019',          'PSI 2019', 'GOVERNMENT OF MAHARASHTRA',        'state',   'Maharashtra',  500000, 'interest_subsidy', 'Per Annum', 'Incentivizing the procurement of modern machinery through interest subsidies on loans.',                                                     ${JSON.stringify(['Zone C, D, or D+ Area', 'New Investment'])},               ${JSON.stringify(['Zone C, D, or D+ Area'])}, 0),
      ('Prime Minister Employment Generation Programme',   'PMEGP',    'MINISTRY OF MSME, GOVT OF INDIA', 'central', NULL,          2500000, 'subsidy',          'Lakhs',     'Credit-linked subsidy programme for setting up new micro-enterprises in non-farm sector.',                                                    ${JSON.stringify(['New Enterprise', 'Non-farm Sector'])},                     ${JSON.stringify(['New Units Only', 'Non-farm Sector'])}, 0),
      ('Maharashtra State Innovation Society Grant',       'MSIS Grant','GOVERNMENT OF MAHARASHTRA',       'state',   'Maharashtra', 1000000, 'grant',            'Lakhs',     'Supporting innovative manufacturing solutions and Industry 4.0 adoption in Maharashtra.',                                                     ${JSON.stringify(['Innovation Focus', 'Industry 4.0'])},                      ${JSON.stringify(['Innovation Projects', 'Maharashtra Based'])}, 0)
  `;

  // Seed Operations History
  await sql`
    INSERT INTO operations_history (operation_id, plant_id, machine_id, alert_id, status, ai_recommendation, ai_recommendation_severity, action_taken, action_taken_by, outcome, recovery_time_minutes, timestamp, resolved_at)
    VALUES
      ('OP-2023-1024-001', 1, 1, NULL, 'resolved',          'Spindle temperature exceeding normal operating range by 15%. Scheduled maintenance advised.',             'warning',  'Lubrication system purged and spindle bearings replaced by Suresh K.', 'Suresh K.',    'Machine restored to 100% capacity. Temperature normalized at 42°C.', 45, '2023-10-24T10:53:00.000Z', '2023-10-24T11:38:00.000Z'),
      ('OP-2023-1023-001', 1, 2, NULL, 'critical_override', 'Vibration patterns suggest tool breakage within next 20 cycles. Emergency stop recommended.',            'critical', 'Emergency stop initiated. Tool inspection revealed microfractures. Replaced with new tooling.', 'Rajesh Kumar', 'Prevented potential equipment damage. Production resumed after 35-minute pause.', 35, '2023-10-23T16:35:00.000Z', '2023-10-23T17:10:00.000Z'),
      ('OP-2023-1022-001', 1, 4, NULL, 'resolved',          'Hydraulic pressure below optimal range. Recommend checking hydraulic fluid levels.',                     'info',     'Hydraulic fluid topped up and system bled by maintenance team.',           'Amit P.',      'Pressure restored to normal operating range. No production impact.',  15, '2023-10-22T09:15:00.000Z', '2023-10-22T09:30:00.000Z')
  `;

  console.log('Database seeded successfully!');
  console.log('  - 1 plant');
  console.log('  - 2 shifts');
  console.log('  - 6 machines');
  console.log('  - 4 alerts');
  console.log('  - 2 risk assessments');
  console.log('  - 1 AI recommendation');
  console.log('  - 4 government schemes');
  console.log('  - 3 operations history records');

  await sql.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
