import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CustomModalProvider } from '@/components/ui/custom-modal';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'LearnHub — Интерактивная образовательная платформа',
  description:
    'Создавайте и проходите интерактивные онлайн-курсы, квизы и микро-уроки. Платформа для обучения с конструктором курсов, аналитикой прогресса и геймификацией.',
  keywords: [
    'онлайн-курсы',
    'образование',
    'квизы',
    'интерактивное обучение',
    'LearnHub',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LearnHub',
  },
};

export const viewport = {
  themeColor: '#1b262c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <head>
      </head>
      <body className="min-h-screen antialiased">
        <CustomModalProvider>
          {children}
        </CustomModalProvider>
      </body>
    </html>
  );
}

