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
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? "light");

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

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setColorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
