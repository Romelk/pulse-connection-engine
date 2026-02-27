'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { downtimeAPI } from '@/lib/api/client';
import { AlertTriangle, CheckCircle, Clock, TrendingDown, Banknote, Wrench, PackageX } from 'lucide-react';
import { getLocalAdminSidebar } from '@/lib/sidebarConfig';
import { useCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';


export default function RepairCostPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const downtimeId = parseInt(params.id as string);

  const [event, setEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form
  const [isRepairable, setIsRepairable]           = useState<boolean>(true);
  const [repairCost, setRepairCost]               = useState('');
  const [repairHours, setRepairHours]             = useState('');
  const [repairDescription, setRepairDescription] = useState('');
  const [cause, setCause]                         = useState('');

  useEffect(() => {
    downtimeAPI.getById(downtimeId).then(setEvent).catch(console.error);
  }, [downtimeId]);

  const actualDowntimeHours = event
    ? parseFloat(((Date.now() - new Date(event.start_time).getTime()) / 3600000).toFixed(1))
    : 0;

  // Use entered repair hours for estimate if provided, otherwise use actual downtime so far
  const estimateHours = repairHours ? parseFloat(repairHours) : actualDowntimeHours;
  const productionLoss = Math.round(estimateHours * (event?.hourly_downtime_cost || 0));
  const totalEstimate = (parseInt(repairCost) || 0) + productionLoss;

  const handleSubmit = async () => {
    if (!repairCost) return;
    setIsSubmitting(true);
    try {
      const descriptionPrefix = isRepairable ? '' : '[REPLACEMENT] ';
      const fullDescription = repairDescription
        ? `${descriptionPrefix}${repairDescription}`
        : isRepairable ? '' : '[REPLACEMENT]';

      const res = await downtimeAPI.submitRepair(downtimeId, {
        repair_cost: parseInt(repairCost),
        repair_description: fullDescription || undefined,
        cause,
      });
      setResult(res);
      addToast({
        type: 'success',
        title: isRepairable ? 'Repair Cost Logged' : 'Replacement Cost Logged',
        message: res.schemeTriggered
          ? 'Total loss threshold exceeded — government schemes have been identified!'
          : 'Downtime event resolved successfully.',
      });
    } catch {
      addToast({ type: 'error', title: 'Submission Failed', message: 'Could not log cost.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header appName="PulseAI" appSubtitle={`Log Cost · Downtime #${downtimeId}`} showSearch={false} userName={user?.name || ''} userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'} userLocation={user?.company_name || ''} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={getLocalAdminSidebar(t)} currentPath="/downtime" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Event Summary */}
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Downtime Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{actualDowntimeHours}h</div>
                  <div className="text-xs text-gray-500">Duration so far</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    ₹{productionLoss.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {repairHours ? 'Production loss (est. repair hrs)' : 'Production loss so far'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    ₹{(event.hourly_downtime_cost || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-500">Per hour cost</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Started: {new Date(event.start_time).toLocaleString('en-IN')} · {event.machine_name}
              </div>
            </Card>

            {/* Result: Scheme Triggered */}
            {result && result.schemeTriggered && (
              <Card className="p-5 bg-green-50 border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">Government Schemes Identified!</h3>
                    <p className="text-sm text-green-700 mb-3">
                      Total loss of <strong>₹{result.costAnalysis?.totalLoss?.toLocaleString('en-IN')}</strong> exceeds
                      the ₹50,000 threshold. The following schemes may help fund repairs or upgrades:
                    </p>
                    <div className="space-y-2">
                      {result.schemeResult?.schemes?.map((s: any, i: number) => (
                        <div key={i} className="bg-white border border-green-100 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                            <Badge variant="success">Up to ₹{(s.max_benefit / 100000).toFixed(0)}L</Badge>
                          </div>
                          <p className="text-xs text-gray-600">{s.description}</p>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => router.push('/policy-support')} variant="primary" className="mt-3">
                      View All Schemes →
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Result: No trigger */}
            {result && !result.schemeTriggered && (
              <Card className="p-4 bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Downtime resolved. Total loss: ₹{result.costAnalysis?.totalLoss?.toLocaleString('en-IN')} — below scheme trigger threshold.</span>
                </div>
              </Card>
            )}

            {/* Form */}
            {!result && (
              <Card className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-blue-500" /> Log Cost & Resolution
                </h2>
                <div className="space-y-5">

                  {/* Is Repair Possible? */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Is repair possible?</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsRepairable(true)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                          isRepairable
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                      >
                        <Wrench className="w-4 h-4" /> Yes, can be repaired
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsRepairable(false); setRepairHours(''); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                          !isRepairable
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-red-400'
                        }`}
                      >
                        <PackageX className="w-4 h-4" /> No, needs replacement
                      </button>
                    </div>
                    {!isRepairable && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Enter the full cost of replacement equipment below.
                      </p>
                    )}
                  </div>

                  {/* Cost field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isRepairable ? 'Total Repair Cost (₹)' : 'Replacement Cost (₹)'} *
                    </label>
                    <input
                      type="number"
                      value={repairCost}
                      onChange={e => setRepairCost(e.target.value)}
                      placeholder={isRepairable ? 'e.g. 25000 (parts + labour)' : 'e.g. 150000 (new unit cost)'}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {isRepairable ? 'Include all parts cost + labour cost' : 'Cost of procuring replacement equipment'}
                    </p>
                  </div>

                  {/* Repair hours — only shown when repairable */}
                  {isRepairable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated hours machine will be unavailable
                      </label>
                      <input
                        type="number"
                        value={repairHours}
                        onChange={e => setRepairHours(e.target.value)}
                        placeholder={`e.g. 4  (machine has been down ${actualDowntimeHours}h already)`}
                        min="0"
                        step="0.5"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Used to calculate production loss estimate. Leave blank to use actual downtime ({actualDowntimeHours}h so far).
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isRepairable ? 'What was repaired?' : 'What needs to be replaced?'}
                    </label>
                    <textarea
                      value={repairDescription}
                      onChange={e => setRepairDescription(e.target.value)}
                      rows={2}
                      placeholder={
                        isRepairable
                          ? 'e.g. Replaced spindle bearings, lubricated assembly'
                          : 'e.g. Main motor burnt out, full motor unit replacement required'
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Root Cause */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
                    <input
                      type="text"
                      value={cause}
                      onChange={e => setCause(e.target.value)}
                      placeholder="e.g. Bearing wear, coolant blockage, electrical fault"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Live estimate */}
                  {repairCost && (
                    <div className={`p-3 rounded-lg border text-sm ${totalEstimate >= 50000 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                      <div className="font-semibold mb-1 flex items-center gap-2">
                        {totalEstimate >= 50000 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        Estimated Total Loss: ₹{totalEstimate.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs space-y-0.5">
                        <div>{isRepairable ? 'Repair cost' : 'Replacement cost'}: ₹{parseInt(repairCost).toLocaleString('en-IN')}</div>
                        <div>
                          Production loss: ₹{productionLoss.toLocaleString('en-IN')}
                          {' '}({estimateHours}h × ₹{event.hourly_downtime_cost?.toLocaleString('en-IN')}/hr)
                          {repairHours && isRepairable && <span className="text-blue-600 ml-1">(using your estimate)</span>}
                        </div>
                        {totalEstimate >= 50000 && (
                          <div className="text-amber-700 font-medium mt-1">
                            Exceeds ₹50,000 threshold — government schemes will be suggested automatically.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <Button onClick={() => router.push('/downtime')} variant="secondary">Cancel</Button>
                  <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting || !repairCost}>
                    <TrendingDown className="w-4 h-4 mr-1" />
                    {isSubmitting ? 'Processing...' : isRepairable ? 'Submit Repair & Close' : 'Submit Replacement & Close'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
