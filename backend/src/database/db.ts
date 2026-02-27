import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pulseai', {
  // Return timestamps as ISO strings (matching SQLite TEXT behaviour)
  types: {
    timestamp_with_timezone: {
      to: 1184,
      from: [1114, 1184],
      serialize: (v: string | Date) => (v instanceof Date ? v.toISOString() : v),
      parse: (v: string) => v,
    },
  },
  max: 10,
  idle_timeout: 30,
});

export async function initDB(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS plants (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      location      TEXT NOT NULL,
      state         TEXT NOT NULL,
      industry      TEXT,
      udyam_number  TEXT,
      udyam_verified INTEGER DEFAULT 0,
      udyam_tier    TEXT CHECK (udyam_tier IN ('Micro', 'Small', 'Medium')),
      udyam_category TEXT,
      overall_health INTEGER DEFAULT 100,
      status        TEXT DEFAULT 'stable' CHECK (status IN ('stable', 'warning', 'critical')),
      last_ai_sync  TEXT,
      created_at    TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shifts (
      id         SERIAL PRIMARY KEY,
      plant_id   INTEGER NOT NULL REFERENCES plants(id),
      name       TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time   TEXT NOT NULL,
      is_current INTEGER DEFAULT 0
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS machines (
      id                    SERIAL PRIMARY KEY,
      machine_id            TEXT UNIQUE NOT NULL,
      name                  TEXT NOT NULL,
      type                  TEXT NOT NULL,
      plant_id              INTEGER NOT NULL REFERENCES plants(id),
      department            TEXT,
      status                TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IDLE', 'WARNING', 'DOWN', 'MAINTENANCE')),
      load_percentage       INTEGER DEFAULT 0,
      efficiency            INTEGER DEFAULT 0,
      temperature           REAL,
      vibration_level       REAL,
      icon_type             TEXT DEFAULT 'cog',
      notes                 TEXT,
      purchase_cost         INTEGER DEFAULT 0,
      hourly_downtime_cost  INTEGER DEFAULT 0,
      planned_hours_per_day INTEGER DEFAULT 8,
      sensor_configs        TEXT DEFAULT '[]',
      economics_configured  INTEGER DEFAULT 0,
      created_at            TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS telemetry_events (
      id               SERIAL PRIMARY KEY,
      machine_id       INTEGER NOT NULL REFERENCES machines(id),
      sensor_type      TEXT NOT NULL,
      value            REAL NOT NULL,
      unit             TEXT,
      is_anomaly       INTEGER DEFAULT 0,
      anomaly_severity TEXT,
      triggered_alert_id INTEGER,
      recorded_at      TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS downtime_events (
      id                    SERIAL PRIMARY KEY,
      machine_id            INTEGER NOT NULL REFERENCES machines(id),
      triggered_by_alert_id INTEGER,
      start_time            TEXT NOT NULL,
      end_time              TEXT,
      duration_hours        REAL,
      repair_cost           INTEGER,
      repair_description    TEXT,
      cause                 TEXT,
      status                TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'resolved')),
      total_loss            INTEGER,
      scheme_triggered      INTEGER DEFAULT 0,
      created_at            TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expansion_intents (
      id               SERIAL PRIMARY KEY,
      company_id       INTEGER,
      business_goal    TEXT NOT NULL,
      investment_range TEXT,
      timeline         TEXT,
      sector           TEXT,
      current_capacity TEXT,
      target_capacity  TEXT,
      state            TEXT DEFAULT 'Maharashtra',
      matched_schemes  TEXT,
      gap_analysis     TEXT,
      status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'gap_identified')),
      created_at       TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS alerts (
      id                SERIAL PRIMARY KEY,
      alert_id          TEXT UNIQUE NOT NULL,
      plant_id          INTEGER NOT NULL REFERENCES plants(id),
      machine_id        INTEGER REFERENCES machines(id),
      severity          TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO', 'SYSTEM')),
      title             TEXT NOT NULL,
      description       TEXT NOT NULL,
      status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
      production_impact REAL,
      ai_confidence     REAL,
      ai_recommendation TEXT,
      sensor_id         TEXT,
      created_at        TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      acknowledged_at   TEXT,
      resolved_at       TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS risk_assessments (
      id          SERIAL PRIMARY KEY,
      plant_id    INTEGER NOT NULL REFERENCES plants(id),
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      risk_level  TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      badge_text  TEXT NOT NULL,
      icon_type   TEXT DEFAULT 'alert-triangle',
      is_active   INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ai_recommendations (
      id               SERIAL PRIMARY KEY,
      alert_id         INTEGER NOT NULL REFERENCES alerts(id),
      priority         TEXT NOT NULL,
      category         TEXT NOT NULL,
      title            TEXT NOT NULL,
      explanation      TEXT NOT NULL,
      uptime_gain      TEXT,
      cost_avoidance   REAL,
      why_reasons      TEXT,
      confidence_score REAL,
      created_at       TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS government_schemes (
      id                   SERIAL PRIMARY KEY,
      name                 TEXT NOT NULL,
      short_name           TEXT,
      ministry             TEXT NOT NULL,
      level                TEXT NOT NULL CHECK (level IN ('central', 'state')),
      state                TEXT,
      max_benefit          REAL,
      benefit_type         TEXT,
      benefit_unit         TEXT,
      description          TEXT NOT NULL,
      eligibility_criteria TEXT,
      tags                 TEXT,
      priority_match       INTEGER DEFAULT 0,
      is_active            INTEGER DEFAULT 1,
      created_at           TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_schemes (
      id         SERIAL PRIMARY KEY,
      scheme_id  INTEGER NOT NULL REFERENCES government_schemes(id),
      saved_at   TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scheme_applications (
      id              SERIAL PRIMARY KEY,
      scheme_id       INTEGER NOT NULL REFERENCES government_schemes(id),
      plant_id        INTEGER NOT NULL REFERENCES plants(id),
      status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
      company_name    TEXT,
      udyam_number    TEXT,
      udyam_tier      TEXT,
      state           TEXT,
      industry        TEXT,
      machine_count   INTEGER,
      purpose         TEXT,
      estimated_cost  REAL,
      notes           TEXT,
      created_at      TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      updated_at      TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS operations_history (
      id                           SERIAL PRIMARY KEY,
      operation_id                 TEXT UNIQUE NOT NULL,
      plant_id                     INTEGER NOT NULL REFERENCES plants(id),
      machine_id                   INTEGER NOT NULL REFERENCES machines(id),
      alert_id                     INTEGER REFERENCES alerts(id),
      status                       TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'resolved', 'critical_override', 'escalated')),
      ai_recommendation            TEXT NOT NULL,
      ai_recommendation_severity   TEXT CHECK (ai_recommendation_severity IN ('info', 'warning', 'critical')),
      action_taken                 TEXT,
      action_taken_by              TEXT,
      outcome                      TEXT,
      recovery_time_minutes        INTEGER,
      timestamp                    TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      resolved_at                  TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS linked_policy_recommendations (
      id                      SERIAL PRIMARY KEY,
      recommendation_id       INTEGER NOT NULL REFERENCES ai_recommendations(id),
      alert_id                INTEGER NOT NULL REFERENCES alerts(id),
      operational_context     TEXT NOT NULL,
      matched_schemes         TEXT NOT NULL,
      total_potential_benefit REAL,
      priority_match_count    INTEGER DEFAULT 0,
      whatsapp_message        TEXT,
      status                  TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'applied', 'dismissed')),
      created_at              TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      viewed_at               TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL,
      bio           TEXT,
      photo_url     TEXT,
      linkedin_url  TEXT,
      email         TEXT,
      display_order INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      updated_at    TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL CHECK (role IN ('super_admin', 'local_admin')),
      company_id INTEGER REFERENCES plants(id),
      name       TEXT NOT NULL,
      created_at TEXT DEFAULT to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_machines_plant     ON machines(plant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_machines_status    ON machines(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_alerts_plant       ON alerts(plant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_alerts_status      ON alerts(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_alerts_severity    ON alerts(severity)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_operations_plant   ON operations_history(plant_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_operations_ts      ON operations_history(timestamp)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_linked_rec         ON linked_policy_recommendations(recommendation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_linked_alert       ON linked_policy_recommendations(alert_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_team_order         ON team_members(display_order)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_company      ON users(company_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_telemetry_machine  ON telemetry_events(machine_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_telemetry_recorded ON telemetry_events(recorded_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_downtime_machine   ON downtime_events(machine_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_downtime_status    ON downtime_events(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_expansion_status   ON expansion_intents(status)`;
}

export default sql;
