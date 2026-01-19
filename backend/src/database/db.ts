import Database, { Database as DatabaseType } from 'better-sqlite3';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

// Ensure data directory exists
const dataDir = path.dirname(config.dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db: DatabaseType = new Database(config.dbPath);
db.pragma('journal_mode = WAL');

// Create tables
const schema = `
-- Plants/Factories
CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    udyam_number TEXT,
    udyam_verified INTEGER DEFAULT 0,
    udyam_tier TEXT CHECK (udyam_tier IN ('Micro', 'Small', 'Medium')),
    udyam_category TEXT,
    overall_health INTEGER DEFAULT 100,
    status TEXT DEFAULT 'stable' CHECK (status IN ('stable', 'warning', 'critical')),
    last_ai_sync TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_current INTEGER DEFAULT 0,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- Machines
CREATE TABLE IF NOT EXISTS machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    plant_id INTEGER NOT NULL,
    department TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IDLE', 'WARNING', 'DOWN', 'MAINTENANCE')),
    load_percentage INTEGER DEFAULT 0,
    efficiency INTEGER DEFAULT 0,
    temperature REAL,
    vibration_level REAL,
    icon_type TEXT DEFAULT 'cog',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT UNIQUE NOT NULL,
    plant_id INTEGER NOT NULL,
    machine_id INTEGER,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO', 'SYSTEM')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    production_impact REAL,
    ai_confidence REAL,
    ai_recommendation TEXT,
    sensor_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TEXT,
    resolved_at TEXT,
    FOREIGN KEY (plant_id) REFERENCES plants(id),
    FOREIGN KEY (machine_id) REFERENCES machines(id)
);

-- Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    badge_text TEXT NOT NULL,
    icon_type TEXT DEFAULT 'alert-triangle',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER NOT NULL,
    priority TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    uptime_gain TEXT,
    cost_avoidance REAL,
    why_reasons TEXT,
    confidence_score REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES alerts(id)
);

-- Government Schemes
CREATE TABLE IF NOT EXISTS government_schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT,
    ministry TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('central', 'state')),
    state TEXT,
    max_benefit REAL,
    benefit_type TEXT,
    benefit_unit TEXT,
    description TEXT NOT NULL,
    eligibility_criteria TEXT,
    tags TEXT,
    priority_match INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Saved Schemes
CREATE TABLE IF NOT EXISTS saved_schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scheme_id INTEGER NOT NULL,
    saved_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scheme_id) REFERENCES government_schemes(id)
);

-- Operations History
CREATE TABLE IF NOT EXISTS operations_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id TEXT UNIQUE NOT NULL,
    plant_id INTEGER NOT NULL,
    machine_id INTEGER NOT NULL,
    alert_id INTEGER,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'resolved', 'critical_override', 'escalated')),
    ai_recommendation TEXT NOT NULL,
    ai_recommendation_severity TEXT CHECK (ai_recommendation_severity IN ('info', 'warning', 'critical')),
    action_taken TEXT,
    action_taken_by TEXT,
    outcome TEXT,
    recovery_time_minutes INTEGER,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    FOREIGN KEY (plant_id) REFERENCES plants(id),
    FOREIGN KEY (machine_id) REFERENCES machines(id),
    FOREIGN KEY (alert_id) REFERENCES alerts(id)
);

-- Linked Policy Recommendations (bridges Ops Monitor → Policy Hunter)
CREATE TABLE IF NOT EXISTS linked_policy_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recommendation_id INTEGER NOT NULL,
    alert_id INTEGER NOT NULL,
    operational_context TEXT NOT NULL,
    matched_schemes TEXT NOT NULL,
    total_potential_benefit REAL,
    priority_match_count INTEGER DEFAULT 0,
    whatsapp_message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'applied', 'dismissed')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    viewed_at TEXT,
    FOREIGN KEY (recommendation_id) REFERENCES ai_recommendations(id),
    FOREIGN KEY (alert_id) REFERENCES alerts(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_machines_plant ON machines(plant_id);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_alerts_plant ON alerts(plant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_operations_plant ON operations_history(plant_id);
CREATE INDEX IF NOT EXISTS idx_operations_timestamp ON operations_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_linked_policies_recommendation ON linked_policy_recommendations(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_linked_policies_alert ON linked_policy_recommendations(alert_id);
`;

// Execute schema
db.exec(schema);

export default db;
