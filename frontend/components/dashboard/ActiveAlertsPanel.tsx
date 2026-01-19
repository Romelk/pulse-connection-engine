'use client';

import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Alert, AlertSeverity } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ActiveAlertsPanelProps {
  alerts: Alert[];
  onAcknowledge?: (id: number) => void;
  onDismiss?: (id: number) => void;
}

const severityConfig: Record<AlertSeverity, { color: string; borderColor: string; label: string }> = {
  CRITICAL: { color: 'text-red-600', borderColor: 'border-l-red-500', label: 'CRITICAL' },
  WARNING: { color: 'text-orange-600', borderColor: 'border-l-orange-500', label: 'WARNING' },
  INFO: { color: 'text-blue-600', borderColor: 'border-l-blue-500', label: 'INFO' },
  SYSTEM: { color: 'text-blue-600', borderColor: 'border-l-blue-500', label: 'SYSTEM' },
};

export default function ActiveAlertsPanel({ alerts, onAcknowledge, onDismiss }: ActiveAlertsPanelProps) {
  return (
    <Card padding="none" className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Active Alerts</h3>
        <Badge variant="danger" size="sm">NEW</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No active alerts
          </div>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity];

            return (
              <Link
                key={alert.id}
                href={`/alerts/${alert.id}`}
                className={`block p-3 bg-white rounded-lg border-l-4 ${config.borderColor} hover:bg-gray-50 transition-colors cursor-pointer group`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-xs font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">
                      {formatTime(alert.created_at)}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {alert.title}
                </h4>

                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {alert.description}
                </p>

                {alert.severity === 'CRITICAL' && onAcknowledge && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAcknowledge(alert.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Acknowledge
                  </button>
                )}

                {alert.severity === 'WARNING' && onDismiss && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDismiss(alert.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Dismiss
                  </button>
                )}
              </Link>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <Link href="/history">
          <Button variant="outline" className="w-full" size="sm">
            View All History
          </Button>
        </Link>
      </div>
    </Card>
  );
}
