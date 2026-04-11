/**
 * 지도 메인 필터 칩 키. 위치 기반 데이터 연동 시 API/쿼리 필터와 1:1로 매핑하면 됩니다.
 * (develop_log / carwash-app/lib/map-facility-filters.ts 와 동일 계약)
 */
export type MapFacilityFilterKey = 'hotwater' | 'indoor' | 'ev';

export const MAP_FACILITY_FILTER_OPTIONS: {
  key: MapFacilityFilterKey;
  label: string;
  icon: 'ac-unit' | 'home' | 'bolt';
}[] = [
  { key: 'hotwater', label: 'Hot water', icon: 'ac-unit' },
  { key: 'indoor', label: 'Indoor bay', icon: 'home' },
  { key: 'ev', label: 'EV charging', icon: 'bolt' },
];
