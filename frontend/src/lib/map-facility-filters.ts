/**
 * 지도 메인 필터 칩 키.
 * - hotwater / indoor: 세차장(Supabase) 필터
 * - ev: EV API 마커 표시·숨김 토글 (세차장 필터 아님)
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
