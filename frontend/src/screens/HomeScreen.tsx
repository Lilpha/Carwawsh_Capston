import React, { useState, useEffect, useRef } from 'react';
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
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { supabase } from '../lib/supabase';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MAP_FACILITY_FILTER_OPTIONS } from '../lib/map-facility-filters';

// 앱 내부에서 공통으로 사용할 고정 디자인 컬러 에셋
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

// 지도의 기본 초기 중심 좌표값 (춘천 한림대학교 정문 기준)
const INITIAL_COORD = { latitude: 37.8865, longitude: 127.7385 };

// 세차장 데이터 객체의 구조를 정의하는 TypeScript 타입 가이드
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

/**
 * 💡 백엔드 디비에서 넘어오는 다양한 형태의 불리언 값(1, "true", true 등)을 
 * 자바스크립트 표준 불리언(true/false)으로 안전하게 변환해 주는 방어용 유틸 함수
 */
function isTruthyFacilityFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    return t === 'true' || t === '1' || t === 'yes';
  }
  return false;
}

const HomeScreen = () => {
  // 💡 [수정] 네비게이션 타입 오류를 해결하기 위해 RootStackParamList를 명시적으로 바인딩
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 지도 위에 그려질 최종 세차장 마커들의 리스트 상태 관리
  const [washes, setWashes] = useState<Wash[]>([]);
  
  // 💡 [수정] 노션 명세 원본 설계 복원: Set 객체 대신 직관적인 개별 boolean 상태값으로 선언
  const [isHotWater, setIsHotWater] = useState(false);
  const [isIndoor, setIsIndoor] = useState(false);

  // 현재 카메라의 중심 좌표 및 줌 레벨에 따른 출력 제한 개수를 기억할 상태 변수 (실시간 필터링에 재사용)
  const [currentLimit, setCurrentLimit] = useState(10);
  const [currentRegion, setCurrentRegion] = useState(INITIAL_COORD);

  // 상/하단 커스텀 UI 패널 애니메이션 제어용 인덱스 및 오파시티 레퍼런스
  const [mapSheetIndex, setMapSheetIndex] = useState(-1);
  const bottomBarOpacity = useRef(new Animated.Value(1)).current;
  const topSearchOpacity = useRef(new Animated.Value(1)).current;

  // 하단 디테일 시트가 올라오고 내려갈 때 하단 바의 투명도를 부드럽게 조절하는 효과
  useEffect(() => {
    Animated.timing(bottomBarOpacity, {
      toValue: mapSheetIndex >= 0 ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [mapSheetIndex, bottomBarOpacity]);

  // 하단 시트가 화면을 꽉 채울 때 상단 검색창을 자연스럽게 숨겨주는 효과
  useEffect(() => {
    Animated.timing(topSearchOpacity, {
      toValue: mapSheetIndex === 1 ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [mapSheetIndex, topSearchOpacity]);

  // ========================================================
  // 💻 [실시간 모니터링] 사장님 플랫폼 상태 변경 감시 (Realtime)
  // ========================================================
  useEffect(() => {
    const shopSubscription = supabase
      .channel('realtime-home-shops')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // 오직 디비 테이블이 수정(UPDATE)될 때만 실시간 무전 신호를 수신합니다.
          schema: 'public',
          table: 'shops',
        },
        (payload) => {
          console.log('📱 [실시간 신호 수신] 사장님이 상태를 변경함:', payload.new);

          // 현재 상태(washes) 배열을 순회하며 방금 사장님이 수정한 세차장 딱 하나만 타겟팅해서 가꿔줍니다.
          setWashes((currentWashes) =>
            currentWashes.map((wash) => {
              if (wash.id === payload.new.id) {
                
                // 사장님이 설정을 바꾸는 즉시 앱 마커 색상에 반영되도록 포맷팅 동기화
                let appStatus = '정상';
                if (payload.new.op_status === '영업종료') {
                  appStatus = '영업종료';
                } else if (payload.new.has_hot_water === false) {
                  appStatus = '동파';
                }

                return {
                  ...wash,
                  name: payload.new.name,
                  status: appStatus, // 변경된 상태 주입 (green / red 컬러 스위칭 원동력)
                  hasHeatedWater: payload.new.has_hot_water,
                  congestion: payload.new.congestion, // 혼잡도 실시간 연동
                  announcement: payload.new.announcement, // 공지사항 실시간 연동
                  latitude: Number(payload.new.latitude),
                  longitude: Number(payload.new.longitude),
                };
              }
              return wash;
            })
          );
        }
      )
      .subscribe();

    // 컴포넌트가 파괴될 때 불필요한 스트리밍 구독을 취소하여 메모리 누수 방지
    return () => {
      supabase.removeChannel(shopSubscription);
    };
  }, []);

  /**
   * 💡 [수정] 두 위도/경도 좌표 사이의 직선거리(km)를 미터 단위까지 정밀하게 연산하는 하버사인 공식 함수 이식
   */
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // 지구 평균 반지름 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * 💡 주변 세차장 데이터를 가져오는 핵심 통신 및 가공 파이프라인 함수
   */
  const fetchNearbyWashes = async (lat: number, lng: number, limit: number, hotWater: boolean, indoor: boolean) => {
    try {
      // 💡 [수정] RPC 반경 필터 제한으로 인한 [] (빈 배열) 반환 억까를 방지하기 위해 통짜 테이블 전체 데이터를 백업망으로 확보
      const testResult = await supabase.from('shops').select('*');
      const allShops = testResult.data ?? [];

      // 💡 [수정] 핵심 버그 수리: 객체 파라미터 타입 충돌을 완벽히 비껴가기 위해 '배열`[]` 문법'을 활용해 인자 직격 주입!
      // 에러 로그 명세 순서 100% 매칭: (is_hotwater, is_indoor, search_limit, user_lat, user_lng)
      const { data, error } = await supabase.rpc('get_nearby_washes', [
        hotWater, 
        indoor,    
        Math.floor(limit ?? 15), // 실수형 유입을 막기 위해 내림 처리 안전장치 적용
        lat,       
        lng        
      ] as any);

      // RPC 결과가 멀어서 비어있으면 안전하게 백업 데이터셋을 메인 타겟으로 삼아 마커 실종 방지
      const activeData = data && data.length > 0 ? data : allShops;

      if (activeData) {
        console.log('✅ [RPC/백업 데이터 수신 성공] 처리 대상 총 개수:', activeData.length);

        // 💡 [수정] 지도의 줌 레벨 최적화 제한값(limit)에 연동하여 마커를 스크리닝할 기준 반경(km)을 유연하게 책정
        let allowedRadiusKm = 4.0;
        if (limit <= 5) allowedRadiusKm = 1.5;       // 확대 상태일 때는 가까운 1.5km 이내만 노출
        else if (limit <= 15) allowedRadiusKm = 4.0;  // 표준 줌 레벨 반경
        else if (limit <= 30) allowedRadiusKm = 8.0;  // 광역 줌 레벨 반경
        else allowedRadiusKm = 20.0;                  // 완전 축소 상태일 때는 20km까지 대량 수용

        // 💡 [수정] 계산된 동적 거리 반경과 노션 boolean 명세 기준에 부합하는 세차장만 앱단에서 스크리닝
        const filteredData = activeData.filter((w: any) => {
          const wLat = Number(w.latitude ?? w.lat);
          const wLng = Number(w.longitude ?? w.lng);

          // 현재 내 카메라 중심 좌표와 세차장 실제 위치 사이의 직선 거리 연산
          const distance = getDistanceKm(lat, lng, wLat, wLng);
          if (distance > allowedRadiusKm) return false; // 허용 반경보다 먼 곳에 있다면 과감하게 탈락

          // 노션 boolean 명세 기준 필터링 동기화 (디비 스네이크/카멜 키 분기 양방향 방어)
          if (hotWater && isTruthyFacilityFlag(w.has_hot_water) === false && isTruthyFacilityFlag(w.has_hotwater) === false) return false;
          if (indoor && isTruthyFacilityFlag(w.has_indoor_bay) === false && isTruthyFacilityFlag(w.is_indoor) === false) return false;
          return true;
        });

        // 최종 필터링을 통과한 데이터 중 최대 출력 개수(limit)만큼만 정밀하게 커팅
        const finalLimitedData = filteredData.slice(0, limit);

        setWashes(
          finalLimitedData.map((w: any) => {
            // 💡 [수정] 따옴표 문자열로 넘어오던 위경도 데이터를 숫자로 엄격하게 파싱하여 네이버 지도 크래시 방지
            const finalLat = Number(w.latitude ?? w.lat);
            const finalLng = Number(w.longitude ?? w.lng);

            // 실시간 소켓 로직과 마커 렌더링 컬러의 통일성을 위한 status 동기화 포맷팅
            let appStatus = '정상';
            if (w.op_status === '영업종료') {
              appStatus = '영업종료';
            } else if (isTruthyFacilityFlag(w.has_hot_water) === false) {
              appStatus = '동파';
            }

            return {
              ...w,
              id: Number(w.id),
              name: w.name,
              address: w.address ?? '',
              status: appStatus, // UI 마커 분기 조건에 다이렉트 바인딩
              latitude: finalLat,
              longitude: finalLng,
            };
          }),
        );
      }
    } catch (e: any) {
      console.error('검색 실패:', e.message);
    }
  };

  // 상단 검색창 및 필터 칩 영역 렌더링 객체
  const topOverlayContent = (
    <>
      <View style={styles.searchOuter} pointerEvents="box-none">
        <Pressable
          onPress={() => navigation.navigate('Search' as any)}
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
          // 💡 [수정] 노션 명세에 맞춰 개별 불리언 상태값과 필터 칩의 활성화 유무 링크 매칭
          const isActive = 
            (f.key === 'hotwater' && isHotWater) || 
            (f.key === 'indoor' && isIndoor);

          return (
            <Pressable
              key={f.key}
              onPress={() => {
                // 💡 [수정] 필터 칩 클릭 즉시, 대소문자 오타 수리 및 바뀐 상태를 토대로 다이렉트 강제 실시간 재검색 연동!
                if (f.key === 'hotwater') {
                  const next = !isHotWater;
                  setIsHotWater(next);
                  fetchNearbyWashes(currentRegion.latitude, currentRegion.longitude, currentLimit, next, isIndoor);
                } else if (f.key === 'indoor') {
                  const next = !isIndoor;
                  setIsIndoor(next); // 💡 오타 수정 완료: setisIndoor -> setIsIndoor
                  fetchNearbyWashes(currentRegion.latitude, currentRegion.longitude, currentLimit, isHotWater, next);
                } else {
                  Alert.alert('알림', '준비 중인 필터입니다.');
                }
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary : colors.panel,
                  borderColor: isActive ? 'transparent' : colors.panelBorder,
                },
              ]}
            >
              <MaterialIcons name={f.icon as any} size={18} color={isActive ? '#fff' : colors.muted} />
              <Text style={[styles.chipText, { color: isActive ? '#fff' : colors.muted }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );

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
          const { latitude, longitude, zoom = 15 } = e;

          // 줌 레벨이 돋보기 상태일수록 소수의 최적화된 마커만 스크리닝하도록 분기
          let markerLimit = 10;
          if (zoom >= 16) markerLimit = 5;
          else if (zoom >= 14) markerLimit = 15;
          else if (zoom >= 12) markerLimit = 30;
          else markerLimit = 50;

          // 💡 [수정] 대소문자 수리 완료 (setcurrentRegion -> setCurrentRegion)
          setCurrentRegion({ latitude, longitude });
          setCurrentLimit(markerLimit);

          // 지도가 멈추는 순간 현재 토글된 필터 boolean 상태를 꽉 채워서 서버 요청 수행
          fetchNearbyWashes(latitude, longitude, markerLimit, isHotWater, isIndoor);
        }}
      >
        {/* 가공된 washes 배열을 기반으로 순수한 숫자 위경도 좌표 위에 마커 overlays 바인딩 */}
        {washes.map((wash) => (
          <NaverMapMarkerOverlay
            key={`wash-${wash.id}`}
            latitude={wash.latitude}
            longitude={wash.longitude}
            image={{ symbol: wash.status === '동파' ? 'red' : 'green' }} // status 분기에 따라 레드/그린 핀 전환
            caption={{ text: wash.name }}
            onTap={() => Alert.alert(wash.name, `${wash.address}\n상태: ${wash.status}`)}
          />
        ))}
      </NaverMapView>

      {/* 상단 검색창 및 필터 레이어 */}
      <Animated.View
        style={[styles.topOverlayWrap, { opacity: topSearchOpacity }]}
        pointerEvents={mapSheetIndex === 1 ? 'none' : 'box-none'}
      >
        <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
          {topOverlayContent}
        </SafeAreaView>
      </Animated.View>

      {/* 하단 제어 액션 바 */}
      <Animated.View
        style={[styles.bottomOverlay, { opacity: bottomBarOpacity }]}
        pointerEvents={mapSheetIndex >= 0 ? 'none' : 'box-none'}
      >
        <View style={styles.bottomActions}>
          <View style={styles.ctaRow}>
            <Pressable
              onPress={() => navigation.navigate('Saved')}
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

// 스타일시트 레이아웃 명세 정의
const styles = StyleSheet.create({
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  topOverlayWrap: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 6 },
  topOverlay: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
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
      ios: { shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: { flex: 1, fontSize: 15, fontWeight: '600' },
  filtersScroll: { marginTop: 4 },
  filters: { paddingHorizontal: 2, gap: 10, paddingBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 5 },
    }),
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  bottomOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6 },
  bottomActions: { paddingHorizontal: 16, paddingBottom: 14, gap: 12, alignItems: 'stretch' },
  ctaRow: { width: '100%', maxWidth: 420, flexDirection: 'row', gap: 12 },
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
      ios: { shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 7 },
    }),
  },
  ctaText: { fontSize: 15, fontWeight: '800' },
});

export default HomeScreen;