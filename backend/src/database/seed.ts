import db from './db';

console.log('Seeding database...');

// Clear existing data
db.exec(`
  DELETE FROM operations_history;
  DELETE FROM ai_recommendations;
  DELETE FROM saved_schemes;
  DELETE FROM government_schemes;
  DELETE FROM risk_assessments;
  DELETE FROM alerts;
  DELETE FROM machines;
  DELETE FROM shifts;
  DELETE FROM plants;
`);

// Seed Plants
db.prepare(`
  INSERT INTO plants (name, location, state, udyam_number, udyam_verified, udyam_tier, udyam_category, overall_health, status, last_ai_sync)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run('Pune Plant Alpha', 'Pune', 'Maharashtra', 'UDYAM-MH-02-0012345', 1, 'Micro', 'Cat B', 98, 'stable', new Date(Date.now() - 2 * 60 * 1000).toISOString());

// Seed Shifts
db.prepare(`
  INSERT INTO shifts (plant_id, name, start_time, end_time, is_current)
  VALUES (?, ?, ?, ?, ?)
`).run(1, 'Shift A', '06:00', '14:00', 1);

db.prepare(`
  INSERT INTO shifts (plant_id, name, start_time, end_time, is_current)
  VALUES (?, ?, ?, ?, ?)
`).run(1, 'Shift B', '14:00', '22:00', 0);

// Seed Machines
const machines = [
  ['CNC-Alpha-01', 'CNC Machine 01', 'CNC', 1, 'Main Assembly Line', 'ACTIVE', 82, 94, null, null, 'cog', null],
  ['Lathe-04', 'Lathe Machine 04', 'Lathe', 1, 'Backup Station', 'IDLE', 0, 0, null, null, 'zap', 'Offline 4h'],
  ['Packaging-02', 'Packaging Unit 02', 'Packaging', 1, 'End-of-line', 'WARNING', 45, 78, 42, null, 'alert-triangle', 'Temp: 42°C'],
  ['Hydraulic-Press-01', 'Hydraulic Press 01', 'Press', 1, 'Sheet Metal Dept', 'ACTIVE', 65, 89, null, null, 'wrench', null],
  ['Coolant-Sys-A', 'Coolant System A', 'Utility', 1, 'Shared Utility', 'ACTIVE', 50, 99, null, null, 'droplet', 'Flow: Optimal'],
  ['Conveyor-Beta', 'Conveyor Beta', 'Conveyor', 1, 'Sorting Unit', 'IDLE', 0, 0, null, null, 'package', 'Shift Break - Resuming in 15m'],
];

const insertMachine = db.prepare(`
  INSERT INTO machines (machine_id, name, type, plant_id, department, status, load_percentage, efficiency, temperature, vibration_level, icon_type, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

machines.forEach(m => insertMachine.run(...m));

// Seed Alerts
const alerts = [
  ['#AL-9850', 1, null, 'CRITICAL', 'Power Fluctuation detected', 'Spike detected in Sector 4. Recommend emergency circuit check.', 'active', -15, 92, 'Check power distribution panel and reset if needed', 'PWR-S4-01', new Date().setHours(14, 32)],
  ['#AL-9849', 1, null, 'WARNING', 'Shift Change Overdue', "Line C workers haven't clocked out. Efficiency tracking paused.", 'active', null, null, null, null, new Date().setHours(14, 5)],
  ['#AL-9848', 1, null, 'SYSTEM', 'AI Model Updated', 'Anomaly detection threshold refined for humid conditions.', 'active', null, null, null, null, new Date().setHours(13, 45)],
  ['#AL-9842', 1, 1, 'CRITICAL', 'Machine 04 - High Vibration Detected', 'Unusual vibration patterns detected in the main spindle assembly. Continuous operation may lead to imminent bearing failure.', 'active', -15, 92, 'Spindle temperature exceeding normal operating range by 15%. Scheduled maintenance advised immediately to prevent bearing failure.', 'VIB-S4-A2', new Date().setHours(10, 53)],
];

const insertAlert = db.prepare(`
  INSERT INTO alerts (alert_id, plant_id, machine_id, severity, title, description, status, production_impact, ai_confidence, ai_recommendation, sensor_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

alerts.forEach(a => {
  const createdAt = new Date(a[11] as number).toISOString();
  insertAlert.run(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], createdAt);
});

// Seed Risk Assessments
const risks = [
  [1, 'Production Delay: Line B', 'Raw material arrival predicted 2.5 hours late due to logistics bottleneck in Chakan', 'MEDIUM', 'MEDIUM RISK', 'clock'],
  [1, 'Abnormal Vibration: Oven 2', 'Sensor data indicates maintenance required within 24 hours to avoid thermal shutdown', 'MEDIUM', 'PREDICTIVE ALERT', 'activity'],
];

const insertRisk = db.prepare(`
  INSERT INTO risk_assessments (plant_id, title, description, risk_level, badge_text, icon_type, is_active)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

risks.forEach(r => insertRisk.run(...r));

// Seed AI Recommendations
db.prepare(`
  INSERT INTO ai_recommendations (alert_id, priority, category, title, explanation, uptime_gain, cost_avoidance, why_reasons, confidence_score)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  4,
  'HIGH PRIORITY',
  'MAINTENANCE',
  'Schedule Preventive Maintenance at 4 PM',
  'Our sensors detected abnormal vibration frequencies in Milling Machine #4. We predict a critical bearing failure will occur within the next 6 hours.',
  '4 Hours Saved',
  12500,
  JSON.stringify([
    { icon: 'moon', title: 'Avoid Night Shift Breakdown', description: 'A failure at 10 PM would result in zero production until tomorrow morning, as the maintenance crew is off-site.' },
    { icon: 'history', title: 'Historical Context', description: 'Similar vibration patterns in October led to a total spindle failure that cost ₹85,000 in parts alone.' }
  ]),
  94
);

// Seed Government Schemes
const schemes = [
  [
    'Credit Linked Capital Subsidy Scheme (CLCSS)',
    'CLCSS',
    'MINISTRY OF MSME, GOVT OF INDIA',
    'central',
    null,
    1500000,
    'subsidy',
    'Lakhs',
    'Specifically designed to facilitate technology up-gradation by providing 15% capital subsidy (up to ₹15 lakhs) to MSE units for the induction of well-established and improved technology across identified sub-sectors.',
    JSON.stringify(['Udyam Registered', 'Manufacturing Sector', 'Technology Upgrade']),
    JSON.stringify(['Udyam Registered Units', 'Technical Upgrade Only']),
    1
  ],
  [
    'Package Scheme of Incentives (PSI) 2019',
    'PSI 2019',
    'GOVERNMENT OF MAHARASHTRA',
    'state',
    'Maharashtra',
    500000,
    'interest_subsidy',
    'Per Annum',
    'Incentivizing the procurement of modern machinery through interest subsidies on loans, aimed at improving the competitiveness of units located in developing regions of the state.',
    JSON.stringify(['Zone C, D, or D+ Area', 'New Investment']),
    JSON.stringify(['Zone C, D, or D+ Area']),
    0
  ],
  [
    'Prime Minister Employment Generation Programme (PMEGP)',
    'PMEGP',
    'MINISTRY OF MSME, GOVT OF INDIA',
    'central',
    null,
    2500000,
    'subsidy',
    'Lakhs',
    'Credit-linked subsidy programme for setting up new micro-enterprises in non-farm sector.',
    JSON.stringify(['New Enterprise', 'Non-farm Sector']),
    JSON.stringify(['New Units Only', 'Non-farm Sector']),
    0
  ],
  [
    'Maharashtra State Innovation Society Grant',
    'MSIS Grant',
    'GOVERNMENT OF MAHARASHTRA',
    'state',
    'Maharashtra',
    1000000,
    'grant',
    'Lakhs',
    'Supporting innovative manufacturing solutions and Industry 4.0 adoption in Maharashtra.',
    JSON.stringify(['Innovation Focus', 'Industry 4.0']),
    JSON.stringify(['Innovation Projects', 'Maharashtra Based']),
    0
  ],
];

const insertScheme = db.prepare(`
  INSERT INTO government_schemes (name, short_name, ministry, level, state, max_benefit, benefit_type, benefit_unit, description, eligibility_criteria, tags, priority_match)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

schemes.forEach(s => insertScheme.run(...s));

// Seed Operations History
const operations = [
  [
    'OP-2023-1024-001',
    1,
    1,
    null,
    'resolved',
    'Spindle temperature exceeding normal operating range by 15%. Scheduled maintenance advised immediately to prevent bearing failure.',
    'warning',
    'Lubrication system purged and spindle bearings replaced by Suresh K.',
    'Suresh K.',
    'Machine restored to 100% capacity. Temperature normalized at 42°C.',
    45,
    '2023-10-24T10:53:00.000Z',
    '2023-10-24T11:38:00.000Z'
  ],
  [
    'OP-2023-1023-001',
    1,
    2,
    null,
    'critical_override',
    'Vibration patterns suggest tool breakage within next 20 cycles. Emergency stop recommended.',
    'critical',
    'Emergency stop initiated. Tool inspection revealed microfractures. Replaced with new tooling.',
    'Rajesh Kumar',
    'Prevented potential equipment damage. Production resumed after 35-minute pause.',
    35,
    '2023-10-23T16:35:00.000Z',
    '2023-10-23T17:10:00.000Z'
  ],
  [
    'OP-2023-1022-001',
    1,
    4,
    null,
    'resolved',
    'Hydraulic pressure below optimal range. Recommend checking hydraulic fluid levels.',
    'info',
    'Hydraulic fluid topped up and system bled by maintenance team.',
    'Amit P.',
    'Pressure restored to normal operating range. No production impact.',
    15,
    '2023-10-22T09:15:00.000Z',
    '2023-10-22T09:30:00.000Z'
  ],
];

const insertOperation = db.prepare(`
  INSERT INTO operations_history (operation_id, plant_id, machine_id, alert_id, status, ai_recommendation, ai_recommendation_severity, action_taken, action_taken_by, outcome, recovery_time_minutes, timestamp, resolved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

operations.forEach(o => insertOperation.run(...o));

console.log('Database seeded successfully!');
console.log('  - 1 plant');
console.log('  - 2 shifts');
console.log('  - 6 machines');
console.log('  - 4 alerts');
console.log('  - 2 risk assessments');
console.log('  - 1 AI recommendation');
console.log('  - 4 government schemes');
console.log('  - 3 operations history records');
