'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Filter, Sparkles, TrendingUp, CheckCircle2, Wrench, MapPin, Shield, Zap, RefreshCw, FileText, Calendar, Building2, ExternalLink, Database, Bookmark } from 'lucide-react';
import { policiesAPI, scraperAPI } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import type { GovernmentScheme, PolicySummary, UdyamStatus } from '@/lib/types';

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

export default function PolicySupportPage() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [summary, setSummary] = useState<PolicySummary | null>(null);
  const [udyamStatus, setUdyamStatus] = useState<UdyamStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [isSyncingSchemes, setIsSyncingSchemes] = useState(false);
  const [activeTab, setActiveTab] = useState<'schemes' | 'applications' | 'saved'>('schemes');
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schemesData, summaryData, udyamData] = await Promise.all([
        policiesAPI.getSchemes(),
        policiesAPI.getSummary(),
        policiesAPI.getUdyamStatus(),
      ]);

      setSchemes(schemesData);
      setSummary(summaryData);
      setUdyamStatus(udyamData);
    } catch (error) {
      console.error('Error loading policy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScheme = async (schemeId: number, isSaved: boolean) => {
    try {
      if (isSaved) {
        await policiesAPI.unsaveScheme(schemeId);
        addToast({
          type: 'info',
          title: 'Scheme Removed',
          message: 'Scheme has been removed from your saved list.',
        });
      } else {
        await policiesAPI.saveScheme(schemeId);
        addToast({
          type: 'success',
          title: 'Scheme Saved',
          message: 'Scheme has been added to your saved list.',
        });
      }
      // Update local state
      setSchemes(schemes.map(s =>
        s.id === schemeId ? { ...s, is_saved: !isSaved } : s
      ));
    } catch (error) {
      console.error('Error saving scheme:', error);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Unable to save scheme. Please try again.',
      });
    }
  };

  const handleViewSchemeDetails = (scheme: GovernmentScheme) => {
    setSelectedScheme(scheme);
    setIsSchemeModalOpen(true);
  };

  const handleStartApplication = () => {
    addToast({
      type: 'success',
      title: 'Application Started',
      message: 'AI is preparing your application with 70% auto-fill.',
    });
  };

  const handleSyncSchemes = async () => {
    try {
      setIsSyncingSchemes(true);
      const result = await scraperAPI.syncSchemes();
      addToast({
        type: 'success',
        title: 'Schemes Updated',
        message: `Successfully synced ${result.schemesUpdated} government schemes from official sources.`,
      });
      // Reload scheme data
      await loadData();
    } catch (error) {
      console.error('Error syncing schemes:', error);
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: 'Unable to update schemes. Please try again.',
      });
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
        appName="FactoryHealth AI"
        appSubtitle="SME Operations Manager"
        searchPlaceholder="Search schemes..."
        userName="Shift A"
        userRole="Manager"
        userLocation="Pune Plant Alpha"
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
          currentPath="/policy-support"
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Government Policy Support
                </h1>
                <p className="text-gray-600">
                  Discover and apply for government schemes tailored to your manufacturing business
                </p>
              </div>

              {/* Udyam Status Badge */}
              {udyamStatus && (
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div>
                    <p className="text-xs text-gray-500">Udyam Status</p>
                    <p className="font-medium text-gray-900">{udyamStatus.tier} • {udyamStatus.state}</p>
                  </div>
                  {udyamStatus.verified && (
                    <Badge variant="success" size="sm">VERIFIED</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Sub-Navigation Tabs - More Prominent */}
            <div className="bg-white rounded-lg border border-gray-200 p-1 inline-flex gap-1">
              <button
                onClick={() => setActiveTab('schemes')}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'schemes'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Browse Schemes
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'applications'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My Applications
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'saved'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Saved Schemes
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'schemes' && (
              <>
                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    icon={<Database className="w-4 h-4" />}
                    onClick={handleSyncSchemes}
                    disabled={isSyncingSchemes}
                  >
                    {isSyncingSchemes ? 'Syncing...' : 'Refresh Schemes'}
                  </Button>
                  <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
                    Filter
                  </Button>
                </div>

            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-3 gap-6">
                <Card>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Potential Total Subsidy</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.potentialSubsidy.amount)}</p>
                  <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4" />
                    {summary.potentialSubsidy.comparisonLabel}
                  </p>
                </Card>

                <Card>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Eligible Schemes</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.eligibleSchemes.count} Programs</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {summary.eligibleSchemes.centralCount} Central, {summary.eligibleSchemes.stateCount} State Level
                  </p>
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

            {/* Schemes Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recommended Schemes</h2>
                <span className="text-sm text-gray-500">{schemes.length} schemes available</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {schemes.map((scheme) => (
                  <Card key={scheme.id} className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {scheme.priority_match && (
                          <Badge variant="info" size="sm">HIGH PRIORITY MATCH</Badge>
                        )}
                        <span className="text-xs text-gray-500">{scheme.ministry}</span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {scheme.name}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {scheme.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {scheme.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                          >
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
                        <p className="text-xs text-gray-500 uppercase">
                          {scheme.benefit_type === 'subsidy' ? 'Max Benefit' : 'Interest Subsidy'}
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                          {scheme.max_benefit ? formatCurrency(scheme.max_benefit) : `${scheme.benefit_unit}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveScheme(scheme.id, scheme.is_saved)}
                          className={`p-2 rounded-lg border transition-colors ${
                            scheme.is_saved
                              ? 'bg-green-50 border-green-200 text-green-600'
                              : 'border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200'
                          }`}
                          title={scheme.is_saved ? 'Remove from saved' : 'Save for later'}
                        >
                          <Bookmark className={`w-4 h-4 ${scheme.is_saved ? 'fill-current' : ''}`} />
                        </button>
                        <Button variant="primary" size="sm" onClick={() => handleViewSchemeDetails(scheme)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Smart Application CTA */}
                <div className="bg-gray-900 text-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        Start your application with AI assist.
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Our AI engine can automatically pre-fill up to <span className="font-semibold text-white">70% of your scheme application documents</span> using your Udyam profile and machine invoices.
                      </p>
                      <div className="flex gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                          <Shield className="w-4 h-4 text-blue-400" />
                          Encrypted Data
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          2x Faster Filing
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="lg" className="bg-white text-gray-900 hover:bg-gray-100 border-white" onClick={handleStartApplication}>
                      BEGIN SMART APPLICATION
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* My Applications Tab */}
            {activeTab === 'applications' && (
              <Card className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-500 mb-4">Start by browsing schemes and applying for eligible programs.</p>
                <Button variant="primary" onClick={() => setActiveTab('schemes')}>
                  Browse Schemes
                </Button>
              </Card>
            )}

            {/* Saved Schemes Tab */}
            {activeTab === 'saved' && (
              <>
                {schemes.filter(s => s.is_saved).length === 0 ? (
                  <Card className="text-center py-12">
                    <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Schemes</h3>
                    <p className="text-gray-500 mb-4">Save schemes you&apos;re interested in for quick access later.</p>
                    <Button variant="primary" onClick={() => setActiveTab('schemes')}>
                      Browse Schemes
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {schemes.filter(s => s.is_saved).map((scheme) => (
                      <Card key={scheme.id} className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {scheme.priority_match && (
                              <Badge variant="info" size="sm">HIGH PRIORITY MATCH</Badge>
                            )}
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
                            <button
                              onClick={() => handleSaveScheme(scheme.id, true)}
                              className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Remove from saved"
                            >
                              <Bookmark className="w-4 h-4 fill-current" />
                            </button>
                            <Button variant="primary" size="sm" onClick={() => handleViewSchemeDetails(scheme)}>
                              View Details
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
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
            <Button variant="outline" onClick={() => setIsSchemeModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={() => {
                handleStartApplication();
                setIsSchemeModalOpen(false);
              }}
            >
              Apply with AI Assist
            </Button>
          </>
        }
      >
        {selectedScheme && (
          <div className="space-y-6">
            {/* Benefit Card */}
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
                {selectedScheme.priority_match && (
                  <Badge variant="info" size="lg">HIGH PRIORITY MATCH</Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Description
              </h4>
              <p className="text-gray-600">{selectedScheme.description}</p>
            </div>

            {/* Eligibility */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Eligibility Criteria
              </h4>
              <ul className="space-y-2">
                {selectedScheme.eligibility_criteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Details Grid */}
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

            {/* Tags */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
              <div className="flex flex-wrap gap-2">
                {selectedScheme.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    {tag.includes('Udyam') && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                    {tag.includes('Technical') && <Wrench className="w-3.5 h-3.5 text-gray-500" />}
                    {tag.includes('Zone') && <MapPin className="w-3.5 h-3.5 text-blue-600" />}
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* External Link */}
            <div className="pt-4 border-t border-gray-100">
              <a
                href="#"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View on Official Government Portal
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
