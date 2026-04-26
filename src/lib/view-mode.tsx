import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type ViewMode = 'mobile' | 'desktop';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isMobile: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const saved = localStorage.getItem('unmapped-view-mode');
    if (saved === 'mobile' || saved === 'desktop') return saved;
    return window.innerWidth < 768 ? 'mobile' : 'desktop';
  });

  useEffect(() => {
    localStorage.setItem('unmapped-view-mode', viewMode);
  }, [viewMode]);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, isMobile: viewMode === 'mobile' }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be inside ViewModeProvider');
  return ctx;
}
