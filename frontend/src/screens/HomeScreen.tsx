import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Text, View, Alert, ActivityIndicator, 
  ScrollView,
  Pressable,
  Platform
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

// 1. 상단 INITIAL_COORD를 춘천(한림대)으로 통일
const INITIAL_COORD = { latitude: 37.8865, longitude: 127.7385 };

const FILTERS = [
  { key: 'hotwater', label: 'Hot Water', icon: 'ac-unit', active: true },
  { key: 'indoor', label: 'Indoor Bay', icon: 'home', active: false },
  { key: 'ev', label: 'EV Charging', icon: 'bolt', active: false },
  { key: 'card', label: 'Card Payment', icon: 'credit-card', active: false },
];

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
  hasHeatedWater: boolean;
};

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Temporary test mode: bypass Firebase auth and land on map screen first.
  //이 부분이 초기 시작화면을 결정하는 부분인데, firebase auth 문제로
  // 기존 LOGIN으로 시작하던 것을 MAP으로 바꿔서 바로 지도 화면이 나오도록 했습니다.
  //이후 로그인/회원가입 기능이 supabase 기반으로 완성되면 다시 LOGIN으로 바꿔주세요.
  const [currentScreen, setCurrentScreen] = useState('LOGIN'); // LOGIN, SIGNUP, MAP
  const [loading, setLoading] = useState(false);
  const [washes, setWashes] = useState<Wash[]>([]);
  
  // 가입/로그인용 공통 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState('승용');

  // 온수, 실내 베이 여부 상태
  const [isHotWater, setIsHotWater] = useState(false);
  const [isIndoor, setIsIndoor] = useState(false);

  // 현재 줌과 좌표를 저장해둘 상태 (필터 변경 시 재사용)
  const [currentLimit, setcurrentLimit] = useState(10);
  const [currentRegion, setcurrentRegion] = useState(INITIAL_COORD);

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

  // 2. useEffect에서 전체 로드 대신 '주변 로드' 호출
  useEffect(() => {
    // 지도가 켜져 있을 때만 데이터를 가져옵니다.
    if (currentScreen === 'MAP') {
      fetchNearbyWashes();
    }
    // 의존성 배열에 모든 상태를 넣어줍니다. 
    // 하나라도 바뀌면 fetchNearbyWashes가 최신 상태를 들고 서버로 갑니다.
  }, [currentRegion, currentLimit, isHotWater, isIndoor, currentScreen]);

  // --- 1. 로그인 로직 ---
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('알림', '정보를 입력해주세요.');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // ★ 화면만 바꿔주면 useEffect의 [currentScreen] 감지 로직에 의해 첫 데이터가 로드됩니다.
      setCurrentScreen('MAP');
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message);
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

  // 주변 세차장 데이터를 가져오는 함수
  const fetchNearbyWashes = async () => {
    try {
      // RPC 함수 호출 시 search_limit을 함께 보냅니다.
      const { data, error } = await supabase.rpc('get_nearby_washes', {
        user_lat: currentRegion.latitude,
        user_lng: currentRegion.longitude,
        search_limit: currentLimit,
        is_hotwater: isHotWater, // 현재 State를 직접 참조
        is_indoor: isIndoor
      });
      if (error) throw error;
      if (data) {
        setWashes(data.map((w: any) => ({
          ...w,
          latitude: Number(w.latitude),
          longitude: Number(w.longitude),
        })));
      }
    } catch (e: any) {
      console.error('검색 실패:', e.message);
    }
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
        style={styles.map}
        initialCamera={{ 
          latitude: INITIAL_COORD.latitude, 
          longitude: INITIAL_COORD.longitude, 
          zoom: 15
        }}
        // [지도 조작 시]
        onCameraChanged={(e) => {
          const { latitude, longitude, zoom = 15 } = e;
          let markerLimit = 10;

          if (zoom >= 16) markerLimit = 5;
          else if (zoom >= 14) markerLimit = 15;
          else if (zoom >= 12) markerLimit = 30;
          else markerLimit = 50;

          // ★ 상태만 업데이트하면 위의 useEffect가 알아서 fetchNearbyWashes를 실행합니다.
          setcurrentRegion({ latitude, longitude });
          setcurrentLimit(markerLimit);
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

      {/* 상단 레이아웃 */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        {/* 검색창 */}
        <View style={styles.searchOuter} pointerEvents="box-none">
          <Pressable
            onPress={() => Alert.alert('알림', '검색 화면으로 이동합니다.')}
            style={[
              styles.search,
              { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
            ]}
          >
            <MaterialIcons name="search" size={22} color={colors.primary} style={styles.searchIcon} />
            <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>Where to?</Text>
            <MaterialIcons name="mic" size={22} color={colors.tabMuted} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={styles.filtersScroll}
        >
          {FILTERS.map((f) => {
            // [A] 현재 상태값(isHotWater, isIndoor)과 매칭
            const isActive =
              (f.key === 'hotwater' && isHotWater) ||
              (f.key === 'indoor' && isIndoor);
              
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  if (f.key === 'hotwater') setIsHotWater(!isHotWater);
                if (f.key === 'indoor') setIsIndoor(!isIndoor);
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
                onPress={() => navigation.navigate('List')}
                style={[
                  styles.cta,
                  { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
                ]}
              >
                <MaterialIcons name="list" size={20} color={colors.primary} />
                <Text style={[styles.ctaText, { color: colors.text }]}>List View</Text>
              </Pressable>
              <Pressable 
              onPress={() => Alert.alert('알림', '리스트 뷰 버튼 클릭됨.')}
              style={[styles.cta, { backgroundColor: colors.primary, borderColor: 'transparent' }]}>
                <MaterialIcons name="near-me" size={20} color="#fff" />
                <Text style={[styles.ctaText, { color: '#fff' }]}>My Location</Text>
              </Pressable>
            </View>
          </View>
        </View>
      {/* 하단 레이아웃 끝 */}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0, // 컨테이너 패딩은 0으로! (안의 ScrollView가 패딩을 가집니다)
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 10,
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
    width: '100%', // ★ 화면 끝까지 영역을 확보합니다.
  },
  filters: {
    paddingHorizontal: 16, // 좌우 시작과 끝에 16씩 여백
    paddingRight: 32,      // ★ 마지막 버튼 뒤에 좀 더 넉넉한 공간을 줍니다.
    gap: 10,
    paddingBottom: 8,      // 그림자가 잘리지 않게 아래쪽도 살짝 여유를 줍니다.
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
  logoutBtn: { position: 'absolute', bottom: 40, right: 20, backgroundColor: 'rgba(255,59,48,0.9)', padding: 15, borderRadius: 30 }
  
});

export default HomeScreen;