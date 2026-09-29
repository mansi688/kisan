import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext.js';
import { colors } from '../theme.js';

import LoginScreen from '../screens/LoginScreen.js';
import RegisterScreen from '../screens/RegisterScreen.js';
import DashboardScreen from '../screens/DashboardScreen.js';
import WarehouseScreen from '../screens/WarehouseScreen.js';
import FinancingScreen from '../screens/FinancingScreen.js';
import AuctionScreen from '../screens/AuctionScreen.js';
import SettlementsScreen from '../screens/SettlementsScreen.js';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: 'home-variant',
  Warehouse: 'warehouse',
  Financing: 'cash-multiple',
  Auction: 'gavel',
  Settlements: 'receipt-text'
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.ink },
        headerTitleStyle: { color: colors.paper },
        tabBarActiveTintColor: colors.wheatDark,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: colors.paperRaised, borderTopColor: colors.line },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={TAB_ICONS[route.name]} color={color} size={size} />
        )
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Warehouse" component={WarehouseScreen} />
      <Tab.Screen name="Financing" component={FinancingScreen} />
      <Tab.Screen name="Auction" component={AuctionScreen} />
      <Tab.Screen name="Settlements" component={SettlementsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
