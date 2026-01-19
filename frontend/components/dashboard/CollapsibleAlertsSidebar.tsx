'use client';

import { useState, useEffect } from 'react';
import { Bell, PanelRightClose, PanelRightOpen } from 'lucide-react';
import ActiveAlertsPanel from './ActiveAlertsPanel';
import type { Alert } from '@/lib/types';

interface CollapsibleAlertsSidebarProps {
  alerts: Alert[];
  onAcknowledge: (id: number) => void;
  onDismiss: (id: number) => void;
}

export default function CollapsibleAlertsSidebar({
  alerts,
  onAcknowledge,
  onDismiss,
}: CollapsibleAlertsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('alerts_sidebar_collapsed');
    if (saved) setIsCollapsed(JSON.parse(saved));
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('alerts_sidebar_collapsed', JSON.stringify(newState));
  };

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length;

  if (isCollapsed) {
    return (
      <aside className="w-14 border-l border-gray-200 bg-gray-50 flex flex-col">
        {/* Toggle button at top */}
        <div className="p-2 border-b border-gray-100">
          <button
            onClick={toggleCollapse}
            className="w-full p-2 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
            title="Expand alerts panel"
          >
            <PanelRightOpen className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Alert icon with count */}
        <div className="flex-1 flex flex-col items-center pt-4 space-y-3">
          <button
            onClick={toggleCollapse}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={`${alerts.length} active alerts - click to expand`}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {/* Severity indicators */}
          {criticalCount > 0 && (
            <div className="flex items-center gap-1" title={`${criticalCount} Critical`}>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{criticalCount}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1" title={`${warningCount} Warning`}>
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">{warningCount}</span>
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 border-l border-gray-200 bg-gray-50 flex flex-col">
      {/* Custom header with collapse button */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Active Alerts</h3>
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
              {alerts.length}
            </span>
          )}
        </div>
        <button
          onClick={toggleCollapse}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          title="Collapse alerts panel"
        >
          <PanelRightClose className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No active alerts
          </div>
        ) : (
          alerts.map((alert) => {
            const severityColors = {
              CRITICAL: { border: 'border-l-red-500', text: 'text-red-600' },
              WARNING: { border: 'border-l-orange-500', text: 'text-orange-600' },
              INFO: { border: 'border-l-blue-500', text: 'text-blue-600' },
              SYSTEM: { border: 'border-l-blue-500', text: 'text-blue-600' },
            };
            const colors = severityColors[alert.severity];

            return (
              <a
                key={alert.id}
                href={`/alerts/${alert.id}`}
                className={`block p-3 bg-white rounded-lg border-l-4 ${colors.border} hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-xs font-semibold ${colors.text}`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                  {alert.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {alert.description}
                </p>
                {alert.severity === 'CRITICAL' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onAcknowledge(alert.id);
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Acknowledge
                  </button>
                )}
                {alert.severity === 'WARNING' && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDismiss(alert.id);
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Dismiss
                  </button>
                )}
              </a>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <a
          href="/history"
          className="block w-full py-2 px-3 text-center text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View All History
        </a>
      </div>
    </aside>
  );
}
