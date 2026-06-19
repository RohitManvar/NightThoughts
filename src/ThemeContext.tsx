import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, lightColors, darkColors } from './theme';
import { getSetting, setSetting } from './database/db';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeValue {
  /** The user's choice, including 'system'. */
  mode: ThemeMode;
  /** Whether the resolved palette is dark (use for StatusBar etc.). */
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue>({
  mode: 'system',
  isDark: false,
  colors: lightColors,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const systemScheme = useColorScheme();

  useEffect(() => {
    getSetting('themeMode')
      .then(saved => {
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setModeState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const isDark =
    mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setMode: (m: ThemeMode) => {
        setModeState(m);
        setSetting('themeMode', m).catch(() => {});
      },
    }),
    [mode, isDark],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
