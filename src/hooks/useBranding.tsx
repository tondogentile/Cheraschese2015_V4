import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Branding = {
  teamName: string;
  subtitle: string;
  season: string;
  mascot: string;
  logoPath: string;
};

export const DEFAULT_BRANDING: Branding = {
  teamName: 'Cheraschese 2015',
  subtitle: 'Esordienti',
  season: '2025/26',
  mascot: 'Lupo',
  logoPath: '/LogoCheraschese.png',
};

const STORAGE_KEY = 'cheraschese-branding';

function getStoredBranding(): Branding {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_BRANDING, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_BRANDING;
}

type BrandingContextValue = {
  branding: Branding;
  setBranding: (b: Partial<Branding>) => void;
  resetBranding: () => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBrandingState] = useState<Branding>(getStoredBranding);

  const setBranding = useCallback((b: Partial<Branding>) => {
    setBrandingState((prev) => {
      const next = { ...prev, ...b };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const resetBranding = useCallback(() => {
    setBrandingState(DEFAULT_BRANDING);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRANDING)); } catch { /* ignore */ }
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, setBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}
