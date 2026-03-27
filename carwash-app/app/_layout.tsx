import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="search"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="vehicles" />
      <Stack.Screen name="vehicle-edit" />
      <Stack.Screen
        name="carwash-detail"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="carwash-info" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}