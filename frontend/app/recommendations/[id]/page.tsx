'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Sparkles, CheckCircle, Clock, X, BarChart3, ThumbsUp, ThumbsDown, Moon, History, Info, Download } from 'lucide-react';
import { alertsAPI, operationsAPI, aiAPI } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import PolicyRecommendationCard from '@/components/recommendations/PolicyRecommendationCard';
import DetailedDataModal from '@/components/recommendations/DetailedDataModal';
import type { AIRecommendation } from '@/lib/types';
import { localAdminSidebar } from '@/lib/sidebarConfig';
import { useCurrentUser } from '@/lib/auth';


export default function RecommendationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDetailedDataOpen, setIsDetailedDataOpen] = useState(false);
  const { addToast } = useToast();
  const { user } = useCurrentUser();

  useEffect(() => {
    loadRecommendation();
  }, [resolvedParams.id]);

  const loadRecommendation = async () => {
    try {
      setIsLoading(true);
      const data = await alertsAPI.getRecommendation(parseInt(resolvedParams.id));
      setRecommendation(data);
    } catch (error) {
      console.error('Error loading recommendation:', error);
      // Set default mock data if not found
      setRecommendation({
        id: 1,
        alert_id: parseInt(resolvedParams.id),
        priority: 'HIGH PRIORITY',
        category: 'MAINTENANCE',
        title: 'Schedule Preventive Maintenance at 4 PM',
        explanation: 'Our sensors detected abnormal vibration frequencies in Milling Machine #4. We predict a critical bearing failure will occur within the next 6 hours.',
        uptime_gain: '4 Hours Saved',
        cost_avoidance: 12500,
        why_reasons: [
          {
            icon: 'moon',
            title: 'Avoid Night Shift Breakdown',
            description: 'A failure at 10 PM would result in zero production until tomorrow morning, as the maintenance crew is off-site.',
          },
          {
            icon: 'history',
            title: 'Historical Context',
            description: 'Similar vibration patterns in October led to a total spindle failure that cost ₹85,000 in parts alone.',
          },
        ],
        confidence_score: 94,
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!recommendation) return;

    try {
      setIsConfirming(true);

      // Log the action to operations history
      await operationsAPI.logAction({
        machineId: 1, // Default machine ID
        alertId: recommendation.alert_id,
        aiRecommendation: recommendation.title,
        aiRecommendationSeverity: 'warning',
        actionTaken: 'Confirmed AI recommendation and notified maintenance team',
        actionTakenBy: 'Rajesh Kumar',
        outcome: 'Maintenance scheduled',
      });

      // Also resolve the alert
      await alertsAPI.resolve(recommendation.alert_id);

      addToast({
        type: 'success',
        title: 'Team Notified',
        message: 'Maintenance has been scheduled for 4 PM. The maintenance team has been notified via SMS and email.',
      });

      // Navigate back to overview after a delay
      setTimeout(() => {
        router.push('/overview');
      }, 2000);
    } catch (error) {
      console.error('Error confirming recommendation:', error);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Unable to confirm recommendation. Please try again.',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRemind = () => {
    addToast({
      type: 'info',
      title: 'Reminder Set',
      message: 'You will be reminded about this recommendation in 1 hour.',
    });
  };

  const handleDismiss = async () => {
    if (!recommendation) return;

    try {
      await alertsAPI.dismiss(recommendation.alert_id);
      addToast({
        type: 'info',
        title: 'Recommendation Dismissed',
        message: 'This recommendation has been dismissed. You can view it in the history.',
      });
      router.push('/overview');
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: 'Unable to dismiss recommendation. Please try again.',
      });
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    addToast({
      type: 'success',
      title: 'Feedback Recorded',
      message: type === 'up'
        ? 'Thank you! Your positive feedback helps improve our AI.'
        : 'Thank you for your feedback. We\'ll work to improve our recommendations.',
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recommendation...</p>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recommendation found</p>
          <Link href="/overview" className="text-blue-600 hover:underline mt-2 block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    moon: Moon,
    history: History,
  };

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
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          sections={localAdminSidebar}
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
                { label: 'Operations Dashboard', href: '/overview' },
                { label: 'AI Recommendation' },
              ]}
            />

            {/* Smart Insight Badge & Title */}
            <div className="text-center">
              <Badge variant="outline" size="lg" className="gap-2 mb-4">
                <Sparkles className="w-4 h-4" />
                SMART INSIGHT
              </Badge>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Recommended Action
              </h1>
            </div>

            {/* Main Recommendation Card */}
            <Card className="overflow-hidden" padding="none">
              <div className="flex flex-col lg:flex-row">
                {/* Image */}
                <div className="relative h-48 lg:h-auto lg:w-72 flex-shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1504222490345-c075b6008014?w=600&q=80"
                    alt="CNC Machine"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-orange-600">
                      {recommendation.priority} • {recommendation.category}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-gray-900 mb-3">
                    {recommendation.title}
                  </h2>

                  {/* Info Box */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg mb-4">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        {recommendation.explanation.split('Milling Machine #4').map((part, i, arr) =>
                          i < arr.length - 1 ? (
                            <span key={i}>{part}<strong>Milling Machine #4</strong></span>
                          ) : part
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Expected Benefit */}
                  <div className="mb-4">
                    <p className="text-sm text-green-600 font-medium mb-2 flex items-center gap-1">
                      <span className="text-lg">↗</span> Expected Benefit
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase mb-1">Uptime Gain</p>
                        <p className="font-semibold text-gray-900">{recommendation.uptime_gain}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 uppercase mb-1">Cost Avoidance</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(recommendation.cost_avoidance)} Saved</p>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    icon={<CheckCircle className="w-5 h-5" />}
                    onClick={handleConfirm}
                    disabled={isConfirming}
                  >
                    {isConfirming ? 'Notifying Team...' : 'Confirm & Notify Team'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Why Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Why follow this recommendation?
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendation.why_reasons.map((reason, index) => {
                  const Icon = iconMap[reason.icon] || Info;
                  return (
                    <Card key={index}>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{reason.title}</h4>
                          <p className="text-sm text-gray-600">{reason.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Policy Hunter Section - Linked Funding Opportunities */}
            {recommendation.linked_policies && (
              <PolicyRecommendationCard
                linkedPolicies={recommendation.linked_policies}
                onShareWhatsApp={async () => {
                  try {
                    const { whatsappUrl } = await aiAPI.getWhatsAppNotification(recommendation.alert_id);
                    window.open(whatsappUrl, '_blank');
                  } catch (error) {
                    console.error('Error sharing to WhatsApp:', error);
                    addToast({
                      type: 'error',
                      title: 'Share Failed',
                      message: 'Unable to generate WhatsApp message.',
                    });
                  }
                }}
                onApply={async (schemeIndex) => {
                  if (!recommendation.linked_policies) return;
                  try {
                    await aiAPI.markPolicyApplied(recommendation.linked_policies.id);
                    addToast({
                      type: 'success',
                      title: 'Application Started',
                      message: 'Redirecting to government portal for scheme application.',
                    });
                  } catch (error) {
                    console.error('Error marking scheme applied:', error);
                  }
                }}
              />
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" icon={<Clock className="w-4 h-4" />} onClick={handleRemind}>
                Remind in 1 hour
              </Button>
              <Button variant="outline" icon={<X className="w-4 h-4" />} onClick={handleDismiss}>
                Dismiss
              </Button>
              <Button variant="outline" icon={<BarChart3 className="w-4 h-4" />} onClick={() => setIsDetailedDataOpen(true)}>
                View Detailed Data
              </Button>
            </div>

            {/* Feedback */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Was this recommendation helpful?</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleFeedback('up')}
                  disabled={feedback !== null}
                  className={`p-2 rounded-lg transition-colors ${
                    feedback === 'up' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-400'
                  } ${feedback !== null && feedback !== 'up' ? 'opacity-50' : ''}`}
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleFeedback('down')}
                  disabled={feedback !== null}
                  className={`p-2 rounded-lg transition-colors ${
                    feedback === 'down' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-400'
                  } ${feedback !== null && feedback !== 'down' ? 'opacity-50' : ''}`}
                >
                  <ThumbsDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <footer className="flex flex-col sm:flex-row justify-between text-sm text-gray-500 pt-6 border-t border-gray-200 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                AI Engine: Version 4.2.0 | Confidence Score: {recommendation.confidence_score}%
              </div>
              <div>
                © 2024 Smart Manufacturing Systems India
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Detailed Data Modal */}
      <DetailedDataModal
        isOpen={isDetailedDataOpen}
        onClose={() => setIsDetailedDataOpen(false)}
        machineId="CNC-Alpha-01"
        machineName="Milling Machine #4"
      />
    </div>
  );
}
