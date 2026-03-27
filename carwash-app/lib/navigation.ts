import { Alert, Linking, Platform } from 'react-native';

export type NavigationDestination = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type NavApp = {
  label: string;
  buildUrl: (d: NavigationDestination) => string;
};

const NAV_APPS: NavApp[] = [
  {
    label: '카카오맵',
    buildUrl: (d) =>
      `kakaomap://route?ep=${d.latitude},${d.longitude}&by=CAR&epname=${encodeURIComponent(d.name)}`,
  },
  {
    label: '티맵',
    buildUrl: (d) =>
      `tmap://route?goalx=${d.longitude}&goaly=${d.latitude}&goalname=${encodeURIComponent(d.name)}`,
  },
  {
    label: '네이버지도',
    buildUrl: (d) =>
      `nmap://route/car?dlat=${d.latitude}&dlng=${d.longitude}&dname=${encodeURIComponent(d.name)}`,
  },
];

function buildWebFallbackUrl(d: NavigationDestination) {
  return `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`;
}

async function openNavigationApp(app: NavApp, destination: NavigationDestination) {
  const appUrl = app.buildUrl(destination);
  const canOpen = await Linking.canOpenURL(appUrl);

  if (canOpen) {
    await Linking.openURL(appUrl);
    return;
  }

  Alert.alert(
    `${app.label} 미설치`,
    `${app.label} 앱을 찾지 못했습니다. 웹 지도로 이동할까요?`,
    [
      { text: '취소', style: 'cancel' },
      {
        text: '웹 지도로 이동',
        onPress: async () => {
          await Linking.openURL(buildWebFallbackUrl(destination));
        },
      },
    ]
  );
}

export function openNavigationSelector(destination: NavigationDestination) {
  const openKakao = () => openNavigationApp(NAV_APPS[0], destination);
  const openTmap = () => openNavigationApp(NAV_APPS[1], destination);
  const openNaver = () => openNavigationApp(NAV_APPS[2], destination);

  if (Platform.OS === 'ios') {
    Alert.alert('길찾기 앱 선택', '원하는 내비게이션 앱을 선택해주세요.', [
      { text: '카카오맵', onPress: openKakao },
      { text: '티맵', onPress: openTmap },
      { text: '네이버지도', onPress: openNaver },
      { text: '취소', style: 'cancel' },
    ]);
    return;
  }

  Alert.alert('길찾기 앱 선택', '원하는 내비게이션 앱을 선택해주세요.', [
    { text: '카카오맵', onPress: openKakao },
    { text: '티맵', onPress: openTmap },
    { text: '네이버지도', onPress: openNaver },
    { text: '취소', style: 'cancel' },
  ]);
}

