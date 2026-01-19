'use client';

import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getRelativeTime } from '@/lib/utils';
import { Factory, MapPin, Phone, Mail, Award, Clock, Users } from 'lucide-react';

interface FactoryStatusCardProps {
  status: 'stable' | 'warning' | 'critical';
  lastAiSync: string | null;
  pulse: 'Normal' | 'Elevated' | 'Critical';
  overallHealth: number;
  onRunDiagnostics?: () => void;
  isLoading?: boolean;
}

export default function FactoryStatusCard({
  status,
  lastAiSync,
  pulse,
  overallHealth,
  onRunDiagnostics,
  isLoading,
}: FactoryStatusCardProps) {
  const statusConfig = {
    stable: { label: 'Stable', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50' },
    warning: { label: 'Warning', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50' },
    critical: { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50' },
  };

  const config = statusConfig[status];

  return (
    <Card className="p-0 overflow-hidden">
      {/* Top Section - Company Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Factory className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bharat Precision Works Pvt. Ltd.</h1>
              <p className="text-blue-100 text-sm mt-0.5">Excellence in Engineering Since 1998</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">
              <Award className="w-4 h-4" />
              MSME Certified
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section - Company Details & Status */}
      <div className="p-5 border-b border-gray-100">
        <div className="grid grid-cols-4 gap-6">
          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
              <p className="font-medium text-gray-900 text-sm">Pune, Maharashtra</p>
              <p className="text-xs text-gray-500">MIDC Phase II, Chakan</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Contact</p>
              <p className="font-medium text-gray-900 text-sm">+91 20 6789 1234</p>
              <p className="text-xs text-gray-500">info@bharatprecision.in</p>
            </div>
          </div>

          {/* Workforce */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Workforce</p>
              <p className="font-medium text-gray-900 text-sm">127 Employees</p>
              <p className="text-xs text-gray-500">3 Shifts / 24x7 Ops</p>
            </div>
          </div>

          {/* Current Shift */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current Shift</p>
              <p className="font-medium text-gray-900 text-sm">Shift A (Morning)</p>
              <p className="text-xs text-gray-500">06:00 - 14:00 IST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Factory Status & AI */}
      <div className={`p-5 ${config.bgLight}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${config.color} animate-pulse`}></span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Factory Status: {config.label}
                </h2>
                <p className="text-sm text-gray-500">
                  Last AI sync: {lastAiSync ? getRelativeTime(lastAiSync) : 'Never'} • Pulse: {pulse}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Overall Health</p>
              <p className={`text-3xl font-bold ${overallHealth >= 90 ? 'text-green-600' : overallHealth >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                {overallHealth}%
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={onRunDiagnostics}
              isLoading={isLoading}
            >
              Run AI Diagnostics
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
