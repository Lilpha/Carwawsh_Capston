import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './src/navigation/TabNavigator';
import type { RootStackParamList } from './src/navigation/types';
import ListScreen from './src/screens/ListScreen';
import SearchScreen from './src/screens/SearchScreen';

export type { RootStackParamList };

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs">
        {/* 기존: 기본 하단 탭 (지도, 히스토리 등 포함) */}
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        {/* 신규: 탭에서 버튼을 누르면 위로 덮어씌워질 전체 화면 스택 */}
        <Stack.Screen 
          name="List" 
          component={ListScreen} 
          options={{ 
            headerShown: true, // 뒤로가기 버튼을 위해 헤더 표시
            title: '세차장 목록', 
            // modal 효과를 주고 싶다면 (IOS에서 위에서 아래로 올라옴):
            // presentation: 'modal' 
          }} 
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}