import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface ScrollingSyncContextType {
  cycleId: number;
  maxDuration: number;
  registerDuration: (id: string, duration: number) => void;
  unregisterDuration: (id: string) => void;
}

const ScrollingSyncContext = createContext<ScrollingSyncContextType>({
  cycleId: 0,
  maxDuration: 7,
  registerDuration: () => {},
  unregisterDuration: () => {}
});

export function ScrollingSyncProvider({ children }: { children: React.ReactNode }) {
  const [cycleId, setCycleId] = useState(0);
  const [durations, setDurations] = useState<Map<string, number>>(new Map());

  const maxDuration = useMemo(() => {
    if (durations.size === 0) return 7; // default minimum
    return Math.max(...Array.from(durations.values()));
  }, [durations]);

  const registerDuration = useCallback((id: string, duration: number) => {
    setDurations(prev => {
      const next = new Map(prev);
      next.set(id, duration);
      return next;
    });
  }, []);

  const unregisterDuration = useCallback((id: string) => {
    setDurations(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycleId(prev => prev + 1);
    }, maxDuration * 1000);

    return () => clearInterval(interval);
  }, [maxDuration]);

  return (
    <ScrollingSyncContext.Provider value={{ cycleId, maxDuration, registerDuration, unregisterDuration }}>
      {children}
    </ScrollingSyncContext.Provider>
  );
}

export function useScrollingSync() {
  return useContext(ScrollingSyncContext);
}
