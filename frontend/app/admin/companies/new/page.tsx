'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { adminAPI } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/auth';
import { Building2, User, CheckCircle, ArrowLeft, Copy, Eye, EyeOff } from 'lucide-react';

const sidebarSections = [
  {
    items: [
      { label: 'Companies', href: '/admin',    icon: 'dashboard' as const },
      { label: 'Settings',  href: '/settings', icon: 'settings'  as const },
    ],
  },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const INDUSTRIES = [
  'Automotive','Chemicals','Electronics','Food & Beverage','Pharmaceuticals',
  'Steel & Metals','Textiles','Plastics','Paper & Packaging','Heavy Machinery',
  'Cement','Power & Energy','Agriculture','Defense','Other',
];

interface CreatedResult {
  company: any;
  localAdmin: any;
}

export default function NewCompanyPage() {
  const router = useRouter();
  const { user, isSuperAdmin, ready } = useCurrentUser();

  const [form, setForm] = useState({
    name: '', industry: '', location: '', state: '', udyam_number: '',
    admin_name: '', admin_email: '', admin_password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreatedResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!ready || !user || !isSuperAdmin) return null;

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.location || !form.state || !form.admin_name || !form.admin_email || !form.admin_password) {
      setError('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await adminAPI.createCompany({
        name: form.name,
        industry: form.industry || undefined,
        location: form.location,
        state: form.state,
        udyam_number: form.udyam_number || undefined,
        admin_name: form.admin_name,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
      });
      setCreated(result);
    } catch (err: any) {
      setError(err?.body?.error || 'Failed to create company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sections={sidebarSections} currentPath="/admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          appName="PulseAI"
          showSearch={false}
          appSubtitle="Add New Company"
          userName={user.name}
          userRole="Super Admin"
          userLocation="PulseAI HQ"
        />
        <main className="flex-1 overflow-y-auto p-6">

          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Companies
            </button>

            {created ? (
              /* ── Success Card ── */
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Company Created!</h2>
                <p className="text-sm text-gray-500 mb-6">
                  <span className="font-semibold text-gray-800">{created.company.name}</span> has been onboarded.
                  Share the credentials below with the Local Admin.
                </p>

                <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Login Email</p>
                      <p className="text-sm font-mono font-semibold text-gray-900">{created.localAdmin.email}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(created.localAdmin.email, 'email')}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      {copied === 'email' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Password</p>
                      <p className="text-sm font-mono font-semibold text-gray-900">{form.admin_password}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(form.admin_password, 'password')}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      {copied === 'password' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="text-sm font-semibold text-gray-900">{created.company.name} — {created.company.location}, {created.company.state}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => router.push('/admin')}>
                    Back to Companies
                  </Button>
                  <Button variant="primary" onClick={() => { setCreated(null); setForm({ name:'',industry:'',location:'',state:'',udyam_number:'',admin_name:'',admin_email:'',admin_password:'' }); }}>
                    Add Another Company
                  </Button>
                </div>
              </Card>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Details */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Company Details</h2>
                      <p className="text-xs text-gray-500">Information about the manufacturing company</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                        placeholder="e.g. Tata Motors – Pune Plant" className={inputClass} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Industry</label>
                        <select value={form.industry} onChange={e => set('industry', e.target.value)} className={inputClass}>
                          <option value="">Select industry</option>
                          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>State <span className="text-red-500">*</span></label>
                        <select value={form.state} onChange={e => set('state', e.target.value)} className={inputClass} required>
                          <option value="">Select state</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>City / Location <span className="text-red-500">*</span></label>
                        <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
                          placeholder="e.g. Pune" className={inputClass} required />
                      </div>
                      <div>
                        <label className={labelClass}>Udyam Number <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input type="text" value={form.udyam_number} onChange={e => set('udyam_number', e.target.value)}
                          placeholder="UDYAM-MH-00-0000000" className={inputClass} />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Local Admin Account */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Local Admin Account</h2>
                      <p className="text-xs text-gray-500">The plant manager who will manage this company's dashboard</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.admin_name} onChange={e => set('admin_name', e.target.value)}
                        placeholder="e.g. Rajesh Kumar" className={inputClass} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                        <input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)}
                          placeholder="manager@company.com" className={inputClass} required />
                      </div>
                      <div>
                        <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.admin_password}
                            onChange={e => set('admin_password', e.target.value)}
                            placeholder="Create a password" className={`${inputClass} pr-10`} required
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="secondary" onClick={() => router.push('/admin')}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create Company & Admin'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
