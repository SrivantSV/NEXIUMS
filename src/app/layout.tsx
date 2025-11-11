import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nexus AI - Advanced AI Model Integration',
  description: 'Complete AI model integration and smart routing system supporting 25+ AI models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
