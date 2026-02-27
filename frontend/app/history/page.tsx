'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Download, Plus, Search, Calendar, Zap, CheckCircle, Clock, ChevronDown, Grid3X3 } from 'lucide-react';
import { operationsAPI, machinesAPI } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatTime } from '@/lib/utils';
import type { TimelineEntry, OperationsMetrics, Machine } from '@/lib/types';
import { getLocalAdminSidebar } from '@/lib/sidebarConfig';
import { useCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';


export default function HistoryPage() {
  const { t } = useLanguage();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLogActionOpen, setIsLogActionOpen] = useState(false);
  const [logActionForm, setLogActionForm] = useState({
    machineId: '',
    aiRecommendation: '',
    actionTaken: '',
    outcome: '',
    recoveryTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { user } = useCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [timelineData, metricsData, machinesData] = await Promise.all([
        operationsAPI.getHistory(),
        operationsAPI.getMetrics(),
        machinesAPI.getAll(),
      ]);

      setTimeline(timelineData);
      setMetrics(metricsData);
      setMachines(machinesData.machines);
    } catch (error) {
      console.error('Error loading operations data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // In a real app, this would filter via API
    console.log('Search:', searchQuery);
  };

  const handleExportCSV = () => {
    window.open(operationsAPI.exportCSV(), '_blank');
    addToast({
      type: 'info',
      title: 'Export Started',
      message: 'Your CSV file is being downloaded.',
    });
  };

  const handleLogAction = async () => {
    if (!logActionForm.machineId || !logActionForm.aiRecommendation) {
      addToast({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please select a machine and enter the AI recommendation.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await operationsAPI.logAction({
        machineId: parseInt(logActionForm.machineId),
        aiRecommendation: logActionForm.aiRecommendation,
        actionTaken: logActionForm.actionTaken || undefined,
        actionTakenBy: 'Rajesh Kumar',
        outcome: logActionForm.outcome || undefined,
        recoveryTimeMinutes: logActionForm.recoveryTime ? parseInt(logActionForm.recoveryTime) : undefined,
      });

      addToast({
        type: 'success',
        title: 'Action Logged',
        message: 'The operation has been added to the timeline.',
      });

      setIsLogActionOpen(false);
      setLogActionForm({
        machineId: '',
        aiRecommendation: '',
        actionTaken: '',
        outcome: '',
        recoveryTime: '',
      });
      loadData();
    } catch (error) {
      console.error('Error logging action:', error);
      addToast({
        type: 'error',
        title: 'Failed to Log Action',
        message: 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = {
    resolved: { label: 'RESOLVED', variant: 'success' as const, dotColor: 'bg-blue-500' },
    critical_override: { label: 'CRITICAL OVERRIDE', variant: 'danger' as const, dotColor: 'bg-orange-500' },
    in_progress: { label: 'IN PROGRESS', variant: 'warning' as const, dotColor: 'bg-yellow-500' },
    escalated: { label: 'ESCALATED', variant: 'danger' as const, dotColor: 'bg-red-500' },
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operations history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="OpsAssistant AI"
        topNav={[
          { label: 'Dashboard', href: '/overview' },
          { label: 'Inventory', href: '/inventory' },
          { label: 'History', href: '/history', active: true },
          { label: 'Reports', href: '/reports' },
        ]}
        showSettings
        userName={user?.name || ''}
        userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'}
        userLocation={user?.company_name || ''}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          sections={getLocalAdminSidebar(t)}
          currentPath="/history"
          header={
            <div className="bg-blue-600 text-white rounded-lg p-3 -mx-1">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">SME Manufacturing</p>
              <p className="text-sm">Unit 02 - Pune, Maharashtra</p>
            </div>
          }
          footer={
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <div>
                <p className="text-xs text-gray-500">AI System Status</p>
                <p className="text-gray-700">Optimizing Unit 02 Efficiency</p>
              </div>
            </div>
          }
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl">
            {/* Page Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {t('history.pageTitle')}
                </h1>
                <p className="text-gray-600">
                  {t('history.pageSubtitle')}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
                  Export CSV
                </Button>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsLogActionOpen(true)}>
                  Log Action
                </Button>
              </div>
            </div>

            {/* Metrics Cards */}
            {metrics && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('history.totalActions')}</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.totalActions.count}</p>
                    <p className="text-sm text-green-600 mt-1">{metrics.totalActions.comparisonLabel}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                </Card>

                <Card className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('history.resolutionRate')}</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.resolutionRate.percentage}%</p>
                    <p className="text-sm text-green-600 mt-1">{metrics.resolutionRate.comparisonLabel}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </Card>

                <Card className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('history.avgRecovery')}</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.avgRecoveryTime.minutes}m</p>
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <Badge variant="danger" size="sm">{metrics.avgRecoveryTime.comparison}%</Badge>
                      downtime reduction
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                </Card>
              </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search by Machine ID, Action, or Manager..."
                  icon={<Search className="w-4 h-4" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="outline" icon={<Grid3X3 className="w-4 h-4" />} iconPosition="right">
                All Machines
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" icon={<Calendar className="w-4 h-4" />}>
                Date Range
              </Button>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {timeline.map((entry, index) => {
                const config = statusConfig[entry.status];
                const severityColor = entry.aiRecommendation.severity === 'critical' ? 'border-l-orange-500 bg-orange-50' :
                  entry.aiRecommendation.severity === 'warning' ? 'border-l-blue-500 bg-blue-50' :
                  'border-l-blue-500 bg-blue-50';

                return (
                  <div key={entry.id} className="flex gap-4">
                    {/* Date Column */}
                    <div className="w-32 flex-shrink-0 text-right pt-1">
                      <p className="font-semibold text-gray-900">{formatDate(entry.timestamp)}</p>
                      <p className="text-sm text-gray-500">{formatTime(entry.timestamp)}</p>
                    </div>

                    {/* Timeline Dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 ${config.dotColor} rounded-full ring-4 ring-white`}></div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
                      )}
                    </div>

                    {/* Content Card */}
                    <Card className="flex-1 mb-2">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Grid3X3 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{entry.machine.name}</p>
                            <p className="text-sm text-gray-500">Alert ID: {entry.alertId}</p>
                          </div>
                        </div>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>

                      {/* AI Recommendation */}
                      <div className={`border-l-4 ${severityColor} p-3 rounded-r-lg mb-4`}>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">AI Recommendation</p>
                        <p className="text-sm text-gray-700">{entry.aiRecommendation.text}</p>
                      </div>

                      {/* Action & Outcome */}
                      {(entry.actionTaken || entry.outcome) && (
                        <div className="grid grid-cols-2 gap-3">
                          {entry.actionTaken && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Action Taken</p>
                              <p className="text-sm text-gray-700">{entry.actionTaken.text}</p>
                            </div>
                          )}
                          {entry.outcome && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Outcome</p>
                              <p className="text-sm text-gray-700">{entry.outcome}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Log Action Modal */}
      <Modal
        isOpen={isLogActionOpen}
        onClose={() => setIsLogActionOpen(false)}
        title="Log New Action"
        subtitle="Record an operational action for the timeline"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsLogActionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleLogAction} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Log Action'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Machine <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={logActionForm.machineId}
              onChange={(e) => setLogActionForm({ ...logActionForm, machineId: e.target.value })}
            >
              <option value="">Select a machine...</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.machine_id} - {machine.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Recommendation <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Describe the AI recommendation or alert..."
              value={logActionForm.aiRecommendation}
              onChange={(e) => setLogActionForm({ ...logActionForm, aiRecommendation: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Taken
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Describe the action taken..."
              value={logActionForm.actionTaken}
              onChange={(e) => setLogActionForm({ ...logActionForm, actionTaken: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outcome
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Issue resolved"
                value={logActionForm.outcome}
                onChange={(e) => setLogActionForm({ ...logActionForm, outcome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recovery Time (minutes)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 15"
                value={logActionForm.recoveryTime}
                onChange={(e) => setLogActionForm({ ...logActionForm, recoveryTime: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
