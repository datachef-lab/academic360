"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface FeeSocketContextType {
  feeMappingsVersion: number;
  cpFormVersion: number;
  invalidateFeeMappings: () => void;
  invalidateCpForm: () => void;
}

const FeeSocketContext = createContext<FeeSocketContextType>({
  feeMappingsVersion: 0,
  cpFormVersion: 0,
  invalidateFeeMappings: () => {},
  invalidateCpForm: () => {},
});

export const useFeeSocket = () => useContext(FeeSocketContext);

export function FeeSocketProvider({ children }: { children: React.ReactNode }) {
  const [feeMappingsVersion, setFeeMappingsVersion] = useState(0);
  const [cpFormVersion, setCpFormVersion] = useState(0);

  const invalidateFeeMappings = useCallback(() => setFeeMappingsVersion((v) => v + 1), []);

  const invalidateCpForm = useCallback(() => setCpFormVersion((v) => v + 1), []);

  const value = useMemo(
    () => ({
      feeMappingsVersion,
      cpFormVersion,
      invalidateFeeMappings,
      invalidateCpForm,
    }),
    [feeMappingsVersion, cpFormVersion, invalidateFeeMappings, invalidateCpForm],
  );

  return <FeeSocketContext.Provider value={value}>{children}</FeeSocketContext.Provider>;
}
