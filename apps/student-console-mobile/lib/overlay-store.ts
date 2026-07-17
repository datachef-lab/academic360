import { useEffect, useSyncExternalStore } from "react";

/** Tracks how many overlays (sheets/dialogs) are open, so chrome like the bottom
 * tab bar can hide itself while one is up. */
let count = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => count;

/** Number of overlays currently open. */
export function useOverlayCount(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Register an overlay as open while `visible` is true. */
export function useRegisterOverlay(visible: boolean) {
  useEffect(() => {
    if (!visible) return;
    count += 1;
    emit();
    return () => {
      count = Math.max(0, count - 1);
      emit();
    };
  }, [visible]);
}
