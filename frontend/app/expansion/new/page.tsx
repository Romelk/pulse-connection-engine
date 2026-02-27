'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { expansionAPI } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/auth';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { localAdminSidebar } from '@/lib/sidebarConfig';


const INVESTMENT_RANGES = [
  { value: '<5',    label: 'Under ₹5 Lakhs'      },
  { value: '5-25',  label: '₹5 – ₹25 Lakhs'      },
  { value: '25-100',label: '₹25 – ₹1 Crore'      },
  { value: '>100',  label: 'Above ₹1 Crore'       },
];

const TIMELINES = [
  { value: '3months', label: 'Within 3 months'  },
  { value: '6months', label: '3 – 6 months'     },
  { value: '1year',   label: '6 months – 1 year'},
  { value: '2years',  label: '1 – 2 years'      },
];

const EXAMPLE_GOALS = [
  'Add a second production line to meet growing export demand',
  'Upgrade CNC machines to reduce labour cost and improve precision',
  'Set up a new packaging unit to handle increased SKU variety',
  'Expand storage capacity and install automated inventory tracking',
];

export default function ExpansionIntentPage() {
  const router = useRouter();
  const { user, isSuperAdmin, ready } = useCurrentUser();
  const { addToast } = useToast();

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/login'); return; }
    if (isSuperAdmin) { router.replace('/admin'); return; }
  }, [ready, user, isSuperAdmin]);

  const [businessGoal, setBusinessGoal]         = useState('');
  const [investmentRange, setInvestmentRange]   = useState('');
  const [timeline, setTimeline]                 = useState('');
  const [sector, setSector]                     = useState('Manufacturing');
  const [currentCapacity, setCurrentCapacity]   = useState('');
  const [targetCapacity, setTargetCapacity]     = useState('');
  const [isSubmitting, setIsSubmitting]         = useState(false);

  const handleSubmit = async () => {
    if (!businessGoal.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await expansionAPI.submitIntent({
        business_goal: businessGoal,
        investment_range: investmentRange || undefined,
        timeline: timeline || undefined,
        sector,
        current_capacity: currentCapacity || undefined,
        target_capacity: targetCapacity || undefined,
      });
      addToast({ type: 'success', title: 'Intent Submitted', message: 'AI is matching your goal to available schemes.' });
      router.push(`/expansion/${result.id}`);
    } catch {
      addToast({ type: 'error', title: 'Submission Failed', message: 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready || !user || isSuperAdmin) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sections={localAdminSidebar} currentPath="/expansion/new" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header appName="PulseAI" appSubtitle="Business Expansion — Find Government Schemes" showSearch={false} userName={user?.name || ''} userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'} userLocation={user?.company_name || ''} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h2 className="text-base font-semibold text-gray-900">What do you want to achieve?</h2>
              </div>
              <textarea
                value={businessGoal}
                onChange={e => setBusinessGoal(e.target.value)}
                rows={4}
                placeholder="Describe your expansion goal in plain language. E.g. 'I want to add a second production line to meet growing export demand for auto components.'"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">{businessGoal.length} characters — more detail gives better scheme matches</p>

              {/* Example prompts */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Example goals:</p>
                <div className="space-y-1.5">
                  {EXAMPLE_GOALS.map(g => (
                    <button key={g} onClick={() => setBusinessGoal(g)}
                      className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition">
                      "{g}"
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Additional Context <span className="text-gray-400 font-normal">(optional — improves matching)</span></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Range</label>
                  <select value={investmentRange} onChange={e => setInvestmentRange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select range</option>
                    {INVESTMENT_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                  <select value={timeline} onChange={e => setTimeline(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select timeline</option>
                    {TIMELINES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector / Industry</label>
                  <input type="text" value={sector} onChange={e => setSector(e.target.value)}
                    placeholder="e.g. Auto Components, Textile, Food Processing"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Capacity</label>
                  <input type="text" value={currentCapacity} onChange={e => setCurrentCapacity(e.target.value)}
                    placeholder="e.g. 500 units/day"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Capacity</label>
                  <input type="text" value={targetCapacity} onChange={e => setTargetCapacity(e.target.value)}
                    placeholder="e.g. 1000 units/day"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!businessGoal.trim() || isSubmitting} variant="primary" className="px-6">
                <Sparkles className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Matching Schemes...' : 'Find Matching Schemes'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
