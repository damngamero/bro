import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/app-provider';

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
