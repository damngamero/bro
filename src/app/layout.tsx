import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/app-provider';
import '@/lib/i18n';

export const metadata: Metadata = {
  title: 'RecipeSavvy',
  description: 'Generate recipes from ingredients you have on hand.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
