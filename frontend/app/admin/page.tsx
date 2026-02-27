'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { adminAPI } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/auth';
import { Building2, Plus, Cpu, AlertTriangle, CheckCircle } from 'lucide-react';
import { getSuperAdminSidebar } from '@/lib/sidebarConfig';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isSuperAdmin, ready } = useCurrentUser();
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/login'); return; }
    if (!isSuperAdmin) { router.replace('/overview'); return; }
    adminAPI.getCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ready, user, isSuperAdmin, router]);

  if (!ready || !user || !isSuperAdmin) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sections={getSuperAdminSidebar(t)} currentPath="/admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          appName="PulseAI"
          showSearch={false}
          appSubtitle="Company Management"
          userName={user.name}
          userRole="Super Admin"
          userLocation="PulseAI HQ"
        />
        <main className="flex-1 overflow-y-auto p-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Onboarded Companies</h1>
              <p className="text-sm text-gray-500 mt-1">
                {companies.length} compan{companies.length === 1 ? 'y' : 'ies'} on the platform
              </p>
            </div>
            <Button onClick={() => router.push('/admin/companies/new')} variant="primary">
              <Plus className="w-4 h-4 mr-2" /> Add Company
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading companies...</div>
          ) : companies.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No companies yet</h3>
              <p className="text-sm text-gray-500 mb-6">Add your first client company to get started.</p>
              <Button onClick={() => router.push('/admin/companies/new')} variant="primary">
                <Plus className="w-4 h-4 mr-2" /> Add First Company
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {companies.map((company: any) => (
                <Card key={company.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{company.name}</h3>
                        <p className="text-xs text-gray-500">{company.location}, {company.state}</p>
                      </div>
                    </div>
                    <Badge variant={company.status === 'stable' ? 'success' : company.status === 'warning' ? 'warning' : 'danger'}>
                      {company.status?.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-700 font-semibold text-lg">
                        <Cpu className="w-4 h-4 text-blue-500" />
                        {company.machine_count}
                      </div>
                      <div className="text-xs text-gray-500">Machines</div>
                    </div>
                    <div className={`rounded-lg p-2 text-center ${company.active_downtime_count > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                      <div className={`flex items-center justify-center gap-1 font-semibold text-lg ${company.active_downtime_count > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {company.active_downtime_count > 0
                          ? <AlertTriangle className="w-4 h-4" />
                          : <CheckCircle className="w-4 h-4" />}
                        {company.active_downtime_count}
                      </div>
                      <div className="text-xs text-gray-500">Active Downtime</div>
                    </div>
                  </div>

                  {company.udyam_number && (
                    <p className="text-xs text-gray-400 mb-2">Udyam: {company.udyam_number}</p>
                  )}

                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500">Local Admin</p>
                    <p className="text-xs font-medium text-gray-700 truncate">{company.admin_email || 'Not assigned'}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
