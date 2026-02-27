'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { expansionAPI } from '@/lib/api/client';
import { CheckCircle, AlertCircle, Sparkles, ArrowLeft, ExternalLink, TrendingUp } from 'lucide-react';
import { localAdminSidebar } from '@/lib/sidebarConfig';
import { useCurrentUser } from '@/lib/auth';


export default function ExpansionResultPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [intent, setIntent] = useState<any>(null);

  useEffect(() => {
    expansionAPI.getById(parseInt(params.id as string)).then(setIntent).catch(console.error);
  }, [params.id]);

  if (!intent) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar sections={localAdminSidebar} currentPath="/expansion/new" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse text-purple-400" />
            <p>AI is matching your intent to schemes...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasMatch = intent.status === 'matched' && intent.matched_schemes?.length > 0;
  const totalBenefit = intent.matched_schemes
    ? intent.matched_schemes.reduce((s: number, sc: any) => s + (sc.max_benefit || 0), 0)
    : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sections={localAdminSidebar} currentPath="/expansion/new" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          appName="PulseAI"
          showSearch={false}
          appSubtitle={hasMatch ? 'Schemes Found!' : 'Gap Analysis'}
          userName={user?.name || ''}
          userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'}
          userLocation={user?.company_name || ''}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Back + Goal Summary */}
            <div>
              <button onClick={() => router.push('/expansion/new')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
                <ArrowLeft className="w-4 h-4" /> New expansion intent
              </button>
              <Card className="p-4 bg-purple-50 border border-purple-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Your Goal</p>
                    <p className="text-sm text-purple-700 mt-0.5">"{intent.business_goal}"</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-purple-600">
                      {intent.investment_range && <span>Investment: {intent.investment_range}</span>}
                      {intent.timeline && <span>Timeline: {intent.timeline}</span>}
                      {intent.sector && <span>Sector: {intent.sector}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Matched Schemes */}
            {hasMatch && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {intent.matched_schemes.length} Matching Scheme{intent.matched_schemes.length > 1 ? 's' : ''} Found
                  </h2>
                  <div className="text-sm text-green-700 font-semibold bg-green-50 border border-green-100 px-3 py-1 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                    Up to ₹{(totalBenefit / 100000).toFixed(0)}L potential benefit
                  </div>
                </div>

                <div className="space-y-4">
                  {intent.matched_schemes.map((scheme: any, i: number) => (
                    <Card key={i} className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{scheme.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{scheme.ministry}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={scheme.level === 'central' ? 'info' : 'warning'}>
                            {scheme.level === 'central' ? 'Central' : 'State'}
                          </Badge>
                          <span className="text-sm font-bold text-green-700">
                            ₹{scheme.max_benefit ? (scheme.max_benefit / 100000).toFixed(0) + 'L' : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{scheme.description}</p>

                      {scheme.why_it_fits && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Why this matches your goal:</p>
                          <p className="text-xs text-blue-600">{scheme.why_it_fits}</p>
                        </div>
                      )}

                      {scheme.next_step && (
                        <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-0.5">Next Step</p>
                            <p className="text-xs text-gray-600">{scheme.next_step}</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Gap Analysis */}
            {!hasMatch && intent.gap_analysis && (
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-2">No Direct Match Found — Here's the Gap</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">{intent.gap_analysis}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={() => router.push('/expansion/new')} variant="secondary">
                Try a Different Goal
              </Button>
              <Button onClick={() => router.push('/policy-support')} variant="primary">
                <ExternalLink className="w-4 h-4 mr-1" /> Browse All Schemes
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
