import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

// REVERSÃO: As cores foram trazidas de volta para dentro deste ficheiro
// para remover a importação que estava a causar o erro.
const lightColors = {
  background: "#F3F4F6",
  card: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  primary: "#4F46E5",
};

const darkColors = {
  background: "#111827",
  card: "#1F2937",
  text: "#F9FAFB",
  textSecondary: "#9CA3AF",
  border: "#374151",
  primary: "#6366F1",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const theme = {
    isDarkMode,
    colors: isDarkMode ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
}
