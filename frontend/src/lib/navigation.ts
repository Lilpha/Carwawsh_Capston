import { Alert, Linking, Platform } from 'react-native';

import type { RoutePlan } from './route-plan';
import { canNavigate } from './route-plan';

/** keyword_Navigate / nmap-test.html 과 동일한 3점 경로 딥링크 */

function buildNaverRouteUrl(plan: RoutePlan): string {
  const { origin, waypoint, destination } = plan;
  if (!origin || !destination) return '';

  const enc = encodeURIComponent;
  if (waypoint) {
    return (
      `nmap://route/car?slat=${origin.latitude}&slng=${origin.longitude}&sname=${enc(origin.name)}` +
      `&v1lat=${waypoint.latitude}&v1lng=${waypoint.longitude}&v1name=${enc(waypoint.name)}` +
      `&dlat=${destination.latitude}&dlng=${destination.longitude}&dname=${enc(destination.name)}` +
      `&appname=capstone-project`
    );
  }
  return (
    `nmap://route/car?slat=${origin.latitude}&slng=${origin.longitude}&sname=${enc(origin.name)}` +
    `&dlat=${destination.latitude}&dlng=${destination.longitude}&dname=${enc(destination.name)}` +
    `&appname=capstone-project`
  );
}

function buildNaverAndroidIntentUrl(plan: RoutePlan): string {
  const nmapUrl = buildNaverRouteUrl(plan);
  if (!nmapUrl) return '';
  const path = nmapUrl.replace('nmap://route/car?', '');
  return (
    `intent://route/car?${path}` +
    '#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end'
  );
}

function buildKakaoRouteUrl(plan: RoutePlan): string {
  const { origin, waypoint, destination } = plan;
  if (!origin || !destination) return '';

  if (waypoint) {
    return (
      `kakaomap://route?sp=${origin.latitude},${origin.longitude}` +
      `&vp=${waypoint.latitude},${waypoint.longitude}` +
      `&ep=${destination.latitude},${destination.longitude}&by=car`
    );
  }
  return `kakaomap://route?sp=${origin.latitude},${origin.longitude}&ep=${destination.latitude},${destination.longitude}&by=car`;
}

function buildWebFallbackUrl(plan: RoutePlan): string {
  const dest = plan.destination!;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`;
}

async function openUrl(url: string, appLabel: string, plan: RoutePlan) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // canOpenURL may fail on some Android configs; try open anyway
  }

  try {
    await Linking.openURL(url);
    return;
  } catch {
    Alert.alert(
      `${appLabel} 미설치`,
      `${appLabel} 앱을 열지 못했습니다. 웹 지도로 이동할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '웹 지도로 이동',
          onPress: () => Linking.openURL(buildWebFallbackUrl(plan)),
        },
      ],
    );
  }
}

export async function openNaverRoute(plan: RoutePlan) {
  if (!canNavigate(plan)) {
    Alert.alert('알림', '출발지와 목적지를 모두 지정해 주세요.');
    return;
  }
  const url =
    Platform.OS === 'android' ? buildNaverAndroidIntentUrl(plan) : buildNaverRouteUrl(plan);
  await openUrl(url, '네이버 지도', plan);
}

export async function openKakaoRoute(plan: RoutePlan) {
  if (!canNavigate(plan)) {
    Alert.alert('알림', '출발지와 목적지를 모두 지정해 주세요.');
    return;
  }
  await openUrl(buildKakaoRouteUrl(plan), '카카오맵', plan);
}

export function openRouteAppSelector(plan: RoutePlan) {
  if (!canNavigate(plan)) return;

  Alert.alert('길찾기 앱 선택', '원하는 지도 앱을 선택해주세요.', [
    { text: '네이버 지도', onPress: () => openNaverRoute(plan) },
    { text: '카카오맵', onPress: () => openKakaoRoute(plan) },
    { text: '취소', style: 'cancel' },
  ]);
}
