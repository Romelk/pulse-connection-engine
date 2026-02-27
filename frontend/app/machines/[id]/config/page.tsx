'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { machinesAPI, machineConfigAPI, telemetryAPI } from '@/lib/api/client';
import { Plus, Trash2, Save, Activity, TrendingDown, Clock } from 'lucide-react';
import { localAdminSidebar } from '@/lib/sidebarConfig';
import { useCurrentUser } from '@/lib/auth';


interface SensorConfig {
  sensor_type: string;
  unit: string;
  normal_min: number;
  normal_max: number;
  critical_max: number;
}

const SENSOR_PRESETS: Record<string, SensorConfig> = {
  temperature: { sensor_type: 'temperature', unit: '°C',   normal_min: 20,  normal_max: 75,   critical_max: 90  },
  vibration:   { sensor_type: 'vibration',   unit: 'mm/s', normal_min: 0,   normal_max: 5,    critical_max: 10  },
  rpm:         { sensor_type: 'rpm',         unit: 'RPM',  normal_min: 100, normal_max: 3000, critical_max: 3500 },
  load:        { sensor_type: 'load',        unit: '%',    normal_min: 0,   normal_max: 85,   critical_max: 95  },
  pressure:    { sensor_type: 'pressure',    unit: 'bar',  normal_min: 2,   normal_max: 8,    critical_max: 10  },
  current:     { sensor_type: 'current',     unit: 'A',    normal_min: 0,   normal_max: 50,   critical_max: 65  },
};

export default function MachineConfigPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useCurrentUser();
  const machineId = parseInt(params.id as string);

  const [machine, setMachine] = useState<any>(null);
  const [latestReadings, setLatestReadings] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [purchaseCost, setPurchaseCost]             = useState('');
  const [hourlyDowntimeCost, setHourlyDowntimeCost] = useState('');
  const [plannedHours, setPlannedHours]             = useState('8');
  const [department, setDepartment]                 = useState('');
  const [notes, setNotes]                           = useState('');
  const [sensors, setSensors]                       = useState<SensorConfig[]>([]);

  useEffect(() => {
    async function load() {
      const [m, readings] = await Promise.all([
        machinesAPI.getById(machineId),
        telemetryAPI.getLatest(machineId).catch(() => ({ readings: [] })),
      ]);
      setMachine(m);
      setLatestReadings((readings as any).readings || []);
      // Pre-fill form
      setPurchaseCost(m.purchase_cost ? String(m.purchase_cost) : '');
      setHourlyDowntimeCost(m.hourly_downtime_cost ? String(m.hourly_downtime_cost) : '');
      setPlannedHours(m.planned_hours_per_day ? String(m.planned_hours_per_day) : '8');
      setDepartment(m.department || '');
      setNotes(m.notes || '');
      try { setSensors(JSON.parse(m.sensor_configs || '[]')); } catch { setSensors([]); }
    }
    load().catch(console.error);
  }, [machineId]);

  const addSensorPreset = (key: string) => {
    if (sensors.find(s => s.sensor_type === key)) return;
    setSensors(prev => [...prev, { ...SENSOR_PRESETS[key] }]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await machineConfigAPI.updateConfig(machineId, {
        purchase_cost:        purchaseCost        ? parseInt(purchaseCost)       : undefined,
        hourly_downtime_cost: hourlyDowntimeCost  ? parseInt(hourlyDowntimeCost) : undefined,
        planned_hours_per_day: plannedHours       ? parseInt(plannedHours)       : undefined,
        sensor_configs: sensors,
        notes, department,
      });
      addToast({ type: 'success', title: 'Configuration Saved', message: 'Machine economics and sensor thresholds updated.' });
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!machine) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;

  const hourlyLoss = parseInt(hourlyDowntimeCost) || 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sections={localAdminSidebar} currentPath="/machines" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header appName="PulseAI" appSubtitle={`Configure: ${machine.name}`} showSearch={false} userName={user?.name || ''} userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'} userLocation={user?.company_name || ''} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Config Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Economics */}
              <Card className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-500" /> Machine Economics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost (₹)</label>
                    <input type="number" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)}
                      placeholder="850000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost / Hour Downtime (₹)</label>
                    <input type="number" value={hourlyDowntimeCost} onChange={e => setHourlyDowntimeCost(e.target.value)}
                      placeholder="12000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planned Hours / Day</label>
                    <input type="number" value={plannedHours} onChange={e => setPlannedHours(e.target.value)}
                      min="1" max="24" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                {hourlyLoss > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
                    A 4-hour downtime on this machine = <strong>₹{(hourlyLoss * 4).toLocaleString('en-IN')}</strong> production loss (before repair costs).
                    Government scheme threshold: ₹50,000.
                  </div>
                )}
              </Card>

              {/* Sensor Configs */}
              <Card className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Sensor Thresholds
                </h2>
                <p className="text-sm text-gray-500 mb-3">Readings outside normal range trigger warnings. Readings past critical max trigger CRITICAL alerts and downtime events.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(SENSOR_PRESETS).map(key => (
                    <button key={key} onClick={() => addSensorPreset(key)}
                      disabled={!!sensors.find(s => s.sensor_type === key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition
                        ${sensors.find(s => s.sensor_type === key)
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}>
                      <Plus className="w-3 h-3 inline mr-1" />{key}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {sensors.map((sensor, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 capitalize">{sensor.sensor_type} <span className="text-gray-400 font-normal">({sensor.unit})</span></span>
                        <button onClick={() => setSensors(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['normal_min', 'normal_max', 'critical_max'] as const).map(field => (
                          <div key={field}>
                            <label className="block text-xs text-gray-500 mb-1">{field.replace(/_/g, ' ')}</label>
                            <input type="number" value={sensor[field]}
                              onChange={e => setSensors(prev => prev.map((s, i) => i === idx ? { ...s, [field]: parseFloat(e.target.value) } : s))}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-end gap-3">
                <Button onClick={() => router.push('/machines')} variant="secondary">Cancel</Button>
                <Button onClick={handleSave} variant="primary" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />{isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>

            {/* Right: Live Readings */}
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" /> Latest Telemetry
                </h3>
                {latestReadings.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No telemetry received yet. Use the Simulator to send test readings.</p>
                ) : (
                  <div className="space-y-2">
                    {latestReadings.map((r: any) => (
                      <div key={r.sensor_type} className={`flex justify-between items-center p-2 rounded text-xs
                        ${r.is_anomaly ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                        <span className="font-medium capitalize text-gray-700">{r.sensor_type}</span>
                        <span className={`font-semibold ${r.is_anomaly ? 'text-red-600' : 'text-gray-900'}`}>
                          {r.value?.toFixed(1)} {r.unit}
                          {r.is_anomaly && <span className="ml-1 text-red-500">⚠</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Machine Info
                </h3>
                <dl className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between"><dt>ID</dt><dd className="font-mono text-gray-400">{machine.machine_id}</dd></div>
                  <div className="flex justify-between"><dt>Type</dt><dd>{machine.type}</dd></div>
                  <div className="flex justify-between"><dt>Status</dt>
                    <dd><span className={`px-1.5 py-0.5 rounded text-xs font-medium
                      ${machine.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        machine.status === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                        machine.status === 'DOWN' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {machine.status}
                    </span></dd>
                  </div>
                  <div className="flex justify-between"><dt>Economics</dt>
                    <dd><span className={`px-1.5 py-0.5 rounded text-xs ${machine.economics_configured ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {machine.economics_configured ? 'Configured' : 'Pending'}
                    </span></dd>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
