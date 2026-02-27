import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpsAssistant AI - SME Manufacturing Operations',
  description: 'AI-Powered Operations Assistant for SME Manufacturing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
