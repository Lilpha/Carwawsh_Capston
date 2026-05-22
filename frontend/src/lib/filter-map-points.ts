type LatLng = { latitude: number; longitude: number };

/** 대략적인 거리(km) — 데모용 근접 필터 */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 지도 중심 근처 POI만 표시 (마커 과다·터치 불가 방지) */
export function filterNearestPoints<T extends LatLng>(
  points: T[],
  center: LatLng,
  maxRadiusKm: number,
  limit: number,
): T[] {
  return points
    .map((p) => ({ p, d: distanceKm(center, p) }))
    .filter(({ d }) => d <= maxRadiusKm)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ p }) => p);
}
