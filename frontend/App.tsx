import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './src/navigation/TabNavigator';
import ListScreen from './src/screens/ListScreen';
import { LogBox } from 'react-native';

// 모든 경고창 숨기기 (개발 편의상 유지)
LogBox.ignoreAllLogs();

// 스택 네비게이션에서 사용할 화면들의 타입 정의
export type RootStackParamList = {
  MainTabs: undefined;
  List: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs">
        {/* 하단 탭 네비게이션 (홈/지도, 히스토리 등 포함) */}
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        {/* 전체 화면으로 띄울 리스트 스크린 */}
        <Stack.Screen 
          name="List" 
          component={ListScreen} 
          options={{ 
            headerShown: true, 
            title: '세차장 목록',
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}