import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import type { MainTabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          if (route.name === 'Map') iconName = 'map';
          else if (route.name === 'Saved') iconName = 'bookmark';
          else if (route.name === 'Profile') iconName = 'person';
          
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5a58e9',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // 탭 화면들의 상단 헤더 숨김
      })}
    >
      <Tab.Screen name="Map" component={HomeScreen} options={{ tabBarLabel: '지도' }} />
      <Tab.Screen name="Saved" component={SavedScreen} options={{ tabBarLabel: '저장' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '프로필' }} />
    </Tab.Navigator>
  );
}
