'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Mail,
  Smartphone,
  Save,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { getLocalAdminSidebar } from '@/lib/sidebarConfig';
import { useCurrentUser } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Locale } from '@/lib/i18n/translations';


export default function SettingsPage() {
  const { addToast } = useToast();
  const { user } = useCurrentUser();
  const { locale, setLocale, t } = useLanguage();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsAlerts: true,
    criticalAlertsOnly: false,
    darkMode: false,
    timezone: 'Asia/Kolkata',
    autoBackup: true,
    aiRecommendations: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your preferences have been updated successfully.',
    });
  };

  const handleReset = () => {
    setSettings({
      emailNotifications: true,
      smsAlerts: true,
      criticalAlertsOnly: false,
      darkMode: false,
      timezone: 'Asia/Kolkata',
      autoBackup: true,
      aiRecommendations: true,
    });
    setLocale('en');
    addToast({
      type: 'info',
      title: 'Settings Reset',
      message: 'All settings have been restored to defaults.',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="PulseAI"
        appSubtitle="Settings"
        showSearch={false}
        userName={user?.name || ''}
        userRole={user?.role === 'super_admin' ? 'Super Admin' : 'Local Admin'}
        userLocation={user?.company_name || ''}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={getLocalAdminSidebar(t)} currentPath="/settings" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('settings.pageTitle')}</h1>
                <p className="text-gray-600">{t('settings.pageSubtitle')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" icon={<RefreshCw className="w-4 h-4" />} onClick={handleReset}>
                  Reset to Defaults
                </Button>
                <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Notifications */}
            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-500">Configure how you receive alerts</p>
                </div>
              </div>

              <div className="space-y-4 pl-13">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive alerts via email</p>
                  </div>
                  <button
                    onClick={() => handleToggle('emailNotifications')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">SMS Alerts</p>
                    <p className="text-sm text-gray-500">Receive critical alerts via SMS</p>
                  </div>
                  <button
                    onClick={() => handleToggle('smsAlerts')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.smsAlerts ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.smsAlerts ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Critical Alerts Only</p>
                    <p className="text-sm text-gray-500">Only notify for critical severity</p>
                  </div>
                  <button
                    onClick={() => handleToggle('criticalAlertsOnly')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.criticalAlertsOnly ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.criticalAlertsOnly ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </Card>

            {/* AI Settings */}
            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI & Automation</h3>
                  <p className="text-sm text-gray-500">Configure AI features</p>
                </div>
              </div>

              <div className="space-y-4 pl-13">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">AI Recommendations</p>
                    <p className="text-sm text-gray-500">Show AI-powered maintenance suggestions</p>
                  </div>
                  <button
                    onClick={() => handleToggle('aiRecommendations')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.aiRecommendations ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.aiRecommendations ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Auto Backup</p>
                    <p className="text-sm text-gray-500">Automatically backup data daily</p>
                  </div>
                  <button
                    onClick={() => handleToggle('autoBackup')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.autoBackup ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.autoBackup ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </Card>

            {/* Localization */}
            <Card className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Localization</h3>
                  <p className="text-sm text-gray-500">Language and regional settings</p>
                </div>
              </div>

              <div className="space-y-4 pl-13">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Language</p>
                    <p className="text-sm text-gray-500">Select your preferred language</p>
                  </div>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">{t('lang.en')}</option>
                    <option value="hi">{t('lang.hi')}</option>
                    <option value="mr">{t('lang.mr')}</option>
                    <option value="ta">{t('lang.ta')}</option>
                    <option value="bn">{t('lang.bn')}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Timezone</p>
                    <p className="text-sm text-gray-500">Set your local timezone</p>
                  </div>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* App Info */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">About</h3>
                  <p className="text-sm text-gray-500">Application information</p>
                </div>
              </div>

              <div className="space-y-2 pl-13 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Version</span>
                  <span className="text-gray-900">1.0.0</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">AI Engine</span>
                  <span className="text-gray-900">v4.2.0</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Last Sync</span>
                  <span className="text-gray-900">2 minutes ago</span>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
