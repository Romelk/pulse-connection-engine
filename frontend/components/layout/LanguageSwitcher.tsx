'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Locale } from '@/lib/i18n/translations';

const LANGUAGES: { code: Locale; short: string; full: string }[] = [
  { code: 'en', short: 'EN', full: 'English' },
  { code: 'hi', short: 'हि', full: 'हिन्दी' },
  { code: 'ta', short: 'த',  full: 'தமிழ்' },
  { code: 'mr', short: 'म',  full: 'मराठी' },
  { code: 'bn', short: 'ব',  full: 'বাংলা' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5 bg-gray-50">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          title={lang.full}
          aria-label={`Switch to ${lang.full}`}
          aria-pressed={locale === lang.code}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
            locale === lang.code
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {lang.short}
        </button>
      ))}
    </div>
  );
}
