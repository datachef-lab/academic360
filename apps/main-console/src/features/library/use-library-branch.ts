import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "library.activeBranchId";

const broadcast = () => {
  window.dispatchEvent(new Event("library:branch-changed"));
};

export function getActiveLibraryBranchId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export function setActiveLibraryBranchId(id: number | null): void {
  if (typeof window === "undefined") return;
  if (id == null) window.localStorage.removeItem(STORAGE_KEY);
  else window.localStorage.setItem(STORAGE_KEY, String(id));
  broadcast();
}

export function useActiveLibraryBranchId(): [number | null, (id: number | null) => void] {
  const [value, setValue] = useState<number | null>(getActiveLibraryBranchId);

  useEffect(() => {
    const onChange = () => setValue(getActiveLibraryBranchId());
    window.addEventListener("library:branch-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("library:branch-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((id: number | null) => {
    setActiveLibraryBranchId(id);
    setValue(id);
  }, []);

  return [value, update];
}
