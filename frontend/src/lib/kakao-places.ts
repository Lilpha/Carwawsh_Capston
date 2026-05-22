import { EXPO_PUBLIC_KEYWORD_API_BASE_URL } from '@env';

import type { RoutePlanPlace } from './route-plan';

/** 팀 keyword-test API (키워드 검색_API.pdf) */
const DEFAULT_KEYWORD_API_BASE = 'https://master-page-eta.vercel.app';

export type KakaoPlaceResult = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  category?: string;
};

type KeywordApiPlace = {
  id: string;
  placeName: string;
  categoryGroupName?: string;
  roadAddressName?: string;
  addressName?: string;
  x: string;
  y: string;
};

type KeywordApiResponse = {
  ok: boolean;
  message?: string;
  places?: KeywordApiPlace[];
};

function getKeywordApiBaseUrl(): string {
  const fromEnv = EXPO_PUBLIC_KEYWORD_API_BASE_URL?.trim();
  return (fromEnv || DEFAULT_KEYWORD_API_BASE).replace(/\/$/, '');
}

export function getKeywordSearchApiUrl(keyword: string, size = 15, page = 1): string {
  const params = new URLSearchParams({
    keyword: keyword.trim(),
    size: String(Math.min(Math.max(size, 1), 15)),
    page: String(Math.max(page, 1)),
  });
  return `${getKeywordApiBaseUrl()}/api/keyword-test?${params}`;
}

/** GET /api/keyword-test — 서버가 카카오 키워드 검색을 대신 수행 */
export async function searchKakaoPlaces(keyword: string, size = 15): Promise<KakaoPlaceResult[]> {
  const q = keyword.trim();
  if (!q) return [];

  const url = getKeywordSearchApiUrl(q, size);
  const res = await fetch(url);
  const data = (await res.json()) as KeywordApiResponse;

  if (!res.ok || !data.ok) {
    throw new Error(data.message || `키워드 검색 실패 (${res.status})`);
  }

  const places = data.places ?? [];

  return places.flatMap((p) => {
    const lat = Number(p.y);
    const lng = Number(p.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const item: KakaoPlaceResult = {
      id: `kakao-${p.id}`,
      name: String(p.placeName ?? ''),
      latitude: lat,
      longitude: lng,
      address: (p.roadAddressName || p.addressName || '').trim(),
    };
    if (p.categoryGroupName) item.category = p.categoryGroupName;
    return [item];
  });
}

export function kakaoResultToRoutePlace(result: KakaoPlaceResult): RoutePlanPlace {
  return {
    id: result.id,
    kind: 'wash',
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    address: result.address,
  };
}
