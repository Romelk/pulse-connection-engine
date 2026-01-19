'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Cog, Zap, AlertTriangle, Wrench, Droplet, Package, Search, Filter, ChevronRight } from 'lucide-react';
import { machinesAPI } from '@/lib/api/client';
import type { Machine, MachineStatus } from '@/lib/types';

const sidebarSections = [
  {
    items: [
      { label: 'Overview', href: '/overview', icon: 'dashboard' as const },
      { label: 'Machines', href: '/machines', icon: 'machines' as const },
      { label: 'Simulator', href: '/simulator', icon: 'simulator' as const },
      { label: 'Policy Support', href: '/policy-support', icon: 'policy' as const },
      { label: 'Staff', href: '/staff', icon: 'users' as const },
      { label: 'Analytics', href: '/analytics', icon: 'analytics' as const },
      { label: 'Settings', href: '/settings', icon: 'settings' as const },
    ],
  },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  cog: Cog,
  zap: Zap,
  'alert-triangle': AlertTriangle,
  wrench: Wrench,
  droplet: Droplet,
  package: Package,
};

const statusConfig: Record<MachineStatus, { label: string; variant: 'success' | 'default' | 'warning' | 'danger'; color: string }> = {
  ACTIVE: { label: 'ACTIVE', variant: 'success', color: 'bg-green-500' },
  IDLE: { label: 'IDLE', variant: 'default', color: 'bg-gray-400' },
  WARNING: { label: 'WARNING', variant: 'warning', color: 'bg-orange-500' },
  DOWN: { label: 'DOWN', variant: 'danger', color: 'bg-red-500' },
  MAINTENANCE: { label: 'MAINTENANCE', variant: 'default', color: 'bg-blue-500' },
};

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setIsLoading(true);
      const data = await machinesAPI.getAll();
      setMachines(data.machines);
    } catch (error) {
      console.error('Error loading machines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMachines = filterStatus === 'all'
    ? machines
    : machines.filter(m => m.status === filterStatus);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading machines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="FactoryHealth AI"
        appSubtitle="Machine Management"
        searchPlaceholder="Search machines..."
        userName="Shift A"
        userRole="Manager"
        userLocation="Pune Plant Alpha"
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={sidebarSections} currentPath="/machines" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Machine Inventory</h1>
                <p className="text-gray-600">Manage and monitor all factory machines</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
                  Filter
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 mb-6">
              {['all', 'ACTIVE', 'IDLE', 'WARNING', 'DOWN', 'MAINTENANCE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All Machines' : status}
                </button>
              ))}
            </div>

            {/* Machine List */}
            <div className="space-y-3">
              {filteredMachines.map((machine) => {
                const Icon = iconMap[machine.icon_type] || Cog;
                const config = statusConfig[machine.status];

                return (
                  <Card key={machine.id} hover className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      machine.status === 'ACTIVE' ? 'bg-blue-100' :
                      machine.status === 'WARNING' ? 'bg-orange-100' :
                      machine.status === 'DOWN' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        machine.status === 'ACTIVE' ? 'text-blue-600' :
                        machine.status === 'WARNING' ? 'text-orange-600' :
                        machine.status === 'DOWN' ? 'text-red-600' :
                        'text-gray-500'
                      }`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{machine.machine_id}</h3>
                        <Badge variant={config.variant} size="sm">{config.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {machine.name} • {machine.department}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      {machine.efficiency > 0 && (
                        <div>
                          <span className="text-gray-500">Efficiency</span>
                          <p className="font-semibold text-gray-900">{machine.efficiency}%</p>
                        </div>
                      )}
                      {machine.load_percentage > 0 && (
                        <div>
                          <span className="text-gray-500">Load</span>
                          <p className="font-semibold text-gray-900">{machine.load_percentage}%</p>
                        </div>
                      )}
                      {machine.temperature && (
                        <div>
                          <span className="text-gray-500">Temp</span>
                          <p className="font-semibold text-gray-900">{machine.temperature}°C</p>
                        </div>
                      )}
                    </div>

                    {machine.alert_id && (
                      <Link href={`/alerts/${machine.alert_id}`}>
                        <Button variant="outline" size="sm">
                          View Alert
                        </Button>
                      </Link>
                    )}

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
