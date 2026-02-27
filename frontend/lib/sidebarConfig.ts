// Shared sidebar navigation for Local Admin pages
export const localAdminSidebar = [
  {
    items: [
      { label: 'Overview',      href: '/overview',      icon: 'dashboard'  as const },
      { label: 'Machines',      href: '/machines',      icon: 'machines'   as const },
      { label: 'Downtime',      href: '/downtime',      icon: 'alerts'     as const },
      { label: 'Simulator',     href: '/simulator',     icon: 'simulator'  as const },
      { label: 'Policy Support',href: '/policy-support',icon: 'policy'     as const },
      { label: 'Staff',         href: '/staff',         icon: 'users'      as const },
      { label: 'Analytics',     href: '/analytics',     icon: 'analytics'  as const },
      { label: 'Settings',      href: '/settings',      icon: 'settings'   as const },
    ],
  },
];

// Shared sidebar navigation for Super Admin pages
export const superAdminSidebar = [
  {
    items: [
      { label: 'Companies', href: '/admin',    icon: 'dashboard' as const },
      { label: 'Settings',  href: '/settings', icon: 'settings'  as const },
    ],
  },
];
