'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  Cog,
  AlertTriangle,
  FileText,
  Bookmark,
  Building2,
  CheckCircle,
  History,
  ClipboardList,
  Package,
  Zap,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';

type IconName =
  | 'dashboard'
  | 'settings'
  | 'users'
  | 'analytics'
  | 'machines'
  | 'alerts'
  | 'policy'
  | 'bookmark'
  | 'building'
  | 'compliance'
  | 'history'
  | 'logs'
  | 'inventory'
  | 'simulator';

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  settings: Settings,
  users: Users,
  analytics: BarChart3,
  machines: Cog,
  alerts: AlertTriangle,
  policy: FileText,
  bookmark: Bookmark,
  building: Building2,
  compliance: CheckCircle,
  history: History,
  logs: ClipboardList,
  inventory: Package,
  simulator: Zap,
};

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: string | number;
  badgeVariant?: 'default' | 'danger' | 'warning' | 'success';
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarProps {
  sections: NavSection[];
  currentPath: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
}

export default function Sidebar({ sections, currentPath, footer, header }: SidebarProps) {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      {header && (
        <div className="p-4 border-b border-gray-100">
          {header}
        </div>
      )}

      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = currentPath === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || 'default'}
                          size="sm"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {footer && (
        <div className="p-4 border-t border-gray-100">
          {footer}
        </div>
      )}
    </aside>
  );
}
