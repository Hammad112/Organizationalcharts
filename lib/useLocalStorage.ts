import { useEffect, useState } from "react";

// Small "storage in variables" layer: state lives in memory and mirrors
// out to localStorage. No server, no database — every browser keeps its
// own copy, seeded from lib/data.ts on first load.
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore malformed storage, fall back to initialValue
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable — fail silently, state still works in-session
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
