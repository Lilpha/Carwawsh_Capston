import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { supabase } from '../lib/supabase';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useLoginRedirect } from '../navigation/LoginRedirectContext';
import {
  MAP_FACILITY_FILTER_OPTIONS,
  type MapFacilityFilterKey,
} from '../lib/map-facility-filters';

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

// 1. 상단 INITIAL_COORD를 춘천(한림대)으로 통일
const INITIAL_COORD = { latitude: 37.8865, longitude: 127.7385 };

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

function washMatchesFacilityFilters(
  wash: WashRow,
  filters: Set<MapFacilityFilterKey>,
): boolean {
  if (filters.size === 0) return true;
  const hot = isTruthyFacilityFlag(wash.hasHeatedWater);
  const indoor =
    isTruthyFacilityFlag(wash.hasIndoorBay) ||
    isTruthyFacilityFlag(wash.has_indoor_bay);
  const ev =
    isTruthyFacilityFlag(wash.hasEvCharging) ||
    isTruthyFacilityFlag(wash.has_ev_charging);
  if (filters.has('hotwater') && !hot) return false;
  if (filters.has('indoor') && !indoor) return false;
  if (filters.has('ev') && !ev) return false;
  return true;
}

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // const { registerGoToLogin } = useLoginRedirect();

  const [loading, setLoading] = useState(false);
  const [washes, setWashes] = useState<Wash[]>([]);
  const [selectedFacilityFilters, setSelectedFacilityFilters] = useState<
    Set<MapFacilityFilterKey>
  >(() => new Set());
  
  // 현재 줌과 좌표를 저장해둘 상태 (필터 변경 시 재사용)
  const [currentLimit, setCurrentLimit] = useState(10);
  const [currentRegion, setCurrentRegion] = useState(INITIAL_COORD);

  const [mapSheetIndex, setMapSheetIndex] = useState(-1);
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

  // useFocusEffect(
  //   useCallback(() => {
  //     registerGoToLogin(() => {
  //       // setCurrentScreen('LOGIN');
  //       // 글로벌 스택에 있는 Login 화면으로 리다이렉트
  //       navigation.navigate('Login');
  //     });
  //   }, [registerGoToLogin, navigation]),
  // );

  const getMarkerLimitByZoom = (zoom?: number) => {
    if (typeof zoom !== 'number') return currentLimit;
    if (zoom >= 16) return 5;
    if (zoom >= 14) return 15;
    if (zoom >= 12) return 30;
    return 50;
  };

  // 주변 세차장 데이터를 가져오는 함수 (PostGIS 연동)
  const fetchNearbyWashes = async (lat: number, lng: number, searchLimit: number) => {
    const isHotWater = selectedFacilityFilters.has('hotwater');
    const isIndoor = selectedFacilityFilters.has('indoor');

    console.log('--- [서버 요청 데이터 패키지] ---');
    console.log({
      위도: lat,
      경도: lng,
      개수제한: searchLimit,
      온수필터: isHotWater,
      실내필터: isIndoor
    });

    try {
      const { data, error } = await supabase.rpc('get_nearby_washes', {
        user_lat: lat,
        user_lng: lng,
        search_limit:15  
//        search_limit: searchLimit,
      });
      if (error) throw error;
      if (data) {
        setWashes(
          data.map((w: any) => ({
            ...w,
            latitude: Number(w.latitude),
            longitude: Number(w.longitude),
          })),
        );
        console.log(data);
      }
    } catch (e: any) {
      console.error('검색 실패:', e.message);
    }
  };

  const topOverlayContent = (
    <>
      <View style={styles.searchOuter} pointerEvents="box-none">
        <Pressable
          onPress={() => navigation.getParent()?.navigate('Search')}
          style={[
            styles.search,
            { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
          ]}
        >
          <MaterialIcons name="search" size={22} color={colors.primary} style={styles.searchIcon} />
          <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>세차장 이름·지역 검색</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}
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
    </>
  );

  // --- 화면 분기 렌더링 ---

  // [C] 지도 화면 (Step 3 결과물)
  return (
    <View style={styles.mapContainer}>
      <NaverMapView
        style={styles.map}
        initialCamera={{ 
          latitude: INITIAL_COORD.latitude, 
          longitude: INITIAL_COORD.longitude, 
          zoom: 15 
        }}
        onCameraChanged={(e) => {
          const markerLimit = getMarkerLimitByZoom(e.zoom);
          setCurrentLimit(markerLimit);
          setCurrentRegion({ latitude: e.latitude, longitude: e.longitude });
          fetchNearbyWashes(e.latitude, e.longitude, markerLimit);
        }}
      >
        {/* 마커들은 그대로 둡니다 */}
        {washes.map((wash) => (
          <NaverMapMarkerOverlay
            key={`wash-${wash.id}`}
            latitude={wash.latitude}
            longitude={wash.longitude}
            image={{ symbol: wash.status === '동파' ? 'red' : 'green' }}
            caption={{ text: wash.name }}
            onTap={() => Alert.alert(wash.name, `${wash.address}\n상태: ${wash.status}`)}
          />
        ))}

      </NaverMapView>

      <Animated.View
        style={[styles.topOverlayWrap, { opacity: topSearchOpacity }]}
        pointerEvents={mapSheetIndex === 1 ? 'none' : 'box-none'}
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
              onPress={() => Alert.alert('알림', 'my location 버튼 클릭됨.')}
              style={[styles.cta, { backgroundColor: colors.primary, borderColor: 'transparent' }]}
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
  map: { flex: 1 },
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
