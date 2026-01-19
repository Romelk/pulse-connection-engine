'use client';

import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Calendar, Download } from 'lucide-react';

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

const metrics = [
  {
    label: 'Overall Equipment Effectiveness',
    value: '87.5%',
    change: '+2.3%',
    trend: 'up',
    period: 'vs last month',
  },
  {
    label: 'Production Output',
    value: '12,450',
    change: '+8.1%',
    trend: 'up',
    period: 'units this month',
  },
  {
    label: 'Downtime Hours',
    value: '24.5',
    change: '-15%',
    trend: 'down',
    period: 'hours this month',
  },
  {
    label: 'Quality Rate',
    value: '98.2%',
    change: '+0.5%',
    trend: 'up',
    period: 'first pass yield',
  },
];

const weeklyData = [
  { day: 'Mon', production: 85, target: 80 },
  { day: 'Tue', production: 92, target: 80 },
  { day: 'Wed', production: 78, target: 80 },
  { day: 'Thu', production: 88, target: 80 },
  { day: 'Fri', production: 95, target: 80 },
  { day: 'Sat', production: 72, target: 80 },
  { day: 'Sun', production: 0, target: 0 },
];

export default function AnalyticsPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="FactoryHealth AI"
        appSubtitle="Analytics Dashboard"
        searchPlaceholder="Search reports..."
        userName="Shift A"
        userRole="Manager"
        userLocation="Pune Plant Alpha"
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={sidebarSections} currentPath="/analytics" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics & Reports</h1>
                <p className="text-gray-600">Monitor factory performance and trends</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" icon={<Calendar className="w-4 h-4" />}>
                  Last 30 Days
                </Button>
                <Button variant="primary" icon={<Download className="w-4 h-4" />}>
                  Export Report
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {metrics.map((metric, index) => (
                <Card key={index}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{metric.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <div className={`flex items-center gap-1 text-sm ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {metric.change}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{metric.period}</p>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Production Chart */}
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Weekly Production</h3>
                  </div>
                  <Badge variant="success" size="sm">On Track</Badge>
                </div>

                <div className="h-48 flex items-end justify-between gap-2">
                  {weeklyData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center gap-1" style={{ height: '160px' }}>
                        <div
                          className="w-full bg-blue-500 rounded-t-sm transition-all"
                          style={{ height: `${day.production}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{day.day}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <span className="text-sm text-gray-600">Production %</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                    <span className="text-sm text-gray-600">Target (80%)</span>
                  </div>
                </div>
              </Card>

              {/* Machine Utilization */}
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Machine Utilization</h3>
                  </div>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#22c55e"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${0.85 * 2 * Math.PI * 70} ${2 * Math.PI * 70}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">85%</p>
                        <p className="text-xs text-gray-500">Utilization</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Time</span>
                    <span className="font-semibold text-gray-900">340 hrs</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Idle Time</span>
                    <span className="font-semibold text-gray-900">48 hrs</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Maintenance</span>
                    <span className="font-semibold text-gray-900">12 hrs</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* AI Insights */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">AI-Powered Insights</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-800 mb-2">Production Forecast</p>
                  <p className="text-sm text-blue-700">
                    Based on current trends, expected to exceed monthly target by 8% if current pace maintained.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-sm font-medium text-orange-800 mb-2">Maintenance Alert</p>
                  <p className="text-sm text-orange-700">
                    CNC-Alpha-01 showing early signs of bearing wear. Schedule preventive maintenance within 2 weeks.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm font-medium text-green-800 mb-2">Efficiency Gain</p>
                  <p className="text-sm text-green-700">
                    Recent process optimization saved 45 minutes per shift. Annual savings: approx. ₹2.4 Lakhs.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
