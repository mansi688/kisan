import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold
} from '@expo-google-fonts/manrope';
import { AuthProvider } from './src/AuthContext.js';
import AppNavigator from './src/navigation/AppNavigator.js';
import { colors } from './src/theme.js';

// Keep the native splash screen up until Manrope is actually loaded, rather
// than flashing the system font for a frame — matches the web app's
// @import-before-paint behavior with the same font.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; // splash screen stays up
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.paper }} onLayout={onLayoutRootView}>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
