import type { EvMapPoint } from './ev';

/** 같은 건물(이름+좌표) 충전기는 1마커로 묶습니다. */
export function dedupeEvByBuilding(chargers: EvMapPoint[]): EvMapPoint[] {
  const byKey = new Map<string, EvMapPoint>();

  for (const c of chargers) {
    const key = `${c.name}|${c.latitude.toFixed(5)}|${c.longitude.toFixed(5)}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, c);
      continue;
    }
    if (prev.statName !== '사용가능' && c.statName === '사용가능') {
      byKey.set(key, c);
    }
  }

  return [...byKey.values()];
}
