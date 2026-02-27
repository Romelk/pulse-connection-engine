'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Factory, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api/client';
import { setUser } from '@/lib/auth';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const DEMO_ACCOUNTS = [
  { email: 'admin@pulseai.in',             password: 'admin123', label: 'PulseAI Admin',  role: 'Super Admin'  },
  { email: 'manager@puneplantalpha.com',   password: 'demo123',  label: 'Rajesh Kumar',   role: 'Local Admin — Pune Plant Alpha' },
];

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await authAPI.login(email.trim(), password);
      setUser(user);
      addToast({ type: 'success', title: t('login.success'), message: `${t('login.welcomeBack')}, ${user.name}!` });
      router.push(user.role === 'super_admin' ? '/admin' : '/overview');
    } catch (err: any) {
      setError(t('login.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('login.heading')}</h1>
          <p className="text-gray-600 mt-1">{t('login.tagline')}</p>
        </div>

        <Card className="shadow-xl">
          <form onSubmit={handleLogin}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('login.formTitle')}</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('login.emailLabel')}</label>
                <input
                  id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{t('login.passwordLabel')}</label>
                <div className="relative">
                  <input
                    id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('action.signingIn')}</> : t('action.signIn')}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">{t('login.demoAccounts')}</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{acc.label}</p>
                      <p className="text-xs text-gray-500">{acc.role}</p>
                    </div>
                    <span className="text-xs text-blue-600">{t('login.clickToUse')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
