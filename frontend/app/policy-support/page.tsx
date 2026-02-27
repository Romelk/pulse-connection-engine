'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Sparkles, TrendingUp, CheckCircle2, Wrench, MapPin, Shield, Zap, FileText, Calendar, Building2, ExternalLink, Database, Bookmark, RefreshCw } from 'lucide-react';
import { policiesAPI, scraperAPI } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import type { GovernmentScheme, PolicySummary, UdyamStatus, SchemeApplication } from '@/lib/types';
import { getLocalAdminSidebar } from '@/lib/sidebarConfig';
import { useCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';


const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
  draft:        { label: 'Draft',        variant: 'info' },
  submitted:    { label: 'Submitted',    variant: 'warning' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved:     { label: 'Approved',     variant: 'success' },
  rejected:     { label: 'Rejected',     variant: 'danger' },
};

const BENEFIT_TYPES = ['subsidy', 'grant', 'interest_subsidy', 'loan', 'guarantee', 'support'];

function PolicySupportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [summary, setSummary] = useState<PolicySummary | null>(null);
  const [udyamStatus, setUdyamStatus] = useState<UdyamStatus | null>(null);
  const [applications, setApplications] = useState<SchemeApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [isSyncingSchemes, setIsSyncingSchemes] = useState(false);
  const [activeTab, setActiveTab] = useState<'schemes' | 'applications' | 'saved'>('schemes');
  const { addToast } = useToast();
  const { user } = useCurrentUser();

  // Filters
  const [filterLevel, setFilterLevel]       = useState<'all' | 'central' | 'state'>('all');
  const [filterType, setFilterType]         = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState(false);

  useEffect(() => {
    if (searchParams.get('tab') === 'applications') setActiveTab('applications');
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schemesData, summaryData, udyamData, appsData] = await Promise.all([
        policiesAPI.getSchemes(),
        policiesAPI.getSummary(),
        policiesAPI.getUdyamStatus(),
        policiesAPI.getApplications(),
      ]);
      setSchemes(schemesData);
      setSummary(summaryData);
      setUdyamStatus(udyamData);
      setApplications(appsData);
    } catch (error) {
      console.error('Error loading policy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSchemes = schemes
    .filter(s => filterLevel === 'all' || s.level === filterLevel)
    .filter(s => filterType === 'all' || s.benefit_type === filterType)
    .filter(s => !filterPriority || s.priority_match);

  const handleSaveScheme = async (schemeId: number, isSaved: boolean) => {
    try {
      if (isSaved) {
        await policiesAPI.unsaveScheme(schemeId);
        addToast({ type: 'info', title: 'Scheme Removed', message: 'Removed from saved list.' });
      } else {
        await policiesAPI.saveScheme(schemeId);
        addToast({ type: 'success', title: 'Scheme Saved', message: 'Added to your saved list.' });
      }
      setSchemes(schemes.map(s => s.id === schemeId ? { ...s, is_saved: !isSaved } : s));
    } catch {
      addToast({ type: 'error', title: 'Action Failed', message: 'Unable to save scheme. Please try again.' });
    }
  };

  const handleApply = (scheme: GovernmentScheme) => {
    setIsSchemeModalOpen(false);
    router.push(`/policy-support/apply/${scheme.id}`);
  };

  const handleSyncSchemes = async () => {
    try {
      setIsSyncingSchemes(true);
      const result = await scraperAPI.syncSchemes();
      addToast({
        type: 'success',
        title: 'Schemes Synced',
        message: `${result.schemesUpdated} verified government schemes loaded from official sources.`,
      });
      await loadData();
    } catch {
      addToast({ type: 'error', title: 'Sync Failed', message: 'Unable to sync schemes. Please try again.' });
    } finally {
      setIsSyncingSchemes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading policy information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="PulseAI"
        showSearch={false}
        appSubtitle="SME Operations Manager"
        userName={user?.name || ''}
        userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'}
        userLocation={user?.company_name || ''}
        logo={
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={getLocalAdminSidebar(t)} currentPath="/policy-support" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Government Policy Support</h1>
                <p className="text-gray-600">Discover and apply for government schemes tailored to your manufacturing business</p>
              </div>
              {udyamStatus && (
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div>
                    <p className="text-xs text-gray-500">Udyam Status</p>
                    <p className="font-medium text-gray-900">{udyamStatus.tier} • {udyamStatus.state}</p>
                  </div>
                  {udyamStatus.verified && <Badge variant="success" size="sm">VERIFIED</Badge>}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 p-1 inline-flex gap-1">
              {(['schemes', 'applications', 'saved'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab === 'schemes' ? 'Browse Schemes' : tab === 'applications' ? `My Applications${applications.length > 0 ? ` (${applications.length})` : ''}` : 'Saved Schemes'}
                </button>
              ))}
            </div>

            {/* ── BROWSE SCHEMES TAB ── */}
            {activeTab === 'schemes' && (
              <>
                {/* Summary Cards */}
                {summary && (
                  <div className="grid grid-cols-3 gap-6">
                    <Card>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Potential Total Subsidy</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.potentialSubsidy.amount)}</p>
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-4 h-4" />{summary.potentialSubsidy.comparisonLabel}
                      </p>
                    </Card>
                    <Card>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Eligible Schemes</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.eligibleSchemes.count} Programs</p>
                      <p className="text-sm text-gray-500 mt-1">{summary.eligibleSchemes.centralCount} Central, {summary.eligibleSchemes.stateCount} State Level</p>
                    </Card>
                    <Card>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Application Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.successRate.percentage}%</p>
                      <p className="text-sm text-gray-500 mt-1">{summary.successRate.label}</p>
                    </Card>
                  </div>
                )}

                {/* Filter Bar */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500 uppercase w-10">Level</span>
                      {(['all', 'central', 'state'] as const).map(v => (
                        <button key={v} onClick={() => setFilterLevel(v)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                            filterLevel === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}>
                          {v === 'all' ? 'All' : v === 'central' ? 'Central Govt.' : 'State Govt.'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500 uppercase w-10">Type</span>
                      {(['all', ...BENEFIT_TYPES] as const).map(v => (
                        <button key={v} onClick={() => setFilterType(v)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                            filterType === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}>
                          {v === 'all' ? 'All Types' : v === 'interest_subsidy' ? 'Interest Subsidy' : v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filterPriority} onChange={e => setFilterPriority(e.target.checked)}
                          className="w-4 h-4 accent-blue-600 rounded" />
                        <span className="text-sm text-gray-700 font-medium">High Priority Match only</span>
                      </label>
                      {(filterLevel !== 'all' || filterType !== 'all' || filterPriority) && (
                        <button onClick={() => { setFilterLevel('all'); setFilterType('all'); setFilterPriority(false); }}
                          className="text-xs text-blue-600 hover:underline ml-2">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Schemes grid */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recommended Schemes</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{filteredSchemes.length} of {schemes.length} schemes</span>
                      <Button variant="outline" icon={<Database className="w-4 h-4" />}
                        onClick={handleSyncSchemes} disabled={isSyncingSchemes}>
                        {isSyncingSchemes ? <><RefreshCw className="w-4 h-4 animate-spin" /> Syncing...</> : 'Sync from Gov Sources'}
                      </Button>
                    </div>
                  </div>

                  {filteredSchemes.length === 0 ? (
                    <Card className="p-8 text-center text-gray-400">
                      <p className="font-medium">No schemes match your filters.</p>
                      <button onClick={() => { setFilterLevel('all'); setFilterType('all'); setFilterPriority(false); }}
                        className="text-sm text-blue-600 hover:underline mt-2">Clear filters</button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredSchemes.map((scheme) => (
                        <Card key={scheme.id} className="flex flex-col h-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {scheme.priority_match && <Badge variant="info" size="sm">HIGH PRIORITY MATCH</Badge>}
                              <span className="text-xs text-gray-500">{scheme.ministry}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{scheme.name}</h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{scheme.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {scheme.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                                  {tag.includes('Udyam') && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                                  {tag.includes('Technical') && <Wrench className="w-3.5 h-3.5 text-gray-500" />}
                                  {tag.includes('Zone') && <MapPin className="w-3.5 h-3.5 text-blue-600" />}
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500 uppercase">{scheme.benefit_type === 'subsidy' ? 'Max Benefit' : 'Interest Subsidy'}</p>
                              <p className="text-xl font-bold text-blue-600">
                                {scheme.max_benefit ? formatCurrency(scheme.max_benefit) : scheme.benefit_unit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleSaveScheme(scheme.id, scheme.is_saved)}
                                className={`p-2 rounded-lg border transition-colors ${scheme.is_saved ? 'bg-green-50 border-green-200 text-green-600' : 'border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200'}`}
                                title={scheme.is_saved ? 'Remove from saved' : 'Save for later'}>
                                <Bookmark className={`w-4 h-4 ${scheme.is_saved ? 'fill-current' : ''}`} />
                              </button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedScheme(scheme); setIsSchemeModalOpen(true); }}>
                                View Details
                              </Button>
                              <Button variant="primary" size="sm" onClick={() => handleApply(scheme)}>
                                Apply
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Smart Application CTA */}
                <div className="bg-gray-900 text-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Start your application with AI assist.</h3>
                      <p className="text-gray-300 mb-4">
                        Our AI engine auto-fills up to <span className="font-semibold text-white">70% of your application</span> using your Udyam profile and plant data.
                      </p>
                      <div className="flex gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                          <Shield className="w-4 h-4 text-blue-400" /> Encrypted Data
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                          <Zap className="w-4 h-4 text-yellow-400" /> 2x Faster Filing
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-gray-100 border-white"
                      onClick={() => filteredSchemes.length > 0 && handleApply(filteredSchemes[0])}
                    >
                      BEGIN SMART APPLICATION
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── MY APPLICATIONS TAB ── */}
            {activeTab === 'applications' && (
              applications.length === 0 ? (
                <Card className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-500 mb-4">Start by browsing schemes and clicking Apply.</p>
                  <Button variant="primary" onClick={() => setActiveTab('schemes')}>Browse Schemes</Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => {
                    const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
                    return (
                      <Card key={app.id} className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={sc.variant}>{sc.label}</Badge>
                              <span className="text-xs text-gray-500">{app.ministry}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900">{app.scheme_name}</h3>
                            {app.purpose && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{app.purpose}</p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {app.estimated_cost && (
                                <span>Project Cost: ₹{app.estimated_cost.toLocaleString('en-IN')}</span>
                              )}
                              {app.max_benefit && (
                                <span className="text-blue-600 font-medium">Max Benefit: {formatCurrency(app.max_benefit)}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {(app.status === 'draft') && (
                              <Button variant="primary" size="sm"
                                onClick={() => router.push(`/policy-support/apply/${app.scheme_id}`)}>
                                Continue →
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )
            )}

            {/* ── SAVED SCHEMES TAB ── */}
            {activeTab === 'saved' && (
              schemes.filter(s => s.is_saved).length === 0 ? (
                <Card className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Schemes</h3>
                  <p className="text-gray-500 mb-4">Bookmark schemes you&apos;re interested in for quick access.</p>
                  <Button variant="primary" onClick={() => setActiveTab('schemes')}>Browse Schemes</Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {schemes.filter(s => s.is_saved).map((scheme) => (
                    <Card key={scheme.id} className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {scheme.priority_match && <Badge variant="info" size="sm">HIGH PRIORITY MATCH</Badge>}
                          <span className="text-xs text-gray-500">{scheme.ministry}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{scheme.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{scheme.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Max Benefit</p>
                          <p className="text-xl font-bold text-blue-600">
                            {scheme.max_benefit ? formatCurrency(scheme.max_benefit) : scheme.benefit_unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSaveScheme(scheme.id, true)}
                            className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Remove from saved">
                            <Bookmark className="w-4 h-4 fill-current" />
                          </button>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedScheme(scheme); setIsSchemeModalOpen(true); }}>
                            View Details
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => handleApply(scheme)}>Apply</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {/* Scheme Details Modal */}
      <Modal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        title={selectedScheme?.name || 'Scheme Details'}
        subtitle={selectedScheme?.ministry}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSchemeModalOpen(false)}>Close</Button>
            <Button
              variant="primary"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={() => selectedScheme && handleApply(selectedScheme)}
            >
              Apply with AI Assist
            </Button>
          </>
        }
      >
        {selectedScheme && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">
                    {selectedScheme.benefit_type === 'subsidy' ? 'Maximum Benefit' : 'Interest Subsidy'}
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedScheme.max_benefit ? formatCurrency(selectedScheme.max_benefit) : selectedScheme.benefit_unit}
                  </p>
                </div>
                {selectedScheme.priority_match && <Badge variant="info" size="lg">HIGH PRIORITY MATCH</Badge>}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" /> Description
              </h4>
              <p className="text-gray-600">{selectedScheme.description}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Eligibility Criteria
              </h4>
              <ul className="space-y-2">
                {selectedScheme.eligibility_criteria.map((criterion, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Level</span>
                </div>
                <p className="font-medium text-gray-900 capitalize">
                  {selectedScheme.level} {selectedScheme.state && `(${selectedScheme.state})`}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Status</span>
                </div>
                <p className="font-medium text-green-600">Currently Active</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
              <div className="flex flex-wrap gap-2">
                {selectedScheme.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">
                    {tag.includes('Udyam') && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                    {tag.includes('Technical') && <Wrench className="w-3.5 h-3.5 text-gray-500" />}
                    {tag.includes('Zone') && <MapPin className="w-3.5 h-3.5 text-blue-600" />}
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <a href="#" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                <ExternalLink className="w-4 h-4" /> View on Official Government Portal
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function PolicySupportPage() {
  return (
    <Suspense>
      <PolicySupportContent />
    </Suspense>
  );
}
