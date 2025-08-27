import React, { useState, ReactNode, createContext, useEffect } from "react";
import { Settings } from "@/features/settings/types/settings.type";
import { findAllSettings } from "@/features/settings/services/settings-service";

export interface SettingsContextType {
  settings: Settings[];
  fetchSettings: () => Promise<void>;
  setSettings: (settings: Settings[]) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings[]>([]);

  const fetchSettings = async () => {
    findAllSettings()
      .then((data) => setSettings(data.payload))
      .catch((err) => console.log("Error fetching settings...", err));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const contextValue: SettingsContextType = {
    settings,
    fetchSettings,
    setSettings: (givenSettings) => setSettings(givenSettings),
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {/* {JSON.stringify(settings)} */}
      {settings.length > 0 && children}
    </SettingsContext.Provider>
  );
};
