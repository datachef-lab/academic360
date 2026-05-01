import { createContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const isTheme = (value: string): value is Theme =>
  value === "light" || value === "dark" || value === "system";

const normalizeTheme = (value: string | null, fallback: Theme): Theme => {
  const cleaned = value?.trim();
  return cleaned && isTheme(cleaned) ? cleaned : fallback;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() =>
    normalizeTheme(localStorage.getItem(storageKey), defaultTheme),
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      const normalizedTheme = normalizeTheme(theme, defaultTheme);
      localStorage.setItem(storageKey, normalizedTheme);
      setTheme(normalizedTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
