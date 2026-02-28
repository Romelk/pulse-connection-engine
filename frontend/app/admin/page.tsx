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
import { Building2, Plus, Cpu, AlertTriangle, CheckCircle, Pencil, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getSuperAdminSidebar } from '@/lib/sidebarConfig';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isSuperAdmin, ready } = useCurrentUser();
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', location: '', state: '', industry: '', udyam_number: '', udyam_tier: '' });
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/login'); return; }
    if (!isSuperAdmin) { router.replace('/overview'); return; }
    adminAPI.getCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ready, user, isSuperAdmin, router]);

  const openEdit = (company: any) => {
    setEditForm({
      name: company.name || '',
      location: company.location || '',
      state: company.state || '',
      industry: company.industry || '',
      udyam_number: company.udyam_number || '',
      udyam_tier: company.udyam_tier || '',
    });
    setEditingCompany(company);
  };

  const handleSaveEdit = async () => {
    if (!editingCompany) return;
    setIsSaving(true);
    try {
      const updated = await adminAPI.updateCompany(editingCompany.id, {
        name: editForm.name,
        location: editForm.location,
        state: editForm.state,
        industry: editForm.industry || undefined,
        udyam_number: editForm.udyam_number || undefined,
        udyam_tier: editForm.udyam_tier || undefined,
      });
      setCompanies(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setEditingCompany(null);
      addToast({ type: 'success', title: 'Company Updated', message: `${updated.name} has been updated.` });
    } catch {
      addToast({ type: 'error', title: 'Update Failed', message: 'Could not save changes. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

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
                    <div className="flex items-center gap-2">
                      <Badge variant={company.status === 'stable' ? 'success' : company.status === 'warning' ? 'warning' : 'danger'}>
                        {company.status?.toUpperCase()}
                      </Badge>
                      <button
                        onClick={() => openEdit(company)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit company details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {/* Edit Company Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Edit Company Details</h2>
              <button onClick={() => setEditingCompany(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Industry / Sector</label>
                <input
                  type="text"
                  value={editForm.industry}
                  onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))}
                  placeholder="e.g. Textiles, Auto Parts"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Udyam Number</label>
                  <input
                    type="text"
                    value={editForm.udyam_number}
                    onChange={e => setEditForm(f => ({ ...f, udyam_number: e.target.value }))}
                    placeholder="UDYAM-XX-00-0000000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">MSME Tier</label>
                  <select
                    value={editForm.udyam_tier}
                    onChange={e => setEditForm(f => ({ ...f, udyam_tier: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select tier</option>
                    <option value="Micro">Micro</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-5 border-t border-gray-100">
              <button onClick={() => setEditingCompany(null)} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                disabled={isSaving || !editForm.name || !editForm.location || !editForm.state}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
