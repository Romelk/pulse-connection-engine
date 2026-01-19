'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Settings, User, LogOut, ChevronDown } from 'lucide-react';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface HeaderProps {
  appName: string;
  appSubtitle?: string;
  logo?: React.ReactNode;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showSettings?: boolean;
  userName?: string;
  userRole?: string;
  userLocation?: string;
  topNav?: { label: string; href: string; active?: boolean }[];
  syncStatus?: string;
}

interface StoredUser {
  email: string;
  name: string;
  role: string;
  plant: string;
  loginTime: string;
}

export default function Header({
  appName,
  appSubtitle,
  logo,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showSettings = false,
  userName,
  userRole,
  userLocation,
  topNav,
  syncStatus,
}: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('factoryhealth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('factoryhealth_user');
    router.push('/login');
  };

  const displayName = user?.name || userName || 'Guest User';
  const displayRole = user?.role || userRole || 'User';
  const displayLocation = user?.plant || userLocation || '';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Logo and App Name */}
        <div className="flex items-center gap-3">
          {logo || (
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
          )}
          <div>
            <h1 className="font-semibold text-gray-900">{appName}</h1>
            {appSubtitle && (
              <p className="text-xs text-gray-500">{appSubtitle}</p>
            )}
            {syncStatus && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {syncStatus}
              </p>
            )}
          </div>
        </div>

        {/* Center: Top Nav (if provided) */}
        {topNav && (
          <nav className="flex items-center gap-1">
            {topNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  item.active
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* Center/Right: Search */}
        {showSearch && !topNav && (
          <div className="flex-1 max-w-md mx-8">
            <Input
              placeholder={searchPlaceholder}
              icon={<Search className="w-4 h-4" />}
              className="bg-gray-50"
            />
          </div>
        )}

        {/* Right: Actions and Profile */}
        <div className="flex items-center gap-4">
          {showSearch && topNav && (
            <div className="w-64">
              <Input
                placeholder={searchPlaceholder}
                icon={<Search className="w-4 h-4" />}
                className="bg-gray-50"
              />
            </div>
          )}

          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showSettings && (
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{displayRole} {displayLocation && `• ${displayLocation}`}</p>
              </div>
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showDropdown && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                </div>
                <a
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
