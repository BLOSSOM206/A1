import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccessibilityProvider, useAccessibility } from './src/context/AccessibilityContext';
import { EmergencyProfileProvider, useEmergencyProfile } from './src/context/EmergencyProfileContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme';

function App() {
  useEffect(() => {
    console.log('[App] mounted');
  }, []);
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AccessibilityProvider>
          <UserProvider>
            <EmergencyProfileProvider>
              <AppContent />
            </EmergencyProfileProvider>
          </UserProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  useAccessibility();
  useUser();
  useEmergencyProfile();
  useTheme();

  return <AppNavigator />;
}

export default App;
