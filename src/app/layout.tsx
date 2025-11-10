import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nexus AI - Premium AI Aggregator Platform',
  description:
    'Access the world\'s leading AI models in one unified platform with advanced authentication and user management.',
  keywords: ['AI', 'Artificial Intelligence', 'API', 'Platform', 'Authentication'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
