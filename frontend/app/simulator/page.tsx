'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  Thermometer,
  Activity,
  Gauge,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  CheckCircle,
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { simulatorAPI, telemetryAPI, downtimeAPI } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getLocalAdminSidebar } from '@/lib/sidebarConfig';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Machine {
  id: number;
  machine_id: string;
  name: string;
  type: string;
  department: string;
  status: string;
  temperature: number | null;
  vibration_level: number | null;
  load_percentage: number | null;
}

interface Thresholds {
  temperature: { normal: { min: number; max: number }; warning: { min: number; max: number }; critical: { min: number; max: number } };
  vibration: { normal: { min: number; max: number }; warning: { min: number; max: number }; critical: { min: number; max: number } };
  load: { normal: { min: number; max: number }; warning: { min: number; max: number }; critical: { min: number; max: number } };
}

interface Alert {
  id: number;
  alert_id: string;
  severity: string;
  title: string;
  description: string;
}


function getStatusColor(value: number, thresholds: { normal: { max: number }; warning: { max: number }; critical: { min: number } }) {
  if (value >= thresholds.critical.min) return 'red';
  if (value >= thresholds.warning.max) return 'orange';
  return 'green';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'DOWN':
      return <Badge variant="danger">DOWN</Badge>;
    case 'WARNING':
      return <Badge variant="warning">WARNING</Badge>;
    case 'ACTIVE':
      return <Badge variant="success">ACTIVE</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function SimulatorPage() {
  const router = useRouter();
  const { user, isSuperAdmin, ready } = useCurrentUser();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [generatedAlerts, setGeneratedAlerts] = useState<Alert[]>([]);
  const [telemetryResult, setTelemetryResult] = useState<any>(null);
  const [sendingTelemetry, setSendingTelemetry] = useState(false);

  // Parameter values
  const [temperature, setTemperature] = useState(35);
  const [vibration, setVibration] = useState(2);
  const [load, setLoad] = useState(50);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/login'); return; }
    if (isSuperAdmin) { router.replace('/admin'); return; }
    loadMachines();
  }, [ready, user, isSuperAdmin]);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const data = await simulatorAPI.getMachines();
      setMachines(data.machines);
      setThresholds(data.thresholds);
      if (data.machines.length > 0 && !selectedMachine) {
        setSelectedMachine(data.machines[0]);
        // Set initial values from machine
        setTemperature(data.machines[0].temperature ?? 35);
        setVibration(data.machines[0].vibration_level ?? 2);
        setLoad(data.machines[0].load_percentage ?? 50);
      }
    } catch (error) {
      console.error('Error loading machines:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load machines',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMachineSelect = (machine: Machine) => {
    setSelectedMachine(machine);
    setTemperature(machine.temperature ?? 35);
    setVibration(machine.vibration_level ?? 2);
    setLoad(machine.load_percentage ?? 50);
    setGeneratedAlerts([]);
    setTelemetryResult(null);
  };

  // Send readings through the real telemetry ingest pipeline
  const handleSendTelemetry = async () => {
    if (!selectedMachine) return;
    setSendingTelemetry(true);
    try {
      const result = await telemetryAPI.ingest({
        machine_id: selectedMachine.id,
        readings: [
          { sensor_type: 'temperature', value: temperature, unit: '°C'   },
          { sensor_type: 'vibration',   value: vibration,   unit: 'mm/s' },
          { sensor_type: 'load',        value: load,        unit: '%'    },
        ],
      });
      setTelemetryResult(result);
      await loadMachines(); // refresh machine status
      if (result.anomaliesDetected > 0) {
        addToast({ type: 'warning', title: 'Anomalies Detected via Telemetry', message: `${result.alertsCreated} alert(s) created. ${result.downtimeTriggered ? 'Downtime event opened!' : ''}` });
      } else {
        addToast({ type: 'success', title: 'Telemetry Ingested', message: 'All readings within normal range.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Ingest Failed', message: 'Could not send telemetry.' });
    } finally {
      setSendingTelemetry(false);
    }
  };

  const handleApplyParameters = async () => {
    if (!selectedMachine) return;

    try {
      setUpdating(true);
      const result = await simulatorAPI.updateMachine({
        machineId: selectedMachine.id,
        temperature,
        vibration,
        load,
      });

      // Update machine in list
      setMachines(prev => prev.map(m =>
        m.id === selectedMachine.id ? result.machine : m
      ));
      setSelectedMachine(result.machine);

      // Store generated alerts
      if (result.alerts && result.alerts.length > 0) {
        setGeneratedAlerts(result.alerts);
        addToast({
          type: 'warning',
          title: 'Alerts Generated',
          message: `${result.alerts.length} alert(s) created based on parameter thresholds`,
        });
      } else {
        setGeneratedAlerts([]);
        addToast({
          type: 'success',
          title: 'Parameters Updated',
          message: 'Machine parameters updated. All values within normal range.',
        });
      }

      if (result.statusChanged) {
        addToast({
          type: result.newStatus === 'ACTIVE' ? 'success' : 'warning',
          title: 'Status Changed',
          message: `Machine status changed from ${result.previousStatus} to ${result.newStatus}`,
        });
      }
    } catch (error) {
      console.error('Error updating machine:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update machine parameters',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleResetMachine = async () => {
    if (!selectedMachine) return;

    try {
      setUpdating(true);
      const result = await simulatorAPI.resetMachine(selectedMachine.id);

      // Reset local state
      setTemperature(35);
      setVibration(2);
      setLoad(50);
      setGeneratedAlerts([]);

      // Reload machines
      await loadMachines();

      addToast({
        type: 'success',
        title: 'Machine Reset',
        message: `${selectedMachine.name} has been reset to normal state. ${result.alertsResolved} alert(s) resolved.`,
      });
    } catch (error) {
      console.error('Error resetting machine:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to reset machine',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleResetAll = async () => {
    try {
      setUpdating(true);
      await simulatorAPI.resetAll();

      // Reset local state
      setTemperature(35);
      setVibration(2);
      setLoad(50);
      setGeneratedAlerts([]);

      // Reload machines
      await loadMachines();

      addToast({
        type: 'success',
        title: 'All Machines Reset',
        message: 'All machines have been reset to normal state.',
      });
    } catch (error) {
      console.error('Error resetting all machines:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to reset all machines',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!ready || !user || isSuperAdmin) return null;

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Header
          appName="PulseAI"
          appSubtitle="Machine Simulator"
          showSearch={false}
          userName={user?.name || ''}
          userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'}
          userLocation={user?.company_name || ''}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading simulator...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="PulseAI"
        appSubtitle="Machine Simulator"
        showSearch={false}
        userName={user?.name || ''}
        userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'}
        userLocation={user?.company_name || ''}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={getLocalAdminSidebar(t)} currentPath="/simulator" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{t('simulator.pageTitle')}</h1>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">DEMO ONLY</span>
                </div>
                <p className="text-gray-600">{t('simulator.pageSubtitle')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={loadMachines}>
                  Refresh
                </Button>
                <Button variant="outline" icon={<RotateCcw className="w-4 h-4" />} onClick={handleResetAll}>
                  Reset All Machines
                </Button>
                <Link href="/overview">
                  <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">How to use this simulator</p>
                <p className="text-sm text-blue-700 mt-1">
                  1. Select a machine from the list below. 2. Adjust the parameter sliders to push values beyond thresholds.
                  3. Click "Apply Parameters" to update the machine and generate alerts. 4. Navigate to the Dashboard to see the alerts and follow the application flow.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Machine Selection */}
              <div className="col-span-1">
                <Card className="h-full">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('simulator.selectMachine')}</h3>
                  <div className="space-y-2">
                    {machines.map(machine => (
                      <button
                        key={machine.id}
                        onClick={() => handleMachineSelect(machine)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedMachine?.id === machine.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{machine.name}</span>
                          {getStatusBadge(machine.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{machine.type} • {machine.department}</p>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Parameter Controls */}
              <div className="col-span-2">
                {selectedMachine && thresholds && (
                  <Card>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedMachine.name}</h3>
                        <p className="text-sm text-gray-500">{selectedMachine.type} • {selectedMachine.machine_id}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(selectedMachine.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<RotateCcw className="w-4 h-4" />}
                          onClick={handleResetMachine}
                          disabled={updating}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>

                    {/* Temperature Slider */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Thermometer className={`w-5 h-5 ${
                            getStatusColor(temperature, thresholds.temperature) === 'red' ? 'text-red-500' :
                            getStatusColor(temperature, thresholds.temperature) === 'orange' ? 'text-orange-500' :
                            'text-green-500'
                          }`} />
                          <span className="font-medium text-gray-700">Temperature</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            getStatusColor(temperature, thresholds.temperature) === 'red' ? 'text-red-600' :
                            getStatusColor(temperature, thresholds.temperature) === 'orange' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {temperature}°C
                          </span>
                          {temperature >= thresholds.temperature.critical.min && (
                            <Badge variant="danger" size="sm">CRITICAL</Badge>
                          )}
                          {temperature >= thresholds.temperature.warning.min && temperature < thresholds.temperature.critical.min && (
                            <Badge variant="warning" size="sm">WARNING</Badge>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>20°C</span>
                        <span className="text-orange-500">Warning: {thresholds.temperature.warning.min}°C</span>
                        <span className="text-red-500">Critical: {thresholds.temperature.critical.min}°C</span>
                        <span>100°C</span>
                      </div>
                    </div>

                    {/* Vibration Slider */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className={`w-5 h-5 ${
                            getStatusColor(vibration, thresholds.vibration) === 'red' ? 'text-red-500' :
                            getStatusColor(vibration, thresholds.vibration) === 'orange' ? 'text-orange-500' :
                            'text-green-500'
                          }`} />
                          <span className="font-medium text-gray-700">Vibration Level</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            getStatusColor(vibration, thresholds.vibration) === 'red' ? 'text-red-600' :
                            getStatusColor(vibration, thresholds.vibration) === 'orange' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {vibration.toFixed(1)} mm/s
                          </span>
                          {vibration >= thresholds.vibration.critical.min && (
                            <Badge variant="danger" size="sm">CRITICAL</Badge>
                          )}
                          {vibration >= thresholds.vibration.warning.min && vibration < thresholds.vibration.critical.min && (
                            <Badge variant="warning" size="sm">WARNING</Badge>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="0.5"
                        value={vibration}
                        onChange={(e) => setVibration(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0 mm/s</span>
                        <span className="text-orange-500">Warning: {thresholds.vibration.warning.min} mm/s</span>
                        <span className="text-red-500">Critical: {thresholds.vibration.critical.min} mm/s</span>
                        <span>15 mm/s</span>
                      </div>
                    </div>

                    {/* Load Slider */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Gauge className={`w-5 h-5 ${
                            getStatusColor(load, thresholds.load) === 'red' ? 'text-red-500' :
                            getStatusColor(load, thresholds.load) === 'orange' ? 'text-orange-500' :
                            'text-green-500'
                          }`} />
                          <span className="font-medium text-gray-700">Load Percentage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            getStatusColor(load, thresholds.load) === 'red' ? 'text-red-600' :
                            getStatusColor(load, thresholds.load) === 'orange' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {load}%
                          </span>
                          {load >= thresholds.load.critical.min && (
                            <Badge variant="danger" size="sm">CRITICAL</Badge>
                          )}
                          {load >= thresholds.load.warning.min && load < thresholds.load.critical.min && (
                            <Badge variant="warning" size="sm">WARNING</Badge>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={load}
                        onChange={(e) => setLoad(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0%</span>
                        <span className="text-orange-500">Warning: {thresholds.load.warning.min}%</span>
                        <span className="text-red-500">Critical: {thresholds.load.critical.min}%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        icon={<Zap className="w-4 h-4" />}
                        onClick={handleApplyParameters}
                        disabled={updating}
                        className="flex-1"
                      >
                        {updating ? 'Applying...' : 'Apply Parameters'}
                      </Button>
                      <Button
                        variant="outline"
                        icon={<Activity className="w-4 h-4" />}
                        onClick={handleSendTelemetry}
                        disabled={sendingTelemetry}
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        {sendingTelemetry ? 'Sending...' : 'Send as Telemetry →'}
                      </Button>
                    </div>

                    {/* Telemetry Ingest Result Panel */}
                    {telemetryResult && (
                      <div className={`mt-4 p-4 rounded-lg border text-sm ${
                        telemetryResult.anomaliesDetected > 0
                          ? 'bg-red-50 border-red-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <p className="font-semibold mb-2 flex items-center gap-2">
                          {telemetryResult.anomaliesDetected > 0
                            ? <><AlertTriangle className="w-4 h-4 text-red-500" /> Telemetry Ingest — Anomalies Detected</>
                            : <><CheckCircle className="w-4 h-4 text-green-500" /> Telemetry Ingest — All Normal</>
                          }
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Readings stored: <strong>{telemetryResult.readingsStored}</strong></div>
                          <div>Anomalies: <strong className={telemetryResult.anomaliesDetected > 0 ? 'text-red-600' : ''}>{telemetryResult.anomaliesDetected}</strong></div>
                          <div>Alerts created: <strong>{telemetryResult.alertsCreated}</strong></div>
                          <div>Downtime triggered: <strong className={telemetryResult.downtimeTriggered ? 'text-red-600' : ''}>{telemetryResult.downtimeTriggered ? 'YES' : 'No'}</strong></div>
                        </div>
                        {telemetryResult.anomalies?.map((a: any, i: number) => (
                          <div key={i} className={`mt-2 px-2 py-1 rounded text-xs ${a.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {a.sensor_type}: {a.value.toFixed(1)} — <strong>{a.severity}</strong>
                          </div>
                        ))}
                        {telemetryResult.downtimeTriggered && (
                          <Link href="/downtime" className="inline-block mt-3">
                            <Button variant="primary" size="sm">
                              View Downtime Event → Log Repair Cost
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Generated Alerts */}
                    {generatedAlerts.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          Generated Alerts ({generatedAlerts.length})
                        </h4>
                        <div className="space-y-3">
                          {generatedAlerts.map(alert => (
                            <div
                              key={alert.id}
                              className={`p-3 rounded-lg border ${
                                alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                                      {alert.severity}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{alert.alert_id}</span>
                                  </div>
                                  <p className="font-medium text-gray-900">{alert.title}</p>
                                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                </div>
                                <Link href={`/alerts/${alert.id}`}>
                                  <Button variant="outline" size="sm">
                                    View Alert
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-medium text-blue-800">
                              Alerts have been created! Log the repair cost to close the downtime event and check government scheme eligibility.
                            </p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Link href="/downtime">
                              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                                Log Repair Cost →
                              </Button>
                            </Link>
                            <Link href="/overview">
                              <Button variant="outline" size="sm">
                                Go to Dashboard
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>

            {/* Threshold Reference */}
            {thresholds && (
              <Card className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Threshold Reference</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Temperature</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Normal: {thresholds.temperature.normal.min}-{thresholds.temperature.normal.max}°C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>Warning: {thresholds.temperature.warning.min}-{thresholds.temperature.warning.max}°C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Critical: {thresholds.temperature.critical.min}°C+</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Vibration</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Normal: {thresholds.vibration.normal.min}-{thresholds.vibration.normal.max} mm/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>Warning: {thresholds.vibration.warning.min}-{thresholds.vibration.warning.max} mm/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Critical: {thresholds.vibration.critical.min} mm/s+</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Load</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Normal: {thresholds.load.normal.min}-{thresholds.load.normal.max}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>Warning: {thresholds.load.warning.min}-{thresholds.load.warning.max}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Critical: {thresholds.load.critical.min}%+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
