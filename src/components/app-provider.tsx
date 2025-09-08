"use client"

import { useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { useTranslation } from './translation-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { language, isRtl } = useTranslation();

  useEffect(() => {
      document.documentElement.lang = language;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language, isRtl]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
