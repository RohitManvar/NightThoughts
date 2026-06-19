import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/db';
import { ThemeProvider, useTheme } from './src/ThemeContext';

function Root() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    initDatabase().catch(e =>
      console.warn('[NightThoughts] DB init failed:', e),
    );
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
