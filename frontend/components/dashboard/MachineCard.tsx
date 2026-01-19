'use client';

import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ChevronRight, Cog, Zap, AlertTriangle, Wrench, Droplet, Package } from 'lucide-react';
import type { MachineStatus } from '@/lib/types';
import Link from 'next/link';

interface MachineCardProps {
  id: number;
  machineId: string;
  name: string;
  department: string;
  status: MachineStatus;
  loadPercentage?: number;
  efficiency?: number;
  temperature?: number | null;
  iconType: string;
  notes?: string | null;
  actionText?: string;
  actionHref?: string;
  alertId?: number | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  cog: Cog,
  zap: Zap,
  'alert-triangle': AlertTriangle,
  wrench: Wrench,
  droplet: Droplet,
  package: Package,
};

const statusConfig: Record<MachineStatus, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' }> = {
  ACTIVE: { label: 'ACTIVE', variant: 'success' },
  IDLE: { label: 'IDLE', variant: 'default' },
  WARNING: { label: 'WARNING', variant: 'warning' },
  DOWN: { label: 'DOWN', variant: 'danger' },
  MAINTENANCE: { label: 'MAINTENANCE', variant: 'info' as 'default' },
};

export default function MachineCard({
  id,
  machineId,
  name,
  department,
  status,
  loadPercentage,
  efficiency,
  temperature,
  iconType,
  notes,
  actionText,
  actionHref,
  alertId,
}: MachineCardProps) {
  const Icon = iconMap[iconType] || Cog;
  const config = statusConfig[status];

  const showEfficiency = status === 'ACTIVE' && efficiency !== undefined;

  // Determine link destination - if machine has warning/down status and an alert, link to alert
  const hasAlert = (status === 'WARNING' || status === 'DOWN') && alertId;
  const cardHref = hasAlert ? `/alerts/${alertId}` : actionHref || '#';
  const isClickable = hasAlert || actionHref;

  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          status === 'ACTIVE' ? 'bg-blue-100' :
          status === 'WARNING' ? 'bg-orange-100' :
          'bg-gray-100'
        }`}>
          <Icon className={`w-5 h-5 ${
            status === 'ACTIVE' ? 'text-blue-600' :
            status === 'WARNING' ? 'text-orange-600' :
            'text-gray-500'
          }`} />
        </div>
        <Badge variant={config.variant} size="sm">
          {config.label}
        </Badge>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-500 mb-4">
        {machineId} • {department}
        {loadPercentage !== undefined && loadPercentage > 0 && ` • Load: ${loadPercentage}%`}
        {temperature !== undefined && temperature !== null && ` • Temp: ${temperature}°C`}
        {notes && status === 'IDLE' && ` • ${notes}`}
      </p>

      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
        {showEfficiency ? (
          <span className="text-sm text-gray-600">Efficiency: {efficiency}%</span>
        ) : actionText ? (
          <span className="text-sm text-blue-600 font-medium">
            {actionText}
          </span>
        ) : (
          <span className="text-sm text-gray-500">{notes || 'Ready for task'}</span>
        )}
        <ChevronRight className={`w-5 h-5 ${isClickable ? 'text-blue-500 group-hover:translate-x-1 transition-transform' : 'text-gray-400'}`} />
      </div>
    </>
  );

  if (isClickable) {
    return (
      <Link href={cardHref} className="group">
        <Card hover className="flex flex-col h-full">
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card hover className="flex flex-col">
      {cardContent}
    </Card>
  );
}
