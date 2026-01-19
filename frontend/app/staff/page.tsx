'use client';

import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Users, UserCheck, UserX, Clock, Phone, Mail } from 'lucide-react';

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

const staffMembers = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    role: 'Sr. Maintenance Engineer',
    department: 'Maintenance',
    status: 'on_duty',
    shift: 'Morning (6 AM - 2 PM)',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@plant.com',
    initials: 'RK',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    role: 'Production Supervisor',
    department: 'Production',
    status: 'on_duty',
    shift: 'Morning (6 AM - 2 PM)',
    phone: '+91 98765 43211',
    email: 'priya.sharma@plant.com',
    initials: 'PS',
  },
  {
    id: 3,
    name: 'Amit Patel',
    role: 'Machine Operator',
    department: 'Production',
    status: 'on_duty',
    shift: 'Morning (6 AM - 2 PM)',
    phone: '+91 98765 43212',
    email: 'amit.patel@plant.com',
    initials: 'AP',
  },
  {
    id: 4,
    name: 'Sunita Devi',
    role: 'Quality Inspector',
    department: 'Quality',
    status: 'on_break',
    shift: 'Morning (6 AM - 2 PM)',
    phone: '+91 98765 43213',
    email: 'sunita.devi@plant.com',
    initials: 'SD',
  },
  {
    id: 5,
    name: 'Vikram Singh',
    role: 'Electrician',
    department: 'Maintenance',
    status: 'off_duty',
    shift: 'Evening (2 PM - 10 PM)',
    phone: '+91 98765 43214',
    email: 'vikram.singh@plant.com',
    initials: 'VS',
  },
  {
    id: 6,
    name: 'Meera Reddy',
    role: 'Plant Manager',
    department: 'Management',
    status: 'on_duty',
    shift: 'General (9 AM - 6 PM)',
    phone: '+91 98765 43215',
    email: 'meera.reddy@plant.com',
    initials: 'MR',
  },
];

const statusConfig = {
  on_duty: { label: 'On Duty', variant: 'success' as const, color: 'bg-green-500' },
  on_break: { label: 'On Break', variant: 'warning' as const, color: 'bg-yellow-500' },
  off_duty: { label: 'Off Duty', variant: 'default' as const, color: 'bg-gray-400' },
};

export default function StaffPage() {
  const onDutyCount = staffMembers.filter(s => s.status === 'on_duty').length;
  const onBreakCount = staffMembers.filter(s => s.status === 'on_break').length;
  const offDutyCount = staffMembers.filter(s => s.status === 'off_duty').length;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="FactoryHealth AI"
        appSubtitle="Staff Management"
        searchPlaceholder="Search staff..."
        userName="Shift A"
        userRole="Manager"
        userLocation="Pune Plant Alpha"
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={sidebarSections} currentPath="/staff" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff Directory</h1>
              <p className="text-gray-600">Manage shift schedules and staff assignments</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{onDutyCount}</p>
                  <p className="text-sm text-gray-500">On Duty</p>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{onBreakCount}</p>
                  <p className="text-sm text-gray-500">On Break</p>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <UserX className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{offDutyCount}</p>
                  <p className="text-sm text-gray-500">Off Duty</p>
                </div>
              </Card>
            </div>

            {/* Staff List */}
            <div className="space-y-3">
              {staffMembers.map((staff) => {
                const config = statusConfig[staff.status as keyof typeof statusConfig];

                return (
                  <Card key={staff.id} hover className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {staff.initials}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                        <Badge variant={config.variant} size="sm">{config.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {staff.role} • {staff.department}
                      </p>
                    </div>

                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-4 h-4" />
                        {staff.shift}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={`tel:${staff.phone}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                      <a
                        href={`mailto:${staff.email}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
