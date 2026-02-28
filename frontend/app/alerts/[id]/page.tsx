'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, Sparkles, FileText, Clock, Package, Users, Wifi, Download } from 'lucide-react';
import { alertsAPI } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import type { AlertDetail } from '@/lib/types';
import { getLocalAdminSidebar } from '@/lib/sidebarConfig';
import { useCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';


export default function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [restoration, setRestoration] = useState<{
    machineName: string | null;
    machineRestored: boolean;
    previousHealth: number;
    newHealth: number;
    healthGain: number;
  } | null>(null);
  const { addToast } = useToast();
  const { user } = useCurrentUser();
  const { t } = useLanguage();

  useEffect(() => {
    loadAlert();
  }, [resolvedParams.id]);

  const loadAlert = async () => {
    try {
      setIsLoading(true);
      const data = await alertsAPI.getById(parseInt(resolvedParams.id));
      setAlert(data);
    } catch (error) {
      console.error('Error loading alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!alert) return;
    try {
      setIsResolving(true);
      const result = await alertsAPI.resolve(alert.id);
      setRestoration(result.restoration);
      addToast({
        type: 'success',
        title: 'Alert Resolved',
        message: result.restoration?.machineRestored
          ? `${result.restoration.machineName} restored to Active.`
          : 'Alert marked as resolved.',
      });
      loadAlert();
    } catch (error) {
      console.error('Error resolving alert:', error);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Unable to resolve alert. Please try again.',
      });
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alert details...</p>
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Alert not found</p>
          <Link href="/overview" className="text-blue-600 hover:underline mt-2 block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const severityVariant = {
    CRITICAL: 'danger',
    WARNING: 'warning',
    INFO: 'info',
    SYSTEM: 'info',
  }[alert.severity] as 'danger' | 'warning' | 'info';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="PulseAI"
        appSubtitle="SME Operations Manager"
        searchPlaceholder="Search machines..."
        showSettings
        showSearch={false}
        userName={user?.name || ''}
        userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'}
        userLocation={user?.company_name || ''}
        logo={
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          sections={getLocalAdminSidebar(t)}
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
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Alerts List', href: '/overview' },
            { label: `${alert.machine?.machine_id || 'Alert'} - ${alert.title.split(' - ')[1] || alert.title}` },
          ]}
          className="mb-6"
        />

        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={severityVariant} size="lg">
                {alert.severity}
              </Badge>
              <h1 className="text-2xl font-bold text-gray-900">{alert.title}</h1>
            </div>
            <p className="text-gray-600">
              {alert.machine?.department || 'Main Spindle Assembly'} • {alert.machine?.name || 'Pune Plant'}, Line 2
            </p>
          </div>

          <Button
            variant="outline"
            icon={<CheckCircle className="w-4 h-4" />}
            onClick={handleMarkResolved}
            disabled={alert.status === 'resolved' || isResolving}
          >
            {alert.status === 'resolved' ? '✓ Resolved' : isResolving ? 'Resolving...' : 'Mark as Resolved'}
          </Button>
        </div>

        {/* Machine Restoration Card */}
        {restoration && (
          <Card className="p-4 bg-green-50 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800">
                  {restoration.machineRestored && restoration.machineName
                    ? `${restoration.machineName} — Restored to Active`
                    : 'Alert Resolved'}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  {restoration.machineRestored && (
                    <div className="flex items-center gap-1.5 text-xs text-green-700">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      ACTIVE
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    Plant Health:
                    <span className="font-medium ml-1">{restoration.previousHealth}%</span>
                    <span className="text-green-400 mx-1">→</span>
                    <span className="font-bold">{restoration.newHealth}%</span>
                    {restoration.healthGain > 0 && (
                      <span className="text-green-600 font-semibold ml-1">(+{restoration.healthGain}%)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Estimated Production Impact
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {alert.production_impact ? `${alert.production_impact}% Output` : '-15% Output'}
              </p>
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <span className="text-lg">↘</span> Decrease in daily target
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-orange-600" />
            </div>
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                AI Confidence Level
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {alert.ai_confidence ? `${alert.ai_confidence}% Reliable` : '92% Reliable'}
              </p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                High confidence match
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Sensor Feed Image */}
          <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-[4/3]">
            <Image
              src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80"
              alt="Machine Sensor Feed"
              fill
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">Live Sensor Feed: Spindle Assembly</span>
              </div>
              <p className="text-xs text-gray-300">
                Sensor ID: {alert.sensor_id || 'VIB-S4-A2'} • Last updated 2 mins ago
              </p>
            </div>
          </div>

          {/* Issue Description */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Issue Description</h3>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              {alert.description || 'Unusual vibration patterns detected in the main spindle assembly. Continuous operation may lead to imminent bearing failure. Sensor data indicates frequencies outside of normal operating parameters (12,000 RPM range). Immediate inspection of the lubrication system and bearing housing is recommended.'}
            </p>

            <div className="flex gap-3">
              <Link href={`/recommendations/${alert.id}`}>
                <Button
                  variant="primary"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  See AI Recommendation
                </Button>
              </Link>
              <Button variant="outline">
                View Logs
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <h4 className="font-semibold text-gray-900">Previous Incidents</h4>
            </div>
            <p className="text-sm text-gray-600">
              {alert.previousIncidents?.length > 0
                ? `${alert.machine?.machine_id} had ${alert.previousIncidents.length} similar alerts previously.`
                : 'Machine 04 had a similar lubrication alert 45 days ago which was resolved by minor maintenance.'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-gray-500" />
              <h4 className="font-semibold text-gray-900">Spare Parts Availability</h4>
            </div>
            <p className="text-sm text-gray-600">
              {alert.spareParts?.items || '2 Main Spindle Bearing sets (SKF-7204) are currently in stock at the local warehouse.'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-500" />
              <h4 className="font-semibold text-gray-900">Assigned Personnel</h4>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {alert.assignedPersonnel?.initials || 'RK'}
              </div>
              <span className="text-sm text-gray-600">
                {alert.assignedPersonnel?.name || 'Rajesh Kumar'} ({alert.assignedPersonnel?.role || 'Sr. Maintenance Engineer'})
              </span>
            </div>
          </Card>
        </div>

            {/* Footer */}
            <footer className="pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              © 2024 PulseAI. Helping SME Manufacturing thrive in India.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
