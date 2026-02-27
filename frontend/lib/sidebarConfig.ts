import type { TranslationKey } from './i18n/translations';

type TFunc = (key: TranslationKey) => string;

// Factory function — call with t() from useLanguage() to get translated sidebar
export function getLocalAdminSidebar(t: TFunc) {
  return [
    {
      items: [
        { label: t('nav.overview'),      href: '/overview',       icon: 'dashboard'  as const },
        { label: t('nav.machines'),      href: '/machines',       icon: 'machines'   as const },
        { label: t('nav.downtime'),      href: '/downtime',       icon: 'alerts'     as const },
        { label: t('nav.simulator'),     href: '/simulator',      icon: 'simulator'  as const },
        { label: t('nav.policySupport'), href: '/policy-support', icon: 'policy'     as const },
        { label: t('nav.staff'),         href: '/staff',          icon: 'users'      as const },
        { label: t('nav.analytics'),     href: '/analytics',      icon: 'analytics'  as const },
        { label: t('nav.settings'),      href: '/settings',       icon: 'settings'   as const },
      ],
    },
  ];
}

export function getSuperAdminSidebar(t: TFunc) {
  return [
    {
      items: [
        { label: t('nav.companies'), href: '/admin',    icon: 'dashboard' as const },
        { label: t('nav.settings'),  href: '/settings', icon: 'settings'  as const },
      ],
    },
  ];
}

// Legacy static exports for backward compatibility during migration
export const localAdminSidebar = getLocalAdminSidebar((key) => {
  const fallbacks: Partial<Record<TranslationKey, string>> = {
    'nav.overview': 'Overview', 'nav.machines': 'Machines', 'nav.downtime': 'Downtime',
    'nav.simulator': 'Simulator', 'nav.policySupport': 'Policy Support', 'nav.staff': 'Staff',
    'nav.analytics': 'Analytics', 'nav.settings': 'Settings',
  };
  return fallbacks[key] ?? key;
});

export const superAdminSidebar = getSuperAdminSidebar((key) => {
  const fallbacks: Partial<Record<TranslationKey, string>> = {
    'nav.companies': 'Companies', 'nav.settings': 'Settings',
  };
  return fallbacks[key] ?? key;
});
