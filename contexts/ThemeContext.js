import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const deviceTheme = useColorScheme();
  const [theme, setTheme] = useState(deviceTheme || 'light');

  useEffect(() => {
    if (deviceTheme) {
      setTheme(deviceTheme);
    }
  }, [deviceTheme]);

  function toggleTheme() {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  }

  const value = {
    theme,
    isDarkMode: theme === 'dark',
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
} 