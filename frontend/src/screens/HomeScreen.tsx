import React, { useState, useEffect, useMemo } from 'react';
import { 
  SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Text, View, Alert, ActivityIndicator, 
  ScrollView,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  MAP_FACILITY_FILTER_OPTIONS,
  type MapFacilityFilterKey,
} from '../lib/map-facility-filters';

const INITIAL_COORD = { latitude: 37.5665, longitude: 126.9780 };

// 고정된 테마 색상 (App.tsx용 라이트모드 기준)
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

type Wash = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  hasHeatedWater?: boolean;
  /** shops 연동 시 camelCase 또는 has_indoor_bay 등으로 올 수 있음 */
  hasIndoorBay?: boolean;
  hasEvCharging?: boolean;
};

/** Supabase/스프레드 row의 불리언·null·문자열·snake_case 대응 */
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

  // Temporary test mode: bypass Firebase auth and land on map screen first.
  //이 부분이 초기 시작화면을 결정하는 부분인데, firebase auth 문제로
  // 기존 LOGIN으로 시작하던 것을 MAP으로 바꿔서 바로 지도 화면이 나오도록 했습니다.
  //이후 로그인/회원가입 기능이 supabase 기반으로 완성되면 다시 LOGIN으로 바꿔주세요.
  const [currentScreen, setCurrentScreen] = useState('LOGIN'); // LOGIN, SIGNUP, MAP
  const [loading, setLoading] = useState(false);
  const [washes, setWashes] = useState<Wash[]>([]);
  /** 선택된 시설 필터. 비어 있으면 필터 미적용(전체). 데이터 연동 시 이 Set을 쿼리 조건으로 넘기면 됩니다. */
  const [selectedFacilityFilters, setSelectedFacilityFilters] = useState<
    Set<MapFacilityFilterKey>
  >(() => new Set());
  /** 지도 마커 탭 시 표시할 세차장 (develop_log: 모달/바텀시트 패턴, 네비 구조 변경 없음) */
  const [selectedWash, setSelectedWash] = useState<Wash | null>(null);
  
  // 가입/로그인용 공통 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState('승용');

  // 세차장 데이터 로드 함수
  const loadWashes = async () => {
    try {
      const { data, error } = await supabase.from('shops').select('*');
      if (error) throw error;
      if (data) {
        setWashes(
          data.map((wash: any) => ({
            ...wash,
            latitude: Number(wash.latitude),
            longitude: Number(wash.longitude),
          }))
        );
      }
    } catch (e: any) {
      console.error('데이터 로딩 에러:', e.message);
    }
  };

  useEffect(() => {
    if (currentScreen === 'MAP') {
      loadWashes();
    }
  }, [currentScreen]);

  const visibleWashes = useMemo(() => {
    if (selectedFacilityFilters.size === 0) return washes;
    return washes.filter((wash) =>
      washMatchesFacilityFilters(wash as WashRow, selectedFacilityFilters),
    );
  }, [washes, selectedFacilityFilters]);

  // --- 1. 로그인 로직 ---
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('알림', '정보를 입력해주세요.');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      await loadWashes();
      setCurrentScreen('MAP');
    } catch (e: any) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인하세요.');
    } finally { setLoading(false); }
  };

  // --- 2. 회원가입 로직 ---
  const handleSignUp = async () => {
    if (!email || !password || !carNumber) return Alert.alert('알림', '모든 정보를 입력해주세요.');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ car_number: carNumber, car_type: carType })
        .eq('id', data.user?.id);
        
      if (updateError) throw updateError;
      
      Alert.alert('성공', '회원가입 완료! 로그인을 진행해주세요.');
      setCurrentScreen('LOGIN');
    } catch (e: any) {
      Alert.alert('가입 에러', e.message);
    } finally { setLoading(false); }
  };

  // --- 3. 로그아웃 로직 ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentScreen('LOGIN');
  };

  // --- 화면 분기 렌더링 ---

  // [A] 로그인 화면
  if (currentScreen === 'LOGIN') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>Mapping</Text>
          <Text style={styles.subtitle}>세차장 매칭 서비스</Text>
          <TextInput style={styles.input} placeholder="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>로그인</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('SIGNUP')}>
            <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // [B] 회원가입 화면
  if (currentScreen === 'SIGNUP') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>회원가입</Text>
          <TextInput style={styles.input} placeholder="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="차량 번호" value={carNumber} onChangeText={setCarNumber} />
          <View style={styles.pickerContainer}>
            <Picker selectedValue={carType} onValueChange={(v) => setCarType(v)}>
              <Picker.Item label="일반 승용차" value="승용" />
              <Picker.Item label="SUV / 대형차" value="SUV" />
            </Picker>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>가입 완료</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('LOGIN')}>
            <Text style={styles.linkText}>이미 계정이 있나요? 로그인</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // [C] 지도 화면 (Step 3 결과물)
  return (
    <View style={styles.mapContainer}>
      <NaverMapView
        style={StyleSheet.absoluteFill}
        initialCamera={{
          ...INITIAL_COORD,
          zoom: 14,
        }}
      >
        {visibleWashes.map((wash) => (
          //미카 셍성 내용.
          //https://rnnavermap.mjstudio.net/docs/components/naver-map-view
          <NaverMapMarkerOverlay
            key={`wash-${wash.id}`}
            latitude={wash.latitude}
            longitude={wash.longitude}
            image={{ symbol: wash.status === '동파' ? 'red' : 'green' }}
            anchor={{ x: 0.5, y: 1 }}
            caption={{ text: wash.name }}
            onTap={() => setSelectedWash(wash)}
          />
        ))}
      </NaverMapView>

      {/* 상단 레이아웃 */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        {/* 검색창 */}
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
      </SafeAreaView>
      {/* 상단 레이아웃 끝 */}
      
      {/* 하단 레이아웃 시작 */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
          <View style={styles.bottomActions}>
            <Pressable
              style={[
                styles.squareButton,
                { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
              ]}
            >
              <MaterialIcons name="layers" size={22} color={colors.primary} />
            </Pressable>

            <View style={styles.ctaRow}>
              {/* 네비게이션 함수!! 이 버튼을 누르면 상위 파일은 App.tsx에 해당 이름인 List으로 선언되어 있는  component={ListScreen} 으로 이동하게 됩니다. 이 형태로 유지해주시면 될 것 같아요. */}
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
              style={[styles.cta, { backgroundColor: colors.primary, borderColor: 'transparent' }]}>
                <MaterialIcons name="near-me" size={20} color="#fff" />
                <Text style={[styles.ctaText, { color: '#fff' }]}>My Location</Text>
              </Pressable>
            </View>
          </View>
        </View>
      {/* 하단 레이아웃 끝 */}
      <Modal
        visible={selectedWash !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedWash(null)}
      >
        <View style={styles.washDetailModalRoot}>
          <Pressable
            style={styles.washDetailBackdrop}
            onPress={() => setSelectedWash(null)}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          />
          {selectedWash ? (
            <View style={[styles.washDetailSheet, { borderColor: colors.panelBorder }]}>
              <View style={styles.washDetailSheetHeader}>
                <Text style={[styles.washDetailTitle, { color: colors.text }]} numberOfLines={2}>
                  {selectedWash.name}
                </Text>
                <Pressable
                  onPress={() => setSelectedWash(null)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="상세 닫기"
                >
                  <MaterialIcons name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>
              <Text style={[styles.washDetailAddress, { color: colors.muted }]} numberOfLines={4}>
                {selectedWash.address}
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
      <TouchableOpacity 
      style={styles.logoutBtn}
      onPress={handleLogout}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  //상단 메뉴 스타일
    safe: { flex: 1 },
  root: { flex: 1 },

  markerWrap: {
    position: 'absolute',
  },
  markerInner: { alignItems: 'center' },
  markerLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: '800',
  },
  markerPin: {
    textShadowColor: 'rgba(0,0,0,0.20)',
    textShadowRadius: 10,
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
    marginTop: 'auto',
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    alignItems: 'flex-end',
  },
  squareButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 7 },
    }),
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
  //상단 메뉴 스타일  종료
  container: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center' },
  inner: { paddingHorizontal: 30 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#007AFF' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#666' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  pickerContainer: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  linkText: { textAlign: 'center', marginTop: 20, color: '#007AFF' },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },
  washDetailModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  washDetailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  washDetailSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '40%',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 12 },
    }),
  },
  washDetailSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  washDetailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  washDetailAddress: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  logoutBtn: { position: 'absolute', bottom: 40, right: 20, backgroundColor: 'rgba(255,59,48,0.9)', padding: 15, borderRadius: 30 }
  
});

export default HomeScreen;