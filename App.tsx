import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EmergencyProfileProvider, useEmergencyProfile } from './src/context/EmergencyProfileContext';
import { UserProvider, useUser } from './src/context/UserContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <EmergencyProfileProvider>
            <AppContent />
          </EmergencyProfileProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isLoading: profileLoading } = useEmergencyProfile();
  const { isLoading: authLoading } = useUser();
  const { isLoading: themeLoading } = useTheme();

  return <AppNavigator loading={authLoading || profileLoading || themeLoading} />;
}

export default App;
