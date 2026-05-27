import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { supabase } from '../lib/supabase';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  CompositeNavigationProp,
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { filterNearestPoints } from '../lib/filter-map-points';
import {
  DEFAULT_NEARBY_WASH_LIMIT,
  DEMO_MAP_ZOOM,
  INITIAL_MAP_COORD,
  MAP_EV_MARKER_LIMIT,
  MAP_GAS_MARKER_LIMIT,
  MAP_POI_RADIUS_KM,
} from '../lib/map-constants';
import MapScreen, { type MapScreenHandle, type MapWashMarker } from './MapScreen';
import {
  MAP_FACILITY_FILTER_OPTIONS,
  type MapFacilityFilterKey,
} from '../lib/map-facility-filters';
import RoutePlannerCard from '../components/RoutePlannerCard';
import { dedupeEvByBuilding } from '../lib/ev-dedupe';
import { fetchEvChargers, type EvMapPoint } from '../lib/ev';
import { fetchOpinetStations, type GasMapPoint } from '../lib/opinet';
import { useRoutePlan } from '../navigation/RoutePlanContext';

const colors = {
  primary: '#5a58e9',
  bg: '#ffffff',
  panel: '#ffffff',
  panelBorder: 'rgba(148,163,184,0.35)',
  text: '#0F172A',
  muted: '#64748B',
  tabMuted: '#94A3B8',
  mapFallback: '#E2E8F0',
};

const INITIAL_COORD = INITIAL_MAP_COORD;

type Wash = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  hasHeatedWater?: boolean;
  hasIndoorBay?: boolean;
  hasEvCharging?: boolean;
};

function isTruthyFacilityFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    return t === 'true' || t === '1' || t === 'yes';
  }
  return false;
}

type WashRow = Wash & Record<string, unknown>;

/** 세차장 필터용 (hotwater·indoor만). 'ev'는 EV API 마커 표시 토글로 별도 처리 */
function washOnlyFacilityFilters(filters: Set<MapFacilityFilterKey>): Set<MapFacilityFilterKey> {
  const washFilters = new Set<MapFacilityFilterKey>();
  if (filters.has('hotwater')) washFilters.add('hotwater');
  if (filters.has('indoor')) washFilters.add('indoor');
  return washFilters;
}

function washMatchesFacilityFilters(
  wash: WashRow,
  filters: Set<MapFacilityFilterKey>,
): boolean {
  if (filters.size === 0) return true;
  const hot = isTruthyFacilityFlag(wash.hasHeatedWater);
  const indoor =
    isTruthyFacilityFlag(wash.hasIndoorBay) ||
    isTruthyFacilityFlag(wash.has_indoor_bay);
  if (filters.has('hotwater') && !hot) return false;
  if (filters.has('indoor') && !indoor) return false;
  return true;
}

type MapTabRoute = RouteProp<MainTabParamList, 'Map'>;
type HomeScreenNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigation>();
  const route = useRoute<MapTabRoute>();
  const { setForceCollapsed, openRouteSearchEntry } = useRoutePlan();

  const [washes, setWashes] = useState<Wash[]>([]);
  const [openWashIdFromList, setOpenWashIdFromList] = useState<number | null>(null);
  const [gasStations, setGasStations] = useState<GasMapPoint[]>([]);
  const [evChargers, setEvChargers] = useState<EvMapPoint[]>([]);
  const [selectedFacilityFilters, setSelectedFacilityFilters] = useState<
    Set<MapFacilityFilterKey>
  >(() => new Set());

  const [currentLimit, setCurrentLimit] = useState(DEFAULT_NEARBY_WASH_LIMIT);
  const [mapCenter, setMapCenter] = useState(INITIAL_COORD);

  const [mapSheetIndex, setMapSheetIndex] = useState(-1);
  const mapScreenRef = useRef<MapScreenHandle>(null);
  const bottomBarOpacity = useRef(new Animated.Value(1)).current;
  const topSearchOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(bottomBarOpacity, {
      toValue: mapSheetIndex >= 0 ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [mapSheetIndex, bottomBarOpacity]);

  useEffect(() => {
    Animated.timing(topSearchOpacity, {
      toValue: mapSheetIndex === 1 ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [mapSheetIndex, topSearchOpacity]);

  useEffect(() => {
    setForceCollapsed(mapSheetIndex >= 0);
  }, [mapSheetIndex, setForceCollapsed]);

  useFocusEffect(
    useCallback(() => {
      const id = route.params?.openWashId;
      if (id == null || !Number.isFinite(id)) return;
      setOpenWashIdFromList(id);
      navigation.setParams({ openWashId: undefined });
    }, [route.params?.openWashId, navigation]),
  );

  const allWashMarkers = useMemo(
    (): MapWashMarker[] =>
      washes.map((w) => ({
        ...w,
        latitude: Number(w.latitude),
        longitude: Number(w.longitude),
      })),
    [washes],
  );

  const getMarkerLimitByZoom = (zoom?: number) => {
    if (typeof zoom !== 'number') return currentLimit;
    if (zoom >= 16) return 5;
    if (zoom >= 14) return 15;
    if (zoom >= 12) return 30;
    return 50;
  };

  const fetchNearbyWashes = useCallback(
    async (lat: number, lng: number, searchLimit: number) => {
      try {
        const { data, error } = await supabase.rpc('get_nearby_washes', {
          user_lat: lat,
          user_lng: lng,
          search_limit: searchLimit,
        });
        if (error) {
          console.log('[MapDebug] get_nearby_washes error:', error.message ?? error);
          throw error;
        }
        if (data) {
          const rows = data.map((w: WashRow) => ({
            ...w,
            latitude: Number(w.latitude),
            longitude: Number(w.longitude),
          }));
          console.log('[MapDebug] get_nearby_washes ok:', {
            count: rows.length,
            lat,
            lng,
            searchLimit,
          });
          setWashes(rows);
        } else {
          console.log('[MapDebug] get_nearby_washes ok: data=null/undefined', {
            lat,
            lng,
            searchLimit,
          });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('검색 실패:', message);
        console.log('[MapDebug] get_nearby_washes failed:', message);
      }
    },
    [],
  );

  useEffect(() => {
    fetchNearbyWashes(INITIAL_COORD.latitude, INITIAL_COORD.longitude, currentLimit);
  }, [fetchNearbyWashes, currentLimit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [gasResult, evResult] = await Promise.allSettled([
        fetchOpinetStations(),
        fetchEvChargers(),
      ]);
      if (cancelled) return;
      if (gasResult.status === 'fulfilled') setGasStations(gasResult.value);
      else console.error('Opinet 로드 실패:', gasResult.reason);
      if (evResult.status === 'fulfilled') setEvChargers(evResult.value);
      else console.error('EV 로드 실패:', evResult.reason);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCameraIdle = useCallback(
    (e: { latitude: number; longitude: number; zoom?: number }) => {
      setMapCenter({ latitude: e.latitude, longitude: e.longitude });
      const markerLimit = getMarkerLimitByZoom(e.zoom);
      setCurrentLimit(markerLimit);
      fetchNearbyWashes(e.latitude, e.longitude, markerLimit);
    },
    [fetchNearbyWashes],
  );

  /** 데모용 My Location: GPS 없이 기본 중심으로 지도 이동 + 주변 세차장 갱신 */
  const handleMyLocationPress = useCallback(() => {
    mapScreenRef.current?.goToDemoLocation();
    const limit = getMarkerLimitByZoom(DEMO_MAP_ZOOM);
    setCurrentLimit(limit);
    fetchNearbyWashes(INITIAL_COORD.latitude, INITIAL_COORD.longitude, limit);
  }, [fetchNearbyWashes]);

  const visibleWashes = useMemo(() => {
    const washFilters = washOnlyFacilityFilters(selectedFacilityFilters);
    if (washFilters.size === 0) return washes;
    return washes.filter((wash) =>
      washMatchesFacilityFilters(wash as WashRow, washFilters),
    );
  }, [washes, selectedFacilityFilters]);

  const visibleGasStations = useMemo(
    () =>
      filterNearestPoints(
        gasStations,
        mapCenter,
        MAP_POI_RADIUS_KM,
        MAP_GAS_MARKER_LIMIT,
      ),
    [gasStations, mapCenter],
  );

  const showEvMapMarkers = selectedFacilityFilters.has('ev');

  const visibleEvChargers = useMemo(() => {
    if (!showEvMapMarkers) return [];
    return filterNearestPoints(
      dedupeEvByBuilding(evChargers),
      mapCenter,
      MAP_POI_RADIUS_KM,
      MAP_EV_MARKER_LIMIT,
    );
  }, [evChargers, mapCenter, showEvMapMarkers]);

  useEffect(() => {
    const washFilters = washOnlyFacilityFilters(selectedFacilityFilters);
    console.log('[MapDebug] map state:', {
      washesLength: washes.length,
      visibleWashesLength: visibleWashes.length,
      selectedFacilityFilters: Array.from(selectedFacilityFilters),
      washOnlyFilters: Array.from(washFilters),
      mapCenter,
    });
  }, [washes.length, visibleWashes.length, selectedFacilityFilters, mapCenter]);

  const topOverlayContent = (
    <View pointerEvents="box-none">
      <View style={styles.searchOuter} pointerEvents="box-none">
        <Pressable
          onPress={openRouteSearchEntry}
          style={[
            styles.search,
            { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
          ]}
          accessibilityRole="button"
          accessibilityLabel="출발·목적지 검색, 내비게이션 길찾기 열기"
        >
          <MaterialIcons name="search" size={22} color={colors.primary} style={styles.searchIcon} />
          <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>출발·목적지 검색</Text>
        </Pressable>
      </View>

      <View pointerEvents="box-none">
        <RoutePlannerCard forceCollapsed={mapSheetIndex >= 0} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}
        pointerEvents="box-none"
      >
        {MAP_FACILITY_FILTER_OPTIONS.map((f) => {
          const active = selectedFacilityFilters.has(f.key);
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                setSelectedFacilityFilters((prev) => {
                  const next = new Set(prev);
                  if (next.has(f.key)) next.delete(f.key);
                  else next.add(f.key);
                  return next;
                });
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.panel,
                  borderColor: active ? 'transparent' : colors.panelBorder,
                },
              ]}
            >
              <MaterialIcons name={f.icon} size={18} color={active ? '#fff' : colors.muted} />
              <Text style={[styles.chipText, { color: active ? '#fff' : colors.muted }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.mapContainer} pointerEvents="box-none">
      <MapScreen
        ref={mapScreenRef}
        visibleWashes={visibleWashes}
        openWashId={openWashIdFromList}
        allWashesForLookup={allWashMarkers}
        onOpenWashConsumed={() => setOpenWashIdFromList(null)}
        visibleGasStations={visibleGasStations}
        visibleEvChargers={visibleEvChargers}
        onSheetIndexChange={setMapSheetIndex}
        onCameraIdle={handleCameraIdle}
      />

      <Animated.View
        style={[styles.topOverlayWrap, { opacity: topSearchOpacity }]}
        pointerEvents={mapSheetIndex >= 0 ? 'none' : 'box-none'}
      >
        <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
          {topOverlayContent}
        </SafeAreaView>
      </Animated.View>

      <Animated.View
        style={[styles.bottomOverlay, { opacity: bottomBarOpacity }]}
        pointerEvents={mapSheetIndex >= 0 ? 'none' : 'box-none'}
      >
        <View style={styles.bottomActions}>
          <View style={styles.ctaRow}>
            <Pressable
              onPress={() => navigation.getParent()?.navigate('List')}
              style={[
                styles.cta,
                { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
              ]}
            >
              <MaterialIcons name="list" size={20} color={colors.primary} />
              <Text style={[styles.ctaText, { color: colors.text }]}>List View</Text>
            </Pressable>
            <Pressable
              onPress={handleMyLocationPress}
              style={[styles.cta, { backgroundColor: colors.primary, borderColor: 'transparent' }]}
              accessibilityRole="button"
              accessibilityLabel="데모 위치로 지도 이동 및 주변 세차장 갱신"
            >
              <MaterialIcons name="near-me" size={20} color="#fff" />
              <Text style={[styles.ctaText, { color: '#fff' }]}>My Location</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: { flex: 1 },
  topOverlayWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 6,
  },
  topOverlay: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchOuter: { alignItems: 'center' },
  search: {
    width: '100%',
    maxWidth: 420,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
    }),
  },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  filtersScroll: {
    marginTop: 4,
  },
  filters: {
    paddingHorizontal: 2,
    gap: 10,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 5 },
    }),
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    alignItems: 'stretch',
  },
  ctaRow: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    gap: 12,
  },
  cta: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 7 },
    }),
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default HomeScreen;
