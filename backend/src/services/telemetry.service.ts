import sql from '../database/db';

interface SensorConfig {
  sensor_type: string;
  unit: string;
  normal_min: number;
  normal_max: number;
  critical_max?: number;
  critical_min?: number;
}

interface TelemetryReading {
  sensor_type: string;
  value: number;
  unit?: string;
}

interface MachineRow {
  id: number;
  machine_id: string;
  name: string;
  type: string;
  department: string;
  status: string;
  sensor_configs: string;
  hourly_downtime_cost: number;
  plant_id: number;
}

interface IngestResult {
  stored: number;
  anomalies: AnomalyResult[];
  alertsCreated: number;
  downtimeTriggered: boolean;
}

interface AnomalyResult {
  sensor_type: string;
  value: number;
  severity: 'WARNING' | 'CRITICAL';
  alert_id?: number;
}

/**
 * Ingest telemetry readings for a machine.
 * Checks each reading against configured thresholds and auto-creates alerts on anomalies.
 */
export async function ingestTelemetry(machineId: number, readings: TelemetryReading[]): Promise<IngestResult> {
  const [machine] = await sql<MachineRow[]>`SELECT * FROM machines WHERE id = ${machineId}`;
  if (!machine) throw new Error(`Machine ${machineId} not found`);

  const sensorConfigs: SensorConfig[] = (() => {
    try { return JSON.parse(machine.sensor_configs || '[]'); } catch { return []; }
  })();

  const now = new Date().toISOString();
  const anomalies: AnomalyResult[] = [];
  let alertsCreated = 0;
  let downtimeTriggered = false;

  for (const reading of readings) {
    const config = sensorConfigs.find(c => c.sensor_type === reading.sensor_type);
    const thresholds = config || getDefaultThresholds(reading.sensor_type);

    let isAnomaly = 0;
    let severity: 'WARNING' | 'CRITICAL' | null = null;

    if (thresholds) {
      const val = reading.value;
      const critMax = thresholds.critical_max ?? thresholds.normal_max * 1.5;
      const critMin = thresholds.critical_min ?? thresholds.normal_min * 0.5;
      const warnMax = thresholds.normal_max;
      const warnMin = thresholds.normal_min;

      if (val > critMax || val < critMin) {
        isAnomaly = 1;
        severity = 'CRITICAL';
      } else if (val > warnMax || val < warnMin) {
        isAnomaly = 1;
        severity = 'WARNING';
      }
    }

    // Store telemetry reading
    const [telRow] = await sql`
      INSERT INTO telemetry_events (machine_id, sensor_type, value, unit, is_anomaly, anomaly_severity, recorded_at)
      VALUES (${machineId}, ${reading.sensor_type}, ${reading.value}, ${reading.unit || null}, ${isAnomaly}, ${severity}, ${now})
      RETURNING id
    `;

    // Update machine's live sensor columns for known sensor types
    if (reading.sensor_type === 'temperature') {
      await sql`UPDATE machines SET temperature = ${reading.value} WHERE id = ${machineId}`;
    } else if (reading.sensor_type === 'vibration') {
      await sql`UPDATE machines SET vibration_level = ${reading.value} WHERE id = ${machineId}`;
    } else if (reading.sensor_type === 'load') {
      await sql`UPDATE machines SET load_percentage = ${reading.value} WHERE id = ${machineId}`;
    }

    if (isAnomaly && severity) {
      const sensorId = `TEL-${reading.sensor_type.toUpperCase()}-${machineId}`;
      const existing = await sql<{ id: number }[]>`
        SELECT id FROM alerts WHERE machine_id = ${machineId} AND sensor_id = ${sensorId} AND status = 'active'
      `;

      let alertId: number | undefined;

      if (existing.length === 0) {
        const alertDbId = `#AL-${machine.machine_id}-${reading.sensor_type.slice(0, 3).toUpperCase()}-${Date.now()}`;
        const alertConfig = buildAlertConfig(machine, reading.sensor_type, reading.value, severity);

        const [alertRow] = await sql`
          INSERT INTO alerts (alert_id, plant_id, machine_id, severity, title, description,
            status, production_impact, ai_confidence, sensor_id, created_at)
          VALUES (${alertDbId}, ${machine.plant_id}, ${machineId}, ${severity},
            ${alertConfig.title}, ${alertConfig.description},
            'active', ${alertConfig.impact}, ${Math.floor(Math.random() * 10) + 85},
            ${sensorId}, ${now})
          RETURNING id
        `;
        alertId = alertRow.id;
        alertsCreated++;

        // Link telemetry row to alert
        await sql`UPDATE telemetry_events SET triggered_alert_id = ${alertId as number} WHERE id = ${telRow.id}`;
      } else {
        alertId = existing[0].id;
      }

      anomalies.push({ sensor_type: reading.sensor_type, value: reading.value, severity, alert_id: alertId });
    }
  }

  // Update machine status based on worst anomaly
  const hasCritical = anomalies.some(a => a.severity === 'CRITICAL');
  const hasWarning  = anomalies.some(a => a.severity === 'WARNING');

  if (hasCritical) {
    await sql`UPDATE machines SET status = 'DOWN' WHERE id = ${machineId}`;

    const ongoingDowntime = await sql`
      SELECT id FROM downtime_events WHERE machine_id = ${machineId} AND status = 'ongoing'
    `;

    if (ongoingDowntime.length === 0) {
      await sql`
        INSERT INTO downtime_events (machine_id, triggered_by_alert_id, start_time, cause, status, created_at)
        VALUES (${machineId},
          ${anomalies.find(a => a.alert_id)?.alert_id || null},
          ${now},
          ${`Telemetry anomaly: ${anomalies.map(a => a.sensor_type).join(', ')}`},
          'ongoing', ${now})
      `;
      downtimeTriggered = true;
    }
  } else if (hasWarning) {
    await sql`UPDATE machines SET status = 'WARNING' WHERE id = ${machineId}`;
  }

  return { stored: readings.length, anomalies, alertsCreated, downtimeTriggered };
}

export async function getLatestReadings(machineId: number) {
  return sql`
    SELECT sensor_type, value, unit, is_anomaly, anomaly_severity, recorded_at
    FROM telemetry_events
    WHERE machine_id = ${machineId}
      AND recorded_at = (
        SELECT MAX(recorded_at) FROM telemetry_events t2
        WHERE t2.machine_id = telemetry_events.machine_id
          AND t2.sensor_type = telemetry_events.sensor_type
      )
    ORDER BY sensor_type
  `;
}

export async function getReadingHistory(machineId: number, sensorType: string, hours = 24) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  return sql`
    SELECT value, unit, is_anomaly, anomaly_severity, recorded_at
    FROM telemetry_events
    WHERE machine_id = ${machineId} AND sensor_type = ${sensorType} AND recorded_at >= ${since}
    ORDER BY recorded_at ASC
  `;
}

// --- Helpers ---

function getDefaultThresholds(sensorType: string): SensorConfig | null {
  const defaults: Record<string, SensorConfig> = {
    temperature: { sensor_type: 'temperature', unit: '°C',   normal_min: 20,  normal_max: 75,   critical_max: 90  },
    vibration:   { sensor_type: 'vibration',   unit: 'mm/s', normal_min: 0,   normal_max: 5,    critical_max: 10  },
    load:        { sensor_type: 'load',        unit: '%',    normal_min: 0,   normal_max: 85,   critical_max: 95  },
    rpm:         { sensor_type: 'rpm',         unit: 'RPM',  normal_min: 100, normal_max: 3000, critical_max: 3500 },
    pressure:    { sensor_type: 'pressure',    unit: 'bar',  normal_min: 2,   normal_max: 8,    critical_max: 10  },
    current:     { sensor_type: 'current',     unit: 'A',    normal_min: 0,   normal_max: 50,   critical_max: 65  },
  };
  return defaults[sensorType] || null;
}

function buildAlertConfig(
  machine: MachineRow,
  sensorType: string,
  value: number,
  severity: 'WARNING' | 'CRITICAL'
): { title: string; description: string; impact: number } {
  const isCritical = severity === 'CRITICAL';
  const labels: Record<string, { unit: string; noun: string }> = {
    temperature: { unit: '°C',   noun: 'Temperature' },
    vibration:   { unit: 'mm/s', noun: 'Vibration'   },
    load:        { unit: '%',    noun: 'Load'         },
    rpm:         { unit: 'RPM',  noun: 'RPM'          },
    pressure:    { unit: 'bar',  noun: 'Pressure'     },
    current:     { unit: 'A',    noun: 'Current'      },
  };
  const label = labels[sensorType] || { unit: '', noun: sensorType };

  return {
    title: `${isCritical ? 'CRITICAL' : 'WARNING'}: ${label.noun} Anomaly — ${machine.name}`,
    description:
      `${label.noun} reading of ${value.toFixed(1)} ${label.unit} detected on ${machine.name} (${machine.type}). ` +
      (isCritical
        ? 'Threshold critically exceeded. Immediate inspection required to prevent equipment damage or failure.'
        : 'Reading outside normal operating range. Monitor closely and consider scheduling maintenance.'),
    impact: isCritical ? -20 : -10,
  };
}
