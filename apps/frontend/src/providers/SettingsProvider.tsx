import React, { useState, ReactNode, createContext, useContext, useEffect } from "react";
import { Settings } from "@/types/settings.type";
import { findAllSettings } from "@/services/settings.service";

export interface SettingsContextType {
  settings: Settings[];
  fetchSettings: () => Promise<void>;
  setSettings: (settings: Settings[]) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within an SettingsProvider");
  }
  return context;
};

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
