import { createContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { Colors } from "../constants/Colors";

type ThemeContextType = {
  theme: typeof Colors.light;
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() ?? "light",
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme ?? "light");
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    setColorScheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  // Cast sidesteps the monorepo dual @types/react (18 web / 19 mobile) JSX mismatch.
  const Provider = ThemeContext.Provider as unknown as React.FC<{
    value: ThemeContextType;
    children?: React.ReactNode;
  }>;

  return (
    <Provider value={{ theme, colorScheme, setColorScheme, toggleTheme }}>{children}</Provider>
  );
};
