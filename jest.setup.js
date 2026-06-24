/* eslint-env jest */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn((_options, callback) => callback?.({ didCancel: true })),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const native = require('@react-navigation/native');

  return {
    createNativeStackNavigator: native.createNativeStackNavigator,
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const native = require('@react-navigation/native');

  return {
    createBottomTabNavigator: native.createBottomTabNavigator,
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialCommunityIcons: ({ name }) => React.createElement(Text, null, String(name ?? 'icon')),
  };
});

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(async () => []),
}));

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 0,
      longitude: 0,
      accuracy: 10,
    },
    timestamp: 0,
  })),
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');

  const passthrough = (name) => ({ children, ...props }) => React.createElement(View, { ...props, accessibilityLabel: name }, children);

  return {
    default: View,
    Svg: passthrough('Svg'),
    Path: passthrough('Path'),
    Circle: passthrough('Circle'),
  };
});

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  const createNavigatorMock = () => {
    const Screen = () => null;

    const Navigator = ({ children }) => {
      const screenElements = React.Children.toArray(children).filter(React.isValidElement);
      const [currentRouteName, setCurrentRouteName] = React.useState(
        screenElements[0]?.props?.name,
      );
      const routeMap = React.useMemo(
        () => new Map(screenElements.map((element) => [element.props.name, element])),
        [screenElements],
      );
      const historyRef = React.useRef([currentRouteName]);

      React.useEffect(() => {
        if (currentRouteName && historyRef.current[historyRef.current.length - 1] !== currentRouteName) {
          historyRef.current = [...historyRef.current, currentRouteName];
        }
      }, [currentRouteName]);

      const navigation = React.useMemo(
        () => ({
          navigate: (routeName) => {
            if (!routeMap.has(routeName)) {
              return;
            }

            historyRef.current = [...historyRef.current, routeName];
            setCurrentRouteName(routeName);
          },
          goBack: () => {
            if (historyRef.current.length <= 1) {
              return;
            }

            historyRef.current = historyRef.current.slice(0, -1);
            setCurrentRouteName(historyRef.current[historyRef.current.length - 1]);
          },
          getParent: () => null,
          addListener: () => ({ remove: () => undefined }),
          setOptions: () => undefined,
        }),
        [routeMap],
      );

      const activeScreen = routeMap.get(currentRouteName) || screenElements[0];
      const ActiveComponent = activeScreen?.props?.component;

      if (!ActiveComponent) {
        return null;
      }

      return React.createElement(ActiveComponent, {
        navigation,
        route: { name: currentRouteName, params: activeScreen?.props?.initialParams ?? {} },
      });
    };

    return { Navigator, Screen };
  };

  return {
    NavigationContainer: ({ children }) => React.createElement(React.Fragment, null, children),
    useFocusEffect: (callback) => {
      React.useEffect(() => callback(), [callback]);
    },
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), getParent: () => null }),
    createStaticNavigation: jest.fn(),
    createNavigationContainerRef: jest.fn(),
    createNativeStackNavigator: createNavigatorMock,
    createBottomTabNavigator: createNavigatorMock,
  };
});
