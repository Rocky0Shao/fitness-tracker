'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PrivacyContextType {
  blurEnabled: boolean;
  toggleBlur: () => void;
  setBlurEnabled: (enabled: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | null>(null);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [blurEnabled, setBlurEnabled] = useState(false);

  const toggleBlur = useCallback(() => {
    setBlurEnabled((prev) => !prev);
  }, []);

  return (
    <PrivacyContext.Provider value={{ blurEnabled, toggleBlur, setBlurEnabled }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
