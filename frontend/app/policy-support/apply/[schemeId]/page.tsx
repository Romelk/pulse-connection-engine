'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { policiesAPI } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/auth';
import { getLocalAdminSidebar } from '@/lib/sidebarConfig';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Sparkles, CheckCircle2, Building2, FileText, Save } from 'lucide-react';
import type { SchemeApplication } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function ApplyPage({ params }: { params: Promise<{ schemeId: string }> }) {
  const { schemeId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useCurrentUser();
  const { t } = useLanguage();

  const [application, setApplication] = useState<SchemeApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Section 2 — user fills these
  const [purpose, setPurpose]           = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes]               = useState('');

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const app = await policiesAPI.createApplication(parseInt(schemeId));
        setApplication(app);
        if (app.purpose) setPurpose(app.purpose);
        if (app.estimated_cost) setEstimatedCost(String(app.estimated_cost));
        if (app.notes) setNotes(app.notes);
      } catch (error) {
        console.error('Error initializing application:', error);
        addToast({ type: 'error', title: 'Error', message: 'Could not load application form.' });
        router.push('/policy-support');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [schemeId]);

  const handleSaveDraft = async () => {
    if (!application) return;
    setIsSaving(true);
    try {
      await policiesAPI.updateApplication(application.id, {
        purpose,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        notes,
        status: 'draft',
      });
      addToast({ type: 'success', title: 'Draft Saved', message: 'Your application has been saved as a draft.' });
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save draft.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!application || !purpose.trim()) return;
    setIsSubmitting(true);
    try {
      await policiesAPI.updateApplication(application.id, {
        purpose,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        notes,
        status: 'submitted',
      });
      addToast({
        type: 'success',
        title: 'Application Submitted!',
        message: `Your application for ${application.scheme_name} has been submitted.`,
      });
      router.push('/policy-support?tab=applications');
    } catch {
      addToast({ type: 'error', title: 'Submission Failed', message: 'Could not submit application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !application) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your application with AI assist...</p>
        </div>
      </div>
    );
  }

  const autoFilledCount = [
    application.company_name, application.udyam_number, application.udyam_tier,
    application.state, application.industry, application.machine_count,
  ].filter(Boolean).length;
  const autoFillPercent = Math.round((autoFilledCount / 6) * 70);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="PulseAI"
        appSubtitle="Scheme Application"
        showSearch={false}
        userName={user?.name || ''}
        userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'}
        userLocation={user?.company_name || ''}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={getLocalAdminSidebar(t)} currentPath="/policy-support" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Breadcrumb
              items={[
                { label: 'Policy Support', href: '/policy-support' },
                { label: application.scheme_name },
              ]}
            />

            {/* Scheme Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{application.scheme_name}</h1>
                <p className="text-sm text-gray-500 mt-1">{application.ministry}</p>
              </div>
              <div className="text-right">
                {application.max_benefit && (
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(application.max_benefit)}</p>
                )}
                <p className="text-xs text-gray-500">Max Benefit</p>
              </div>
            </div>

            {/* AI Auto-fill Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  AI Auto-filled {autoFillPercent}% of your application
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Pre-populated from your Udyam profile and plant data. Review and fill in the remaining fields below.
                </p>
              </div>
            </div>

            {/* Section 1: Auto-filled Company Details */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Section 1 — Company Details
                <Badge variant="success" size="sm">Auto-filled</Badge>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Company Name</label>
                  <p className="text-sm font-medium text-gray-900 bg-green-50 border border-green-100 rounded px-3 py-2">
                    {application.company_name || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Udyam Registration Number</label>
                  <p className="text-sm font-medium text-gray-900 bg-green-50 border border-green-100 rounded px-3 py-2">
                    {application.udyam_number || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">MSME Category</label>
                  <p className="text-sm font-medium text-gray-900 bg-green-50 border border-green-100 rounded px-3 py-2">
                    {application.udyam_tier || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State</label>
                  <p className="text-sm font-medium text-gray-900 bg-green-50 border border-green-100 rounded px-3 py-2">
                    {application.state || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Industry / Sector</label>
                  <p className="text-sm font-medium text-gray-900 bg-green-50 border border-green-100 rounded px-3 py-2">
                    {application.industry || '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Number of Machines</label>
                  <p className="text-sm font-medium text-gray-900 bg-green-50 border border-green-100 rounded px-3 py-2">
                    {application.machine_count ?? '—'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                These fields have been auto-filled from your registered plant profile.
              </p>
            </Card>

            {/* Section 2: Application Details (user fills) */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Section 2 — Application Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose of Application *
                  </label>
                  <textarea
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    rows={4}
                    placeholder="Describe how you plan to use this scheme. E.g. 'Technology upgrade for 3 CNC machines to improve production efficiency and reduce downtime costs.'"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Project Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={e => setEstimatedCost(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Total investment you are planning for this project.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Any supporting information or special circumstances..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pb-6">
              <Button onClick={() => router.push('/policy-support')} variant="secondary">Cancel</Button>
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  disabled={isSaving}
                  icon={<Save className="w-4 h-4" />}
                >
                  {isSaving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  disabled={isSubmitting || !purpose.trim()}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
