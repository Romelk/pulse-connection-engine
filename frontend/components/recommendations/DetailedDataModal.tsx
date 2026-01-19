'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import {
  Activity,
  TrendingUp,
  History,
  Thermometer,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DetailedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId?: string;
  machineName?: string;
}

type TabType = 'sensor' | 'analytics' | 'history';

// Mock data for sensor readings
const sensorData = {
  vibration: [
    { time: '08:00', value: 2.1 },
    { time: '09:00', value: 2.3 },
    { time: '10:00', value: 2.8 },
    { time: '11:00', value: 3.5 },
    { time: '12:00', value: 4.2 },
    { time: '13:00', value: 5.1 },
    { time: '14:00', value: 5.8 },
  ],
  temperature: [
    { time: '08:00', value: 38 },
    { time: '09:00', value: 40 },
    { time: '10:00', value: 42 },
    { time: '11:00', value: 45 },
    { time: '12:00', value: 48 },
    { time: '13:00', value: 52 },
    { time: '14:00', value: 55 },
  ],
};

// Mock data for machine analytics
const analyticsData = {
  efficiency: [
    { date: 'Mon', value: 94 },
    { date: 'Tue', value: 92 },
    { date: 'Wed', value: 89 },
    { date: 'Thu', value: 85 },
    { date: 'Fri', value: 78 },
    { date: 'Sat', value: 72 },
    { date: 'Today', value: 65 },
  ],
  load: [
    { date: 'Mon', value: 75 },
    { date: 'Tue', value: 80 },
    { date: 'Wed', value: 82 },
    { date: 'Thu', value: 85 },
    { date: 'Fri', value: 88 },
    { date: 'Sat', value: 90 },
    { date: 'Today', value: 82 },
  ],
};

// Mock data for historical incidents
const historicalIncidents = [
  {
    id: 1,
    date: '2023-10-15',
    title: 'High Vibration Alert',
    description: 'Similar vibration patterns detected in spindle assembly',
    resolution: 'Bearings replaced, lubrication system cleaned',
    resolvedBy: 'Suresh K.',
    recoveryTime: 45,
    status: 'resolved',
  },
  {
    id: 2,
    date: '2023-08-22',
    title: 'Temperature Spike',
    description: 'Coolant system malfunction caused temperature rise',
    resolution: 'Coolant pump replaced, system flushed',
    resolvedBy: 'Amit P.',
    recoveryTime: 90,
    status: 'resolved',
  },
  {
    id: 3,
    date: '2023-06-10',
    title: 'Spindle Failure',
    description: 'Complete spindle failure due to bearing wear',
    resolution: 'Full spindle assembly replaced',
    resolvedBy: 'Rajesh Kumar',
    recoveryTime: 240,
    cost: 85000,
    status: 'resolved',
  },
];

function SimpleBarChart({ data, color, unit }: { data: { time?: string; date?: string; value: number }[]; color: string; unit: string }) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{item.value}{unit}</span>
          <div
            className={`w-full rounded-t ${color}`}
            style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '4px' }}
          />
          <span className="text-xs text-gray-400">{item.time || item.date}</span>
        </div>
      ))}
    </div>
  );
}

export default function DetailedDataModal({
  isOpen,
  onClose,
  machineId = 'CNC-Alpha-01',
  machineName = 'Milling Machine #4'
}: DetailedDataModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sensor');

  const tabs = [
    { id: 'sensor' as TabType, label: 'Sensor Data', icon: Activity },
    { id: 'analytics' as TabType, label: 'Machine Analytics', icon: TrendingUp },
    { id: 'history' as TabType, label: 'Historical Incidents', icon: History },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detailed Machine Data"
      subtitle={`${machineName} (${machineId})`}
      size="xl"
    >
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Sensor Data Tab */}
        {activeTab === 'sensor' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900">Vibration Patterns (mm/s)</h3>
                <span className="ml-auto text-sm text-red-600 font-medium">↑ Increasing Trend</span>
              </div>
              <SimpleBarChart data={sensorData.vibration} color="bg-orange-500" unit="" />
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Alert:</strong> Vibration levels have increased by 176% over the last 6 hours.
                  Normal operating range: 1.5-3.0 mm/s. Current: 5.8 mm/s.
                </p>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Temperature Readings (°C)</h3>
                <span className="ml-auto text-sm text-red-600 font-medium">↑ Above Normal</span>
              </div>
              <SimpleBarChart data={sensorData.temperature} color="bg-red-500" unit="°" />
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Temperature is 15% above normal operating range.
                  Normal: 35-45°C. Current: 55°C. Bearing overheating likely.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Machine Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Efficiency Trend (%)</h3>
                <span className="ml-auto text-sm text-red-600 font-medium">↓ 29% decline this week</span>
              </div>
              <SimpleBarChart data={analyticsData.efficiency} color="bg-blue-500" unit="%" />
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">94%</p>
                  <p className="text-xs text-gray-500">Week Start</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">65%</p>
                  <p className="text-xs text-gray-500">Current</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">-29%</p>
                  <p className="text-xs text-gray-500">Change</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Load History (%)</h3>
                <span className="ml-auto text-sm text-gray-500">7-day average: 83%</span>
              </div>
              <SimpleBarChart data={analyticsData.load} color="bg-green-500" unit="%" />
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Machine load has been consistently high. Consider scheduling
                  preventive maintenance to avoid unplanned downtime.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Historical Incidents Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                <strong>Pattern Detected:</strong> This machine has had 3 similar incidents in the past 6 months.
                The current vibration signature matches the October incident pattern.
              </p>
            </div>

            {historicalIncidents.map((incident) => (
              <Card key={incident.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    incident.status === 'resolved' ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {incident.status === 'resolved' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{incident.title}</h4>
                      <span className="text-xs text-gray-400">{incident.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Resolution:</strong> {incident.resolution}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {incident.recoveryTime} min recovery
                        </span>
                        <span>Resolved by {incident.resolvedBy}</span>
                        {incident.cost && (
                          <span className="text-red-600">Cost: ₹{incident.cost.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Based on historical data, similar issues have an average resolution time of <strong>125 minutes</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
