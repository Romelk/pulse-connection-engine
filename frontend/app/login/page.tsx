'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Factory, Eye, EyeOff, Loader2 } from 'lucide-react';

// Demo credentials
const DEMO_USERS = [
  { email: 'manager@puneplantalpha.com', password: 'demo123', name: 'Rajesh Kumar', role: 'Plant Manager', plant: 'Pune Plant Alpha' },
  { email: 'supervisor@puneplantalpha.com', password: 'demo123', name: 'Priya Sharma', role: 'Shift Supervisor', plant: 'Pune Plant Alpha' },
  { email: 'admin@factoryhealth.ai', password: 'admin123', name: 'Admin User', role: 'System Admin', plant: 'All Plants' },
];

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = DEMO_USERS.find(u => u.email === email && u.password === password);

    if (user) {
      // Store user session
      localStorage.setItem('factoryhealth_user', JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role,
        plant: user.plant,
        loginTime: new Date().toISOString(),
      }));

      addToast({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${user.name}!`,
      });

      router.push('/overview');
    } else {
      setError('Invalid email or password. Try demo credentials below.');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUser: typeof DEMO_USERS[0]) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FactoryHealth AI</h1>
          <p className="text-gray-600 mt-1">AI-Powered Operations Assistant for SME Manufacturing</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <form onSubmit={handleLogin}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@puneplantalpha.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700">Forgot password?</a>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Demo Accounts (click to auto-fill):</p>
            <div className="space-y-2">
              {DEMO_USERS.map((user, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDemoLogin(user)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role} • {user.plant}</p>
                    </div>
                    <span className="text-xs text-blue-600">Click to use</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Built for India&apos;s Manufacturing Backbone
        </p>
      </div>
    </div>
  );
}
