import { EXPO_PUBLIC_DATA_API_BASE_URL } from '@env';

/** EV 수집 API 원본 필드 (http://…/api/ev) */
export type EvChargerDto = {
  id: number;
  name: string;
  typeCode?: string;
  typeName?: string;
  address?: string;
  addrDetail?: string;
  latitude: number;
  longitude: number;
  useTime?: string;
  stat?: string;
  statName?: string;
};

export type EvMapPoint = {
  kind: 'ev';
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  typeName?: string;
  address?: string;
  useTime?: string;
  stat?: string;
  statName?: string;
};

const DEFAULT_DATA_API_BASE = 'http://infpsungho.gonetis.com:3399';

function getDataApiBaseUrl(): string {
  const fromEnv = EXPO_PUBLIC_DATA_API_BASE_URL?.trim();
  return (fromEnv || DEFAULT_DATA_API_BASE).replace(/\/$/, '');
}

export function getEvApiUrl(): string {
  return `${getDataApiBaseUrl()}/api/ev`;
}

export async function fetchEvChargers(): Promise<EvMapPoint[]> {
  const url = getEvApiUrl();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`EV API 오류 (${res.status})`);
  }
  const data = (await res.json()) as EvChargerDto[];
  if (!Array.isArray(data)) {
    throw new Error('EV API: 배열 응답이 아닙니다');
  }

  return data
    .filter(
      (c) =>
        c != null &&
        Number.isFinite(Number(c.latitude)) &&
        Number.isFinite(Number(c.longitude)),
    )
    .map((c) => ({
      kind: 'ev' as const,
      id: String(c.id),
      name: String(c.name ?? ''),
      latitude: Number(c.latitude),
      longitude: Number(c.longitude),
      typeName: c.typeName,
      address: c.address,
      useTime: c.useTime,
      stat: c.stat,
      statName: c.statName,
    }));
}
