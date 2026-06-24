import React, { useCallback, useMemo } from 'react';
import { BackHandler, Pressable, StyleSheet, Text } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, useFocusEffect, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../context/AccessibilityContext';
import { useEmergencyProfile } from '../context/EmergencyProfileContext';
import { useUser } from '../context/UserContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import {
  AccessibilityNeedsScreen,
  AccessibilityPreferencesScreen,
  AccessibilityWelcomeScreen,
} from '../screens/onboarding/AccessibilityOnboardingScreens';
import { HomeScreen } from '../screens/HomeScreen';
import { EmergencyProfileSetupScreen } from '../screens/emergency/EmergencyProfileSetupScreen';
import { TestScreen } from '../screens/TestScreen';
import { RestaurantDetail } from '../screens/RestaurantDetail';
import { SOSScreen } from '../screens/emergency/SOSScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { addBooking } from '../services/bookingsStore';
import { SuccessScreen } from '../screens/SuccessScreen';
import { NotepadScreen } from '../screens/NotepadScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { Restaurant } from '../types/Restaurant';
import { Booking } from '../types/Booking';
import { AppTheme, useTheme } from '../theme';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type AccessibilityOnboardingStackParamList = {
  Welcome: undefined;
  Needs: undefined;
  Preferences: undefined;
};

type HomeStackParamList = {
  Home: undefined;
};

type RestaurantsStackParamList = {
  Restaurants: undefined;
  RestaurantDetail: { restaurant: Restaurant };
  Booking: { restaurant: Restaurant };
  Success: { booking: Booking };
};

type SimpleStackParamList = {
  Screen: undefined;
};

type AppNavigatorProps = {
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AccessibilityOnboardingStack = createNativeStackNavigator<AccessibilityOnboardingStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const RestaurantsStack = createNativeStackNavigator<RestaurantsStackParamList>();
const SOSStack = createNativeStackNavigator<SimpleStackParamList>();
const NotesStack = createNativeStackNavigator<SimpleStackParamList>();
const ProfileStack = createNativeStackNavigator<SimpleStackParamList>();
const BookingsStack = createNativeStackNavigator<SimpleStackParamList>();
const Tabs = createBottomTabNavigator();

const createScreenOptions = (theme: AppTheme) => ({
  headerStyle: {
    backgroundColor: theme.colors.surface,
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: theme.colors.text,
  },
  headerTintColor: theme.colors.primary,
  headerBackTitleVisible: false,
  contentStyle: {
    backgroundColor: theme.colors.background,
  },
});

function HomeHeaderBackButton() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      onPress={() => navigation.getParent()?.navigate('Home')}
      accessibilityRole="button"
      accessibilityLabel="Back to home"
      hitSlop={12}
      style={styles.headerBackButton}
    >
      <Text style={styles.headerBackText}>Back</Text>
    </Pressable>
  );
}

function useAndroidBackToHome(navigation: { getParent?: () => { navigate: (routeName: string) => void } | undefined }) {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.getParent?.()?.navigate('Home');
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation]),
  );
}

function HomeTabScreen({ navigation }: { navigation: any }) {
  const { isProfileComplete } = useEmergencyProfile();
  const { signOut } = useUser();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <HomeScreen
      profileReady={isProfileComplete()}
      onOpenRestaurants={() => navigation.navigate('Restaurants')}
      onOpenProfile={() => navigation.navigate('Profile')}
      onOpenSOS={() => navigation.navigate('SOS')}
      onOpenNotepad={() => navigation.navigate('Notes')}
      onLogout={handleLogout}
    />
  );
}

function RestaurantsListScreen({ navigation }: { navigation: any }) {
  return (
    <TestScreen
      onRestaurantPress={(restaurant) => navigation.navigate('RestaurantDetail', { restaurant })}
    />
  );
}

function RestaurantDetailScreen({ route, navigation }: { route: { params: { restaurant: Restaurant } }; navigation: any }) {
  const { restaurant } = route.params;

  return (
    <RestaurantDetail
      restaurant={restaurant}
      onBookTable={(nextRestaurant) => navigation.navigate('Booking', { restaurant: nextRestaurant })}
    />
  );
}

function BookingRouteScreen({ route, navigation }: { route: { params: { restaurant: Restaurant } }; navigation: any }) {
  const { restaurant } = route.params;

  return (
    <BookingScreen
      restaurant={restaurant}
      onConfirmBooking={async (booking) => {
        // persist booking locally and navigate to success
        try {
          const saved = await addBooking(booking);
          console.log('[AppNavigator] booking saved', saved?.id);
          navigation.navigate('Success', { booking: saved });
        } catch {
          navigation.navigate('Success', { booking });
        }
      }}
    />
  );
}

function SuccessRouteScreen({ route, navigation }: { route: { params: { booking: Booking } }; navigation: any }) {
  return <SuccessScreen booking={route.params.booking} onDone={() => navigation.getParent()?.navigate('Home')} />;
}

function SOSTabScreen({ navigation }: { navigation: any }) {
  useAndroidBackToHome(navigation);

  return <SOSScreen />;
}

function NotesTabScreen({ navigation }: { navigation: any }) {
  useAndroidBackToHome(navigation);

  return <NotepadScreen />;
}

function ProfileTabScreen({ navigation }: { navigation: any }) {
  useAndroidBackToHome(navigation);

  return <EmergencyProfileSetupScreen onDone={() => navigation.navigate('Home')} />;
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { minTouchTarget, preferences, speak, textScale } = useAccessibility();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: theme.isHighContrast ? 2 : 1,
          height: (preferences.oneHandedNavigation ? 76 : 64) + insets.bottom,
          paddingBottom: (preferences.oneHandedNavigation ? 16 : 8) + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12 * textScale,
          fontWeight: '700',
        },
        tabBarItemStyle: {
          minHeight: minTouchTarget,
        },
        tabBarAccessibilityLabel: `${route.name === 'Bookings' ? 'My Bookings' : route.name} tab`,
        tabBarButtonTestID: `${route.name.toLowerCase()}-tab`,
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, string> = {
            Home: 'home-outline',
            Restaurants: 'silverware-fork-knife',
            Bookings: 'calendar-check-outline',
            SOS: 'alert-circle-outline',
            Notes: 'notebook-outline',
            Profile: 'account-circle-outline',
          };

          return (
            <MaterialCommunityIcons
              name={icons[route.name] as never}
              color={focused ? theme.colors.primary : color}
              size={size}
            />
          );
        },
      })}
      screenListeners={({ route }) => ({
        tabPress: () => {
          if (preferences.autoReadScreens) {
            const tabName = route.name === 'Bookings' ? 'My Bookings' : route.name;
            speak(`${tabName} tab selected.`, {
              key: `tab:${route.name}`,
              minRepeatMs: 2000,
            }).catch(() => undefined);
          }
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeStackScreen} />
      <Tabs.Screen name="Restaurants" component={RestaurantsStackScreen} />
      <Tabs.Screen name="Bookings" component={BookingsStackScreen} options={{ title: 'My Bookings' }} />
      <Tabs.Screen name="SOS" component={SOSStackScreen} />
      <Tabs.Screen name="Notes" component={NotesStackScreen} />
      <Tabs.Screen name="Profile" component={ProfileStackScreen} />
    </Tabs.Navigator>
  );
}

function AccessibilityOnboardingNavigator() {
  const { theme } = useTheme();

  return (
    <AccessibilityOnboardingStack.Navigator screenOptions={{ ...createScreenOptions(theme), headerShown: false }}>
      <AccessibilityOnboardingStack.Screen name="Welcome" component={AccessibilityWelcomeScreen} />
      <AccessibilityOnboardingStack.Screen name="Needs" component={AccessibilityNeedsScreen} />
      <AccessibilityOnboardingStack.Screen name="Preferences" component={AccessibilityPreferencesScreen} />
    </AccessibilityOnboardingStack.Navigator>
  );
}

function BookingsStackScreen() {
  const { theme } = useTheme();

  return (
    <BookingsStack.Navigator screenOptions={createScreenOptions(theme)}>
      <BookingsStack.Screen
        name="Screen"
        component={MyBookingsScreen}
        options={{ title: 'My Bookings', headerLeft: () => <HomeHeaderBackButton /> }}
      />
    </BookingsStack.Navigator>
  );
}

function HomeStackScreen() {
  const { theme } = useTheme();

  return (
    <HomeStack.Navigator screenOptions={createScreenOptions(theme)}>
      <HomeStack.Screen name="Home" component={HomeTabScreen} options={{ title: 'Home' }} />
    </HomeStack.Navigator>
  );
}

function RestaurantsStackScreen() {
  const { theme } = useTheme();

  return (
    <RestaurantsStack.Navigator screenOptions={createScreenOptions(theme)}>
      <RestaurantsStack.Screen name="Restaurants" component={RestaurantsListScreen} options={{ title: 'Restaurants' }} />
      <RestaurantsStack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: 'Restaurant details' }} />
      <RestaurantsStack.Screen name="Booking" component={BookingRouteScreen} options={{ title: 'Reservation' }} />
      <RestaurantsStack.Screen name="Success" component={SuccessRouteScreen} options={{ title: 'Booking confirmed', headerLeft: () => null }} />
    </RestaurantsStack.Navigator>
  );
}

function SOSStackScreen() {
  const { theme } = useTheme();

  return (
    <SOSStack.Navigator screenOptions={createScreenOptions(theme)}>
      <SOSStack.Screen
        name="Screen"
        component={SOSTabScreen}
        options={{
          title: 'SOS',
          headerLeft: () => <HomeHeaderBackButton />,
        }}
      />
    </SOSStack.Navigator>
  );
}

function NotesStackScreen() {
  const { theme } = useTheme();

  return (
    <NotesStack.Navigator screenOptions={createScreenOptions(theme)}>
      <NotesStack.Screen
        name="Screen"
        component={NotesTabScreen}
        options={{
          title: 'Notes',
          headerLeft: () => <HomeHeaderBackButton />,
        }}
      />
    </NotesStack.Navigator>
  );
}

function ProfileStackScreen() {
  const { theme } = useTheme();

  return (
    <ProfileStack.Navigator screenOptions={createScreenOptions(theme)}>
      <ProfileStack.Screen
        name="Screen"
        component={ProfileTabScreen}
        options={{
          title: 'Profile',
          headerLeft: () => <HomeHeaderBackButton />,
        }}
      />
    </ProfileStack.Navigator>
  );
}

function AuthNavigator() {
  const { theme } = useTheme();

  return (
    <AuthStack.Navigator screenOptions={createScreenOptions(theme)}>
      <AuthStack.Screen name="Login" component={LoginRoute} options={{ title: 'Sign in' }} />
      <AuthStack.Screen name="Signup" component={SignupRoute} options={{ title: 'Create account' }} />
    </AuthStack.Navigator>
  );
}

export function AppNavigator(_: AppNavigatorProps) {
  const { isSignedIn } = useUser();
  const { onboardingComplete } = useAccessibility();
  const { theme } = useTheme();
  const navigationTheme = useMemo(
    () => {
      const baseTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

      return {
        ...baseTheme,
        dark: theme.mode === 'dark',
        colors: {
        ...(baseTheme?.colors ?? {}),
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
      };
    },
    [theme],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      {!onboardingComplete ? <AccessibilityOnboardingNavigator /> : isSignedIn ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

function LoginRoute({ navigation }: { navigation: any }) {
  const { signIn } = useUser();

  return (
    <LoginScreen
      onLogin={signIn}
      onLoginSuccess={() => undefined}
      onGoToSignup={() => navigation.navigate('Signup')}
    />
  );
}

function SignupRoute({ navigation }: { navigation: any }) {
  const { signUp } = useUser();

  return (
    <SignupScreen
      onSignup={signUp}
      onSignupSuccess={() => undefined}
      onGoToLogin={() => navigation.navigate('Login')}
    />
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  headerActionText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  headerBackButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerBackText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
});
