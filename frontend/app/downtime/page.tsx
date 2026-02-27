'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { downtimeAPI } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/auth';
import { AlertTriangle, Clock, CheckCircle, Wrench, History } from 'lucide-react';
import { getLocalAdminSidebar } from '@/lib/sidebarConfig';
import { useLanguage } from '@/lib/i18n/LanguageContext';


export default function DowntimePage() {
  const router = useRouter();
  const { user, isSuperAdmin, ready } = useCurrentUser();
  const { t } = useLanguage();
  const [active, setActive] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/login'); return; }
    if (isSuperAdmin) { router.replace('/admin'); return; }
    async function load() {
      const [a, h] = await Promise.all([
        downtimeAPI.getActive(),
        downtimeAPI.getHistory(),
      ]);
      setActive(a);
      setHistory(h);
    }
    load().catch(console.error);
  }, [ready, user, isSuperAdmin]);

  const formatDuration = (startTime: string) => {
    const hours = ((Date.now() - new Date(startTime).getTime()) / 3600000);
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  if (!ready || !user || isSuperAdmin) return null;

  const events = tab === 'active' ? active : history;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header appName="PulseAI" appSubtitle="Downtime Events" showSearch={false} userName={user?.name || ''} userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'} userLocation={user?.company_name || ''} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={getLocalAdminSidebar(t)} currentPath="/downtime" />
        <main className="flex-1 overflow-y-auto p-6">

          {/* Active Banner */}
          {active.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <strong>{active.length} machine{active.length > 1 ? 's' : ''} currently down.</strong>
              <span>Log repair costs to close events and check scheme eligibility.</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            <button onClick={() => setTab('active')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === 'active' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />Active ({active.length})
            </button>
            <button onClick={() => setTab('history')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <History className="w-3.5 h-3.5 inline mr-1" />History ({history.length})
            </button>
          </div>

          {/* Events */}
          <div className="space-y-3">
            {events.length === 0 && (
              <Card className="p-8 text-center text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="font-medium">{tab === 'active' ? 'No active downtime events.' : 'No resolved events yet.'}</p>
                <p className="text-sm mt-1">
                  {tab === 'active'
                    ? 'All machines are running. Use the Simulator to trigger a test downtime.'
                    : 'Resolved downtime events will appear here.'}
                </p>
              </Card>
            )}
            {events.map((event: any) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${event.status === 'ongoing' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className="font-semibold text-gray-900">{event.machine_name}</span>
                      <Badge variant={event.status === 'ongoing' ? 'danger' : 'success'}>
                        {event.status === 'ongoing' ? 'ONGOING' : 'RESOLVED'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{event.machine_type} · {event.department}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.status === 'ongoing' ? `Running for ${formatDuration(event.start_time)}` : `Duration: ${event.duration_hours?.toFixed(1)}h`}
                      </span>
                      {event.cause && <span>Cause: {event.cause}</span>}
                      {event.repair_cost && (
                        <span className="text-orange-600 font-medium">Repair: ₹{event.repair_cost.toLocaleString('en-IN')}</span>
                      )}
                      {event.total_loss && (
                        <span className="text-red-600 font-medium">Total Loss: ₹{event.total_loss.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {event.status === 'ongoing' ? (
                      <Button onClick={() => router.push(`/downtime/${event.id}/repair`)} variant="primary" className="text-xs">
                        <Wrench className="w-3.5 h-3.5 mr-1" /> Log Repair Cost
                      </Button>
                    ) : (
                      event.total_loss >= 50000 ? (
                        <Button onClick={() => router.push('/policy-support')} variant="secondary" className="text-xs">
                          View Schemes →
                        </Button>
                      ) : null
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
