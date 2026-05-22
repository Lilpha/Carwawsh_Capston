import { EXPO_PUBLIC_DATA_API_BASE_URL } from '@env';

/** Opinet 수집 API 원본 필드 (http://…/api/opinet) */
export type OpinetStationDto = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  price: number;
  brandName?: string;
  brandCode?: string;
  distance?: number;
};

export type GasMapPoint = {
  kind: 'gas';
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  price: number;
  brandName?: string;
  distance?: number;
};

const DEFAULT_DATA_API_BASE = 'http://infpsungho.gonetis.com:3399';

function getDataApiBaseUrl(): string {
  const fromEnv = EXPO_PUBLIC_DATA_API_BASE_URL?.trim();
  return (fromEnv || DEFAULT_DATA_API_BASE).replace(/\/$/, '');
}

export function getOpinetApiUrl(): string {
  return `${getDataApiBaseUrl()}/api/opinet`;
}

export async function fetchOpinetStations(): Promise<GasMapPoint[]> {
  const url = getOpinetApiUrl();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Opinet API 오류 (${res.status})`);
  }
  const data = (await res.json()) as OpinetStationDto[];
  if (!Array.isArray(data)) {
    throw new Error('Opinet API: 배열 응답이 아닙니다');
  }

  return data
    .filter(
      (s) =>
        s != null &&
        Number.isFinite(Number(s.latitude)) &&
        Number.isFinite(Number(s.longitude)),
    )
    .map((s) => ({
      kind: 'gas' as const,
      id: String(s.id),
      name: String(s.name ?? ''),
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      price: Number(s.price),
      brandName: s.brandName,
      distance: s.distance != null ? Number(s.distance) : undefined,
    }));
}
