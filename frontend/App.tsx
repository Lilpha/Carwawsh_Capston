import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './src/navigation/TabNavigator';
import { LoginRedirectProvider } from './src/navigation/LoginRedirectContext';
import { SavedShopsProvider } from './src/navigation/SavedShopsContext';
import type { RootStackParamList } from './src/navigation/types';
import SearchScreen from './src/screens/SearchScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

export type { RootStackParamList };

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <LoginRedirectProvider>
            <SavedShopsProvider>
              <Stack.Navigator initialRouteName="MainTabs">
                {/* 기존: 기본 하단 탭 (지도, 히스토리 등 포함) */}
                <Stack.Screen 
                  name="MainTabs" 
                  component={TabNavigator} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen
                  name="Search"
                  component={SearchScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            </SavedShopsProvider>
          </LoginRedirectProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});