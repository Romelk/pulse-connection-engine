'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import FactoryStatusCard from '@/components/dashboard/FactoryStatusCard';
import RiskCard from '@/components/dashboard/RiskCard';
import MachineCard from '@/components/dashboard/MachineCard';
import CollapsibleAlertsSidebar from '@/components/dashboard/CollapsibleAlertsSidebar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Download, AlertTriangle, Cog, Bell, TrendingUp } from 'lucide-react';
import { dashboardAPI, machinesAPI, alertsAPI } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { DashboardOverview, MachineStatusOverview, RiskAssessment, Alert } from '@/lib/types';

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

export default function OverviewPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [machines, setMachines] = useState<MachineStatusOverview | null>(null);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [overviewData, machinesData, risksData, alertsData] = await Promise.all([
        dashboardAPI.getOverview(),
        machinesAPI.getAll(),
        dashboardAPI.getRisks(),
        alertsAPI.getActive(),
      ]);

      setOverview(overviewData);
      setMachines(machinesData);
      setRisks(risksData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    try {
      setIsRunningDiagnostics(true);
      await dashboardAPI.runDiagnostics();
      await loadData();
      addToast({
        type: 'success',
        title: 'AI Diagnostics Complete',
        message: 'All systems analyzed. Factory health status updated.',
      });
    } catch (error) {
      console.error('Error running diagnostics:', error);
      addToast({
        type: 'error',
        title: 'Diagnostics Failed',
        message: 'Unable to run AI diagnostics. Please try again.',
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      await alertsAPI.acknowledge(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
      addToast({
        type: 'success',
        title: 'Alert Acknowledged',
        message: 'Alert has been acknowledged and assigned to the maintenance team.',
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Unable to acknowledge alert. Please try again.',
      });
    }
  };

  const handleDismiss = async (alertId: number) => {
    try {
      await alertsAPI.dismiss(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
      addToast({
        type: 'info',
        title: 'Alert Dismissed',
        message: 'Alert has been dismissed from active monitoring.',
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Unable to dismiss alert. Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="FactoryHealth AI"
        appSubtitle="SME Operations Manager"
        searchPlaceholder="Search machines..."
        userName={overview?.currentShift?.name || 'Shift A'}
        userRole="Manager"
        userLocation={overview?.plant.name || 'Pune Plant Alpha'}
        logo={
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          sections={sidebarSections}
          currentPath="/overview"
          footer={
            <Button
              variant="primary"
              className="w-full"
              icon={<Download className="w-4 h-4" />}
            >
              Export Report
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Factory Status Card - Full Width */}
            {overview && (
              <FactoryStatusCard
                status={overview.status}
                lastAiSync={overview.lastAiSync}
                pulse={overview.pulse}
                overallHealth={overview.overallHealth}
                onRunDiagnostics={handleRunDiagnostics}
                isLoading={isRunningDiagnostics}
              />
            )}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Cog className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{machines?.active || 0}</p>
                  <p className="text-xs text-gray-500">Active Machines</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{machines?.warning || 0}</p>
                  <p className="text-xs text-gray-500">Warnings</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                  <p className="text-xs text-gray-500">Open Alerts</p>
                </div>
              </Card>
              <Card className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{overview?.overallHealth || 0}%</p>
                  <p className="text-xs text-gray-500">Efficiency</p>
                </div>
              </Card>
            </div>

            {/* Today's Risk Summary */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Risk Summary</h2>
                </div>
                {risks.length > 0 && (
                  <Badge variant="warning" size="sm">{risks.length} Active</Badge>
                )}
              </div>

              {risks.length === 0 ? (
                <Card className="text-center py-6">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-gray-600 font-medium">All Systems Normal</p>
                  <p className="text-sm text-gray-500">No active risks detected</p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {risks.map((risk, index) => (
                    <RiskCard
                      key={risk.id}
                      title={risk.title}
                      description={risk.description}
                      riskLevel={risk.risk_level}
                      badgeText={risk.badge_text}
                      iconType={risk.icon_type}
                      onClick={() => {
                        const relatedAlert = alerts.find(a =>
                          a.title.toLowerCase().includes(risk.title.split(':')[0].toLowerCase().trim()) ||
                          risk.title.toLowerCase().includes(a.title.split('-')[0].toLowerCase().trim())
                        );
                        if (relatedAlert) {
                          router.push(`/alerts/${relatedAlert.id}`);
                        } else if (alerts.length > 0) {
                          router.push(`/alerts/${alerts[index % alerts.length].id}`);
                        } else {
                          addToast({
                            type: 'info',
                            title: 'No Active Alerts',
                            message: 'There are no active alerts related to this risk.',
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Machine Status Overview */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Machine Status Overview</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {machines?.active || 0} Active
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    {machines?.idle || 0} Idle
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    {machines?.warning || 0} Warning
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    {machines?.down || 0} Down
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {machines?.machines.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    id={machine.id}
                    machineId={machine.machine_id}
                    name={machine.name}
                    department={machine.department}
                    status={machine.status}
                    loadPercentage={machine.load_percentage}
                    efficiency={machine.efficiency}
                    temperature={machine.temperature}
                    iconType={machine.icon_type}
                    notes={machine.notes}
                    actionText={machine.status === 'WARNING' ? 'Check sensors' : undefined}
                    alertId={machine.alert_id}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* Collapsible Alerts Sidebar */}
        <CollapsibleAlertsSidebar
          alerts={alerts}
          onAcknowledge={handleAcknowledge}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  );
}
