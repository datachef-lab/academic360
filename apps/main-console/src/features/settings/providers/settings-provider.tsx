import React, { ReactNode, createContext, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "@/features/settings/types/settings.type";
import { findAllSettings } from "@/features/settings/services/settings-service";
import { BRANDING_QUERY_KEY, SETTINGS_QUERY_KEY } from "@/features/settings/constants/query-keys";

export { SETTINGS_QUERY_KEY } from "@/features/settings/constants/query-keys";

const SETTINGS_STALE_TIME_MS = 30 * 60 * 1000;

export interface SettingsContextType {
  settings: Settings[];
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  setSettings: (settings: Settings[]) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const data = await findAllSettings();
      return data.payload;
    },
    staleTime: SETTINGS_STALE_TIME_MS,
    cacheTime: 60 * 60 * 1000,
  });

  const fetchSettings = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: BRANDING_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const handleSetSettings = useCallback(
    (givenSettings: Settings[]) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, givenSettings);
    },
    [queryClient],
  );

  const contextValue: SettingsContextType = useMemo(
    () => ({
      settings,
      isLoading,
      fetchSettings,
      setSettings: handleSetSettings,
    }),
    [settings, isLoading, fetchSettings, handleSetSettings],
  );

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
};
