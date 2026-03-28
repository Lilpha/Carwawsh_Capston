import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'light';
  const themeColors = Colors[scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5a58e9',
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarStyle: {
          borderTopColor: scheme === 'dark' ? '#1f2937' : '#e2e8f0',
          backgroundColor: themeColors.background,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '지도',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '기록',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="history" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: '저장',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="favorite" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

