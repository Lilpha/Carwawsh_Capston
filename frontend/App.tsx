import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Text, View, Alert, ActivityIndicator, 
  ScrollView,
  Pressable,
  Platform
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const INITIAL_COORD = { latitude: 37.5665, longitude: 126.9780 };

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

const App = () => {
  // Temporary test mode: bypass Firebase auth and land on map screen first.
  //이 부분이 초기 시작화면을 결정하는 부분인데, firebaase auth 문제로
  // 기존 LOGIN으로 시작하던 것을 MAP으로 바꿔서 바로 지도 화면이 나오도록 했습니다.
  //이후 로그인/회원가입 기능이 supabase 기반으로 완성되면 다시 LOGIN으로 바꿔주세요.
  const [currentScreen, setCurrentScreen] = useState('MAP'); // LOGIN, SIGNUP, MAP
  const [loading, setLoading] = useState(false);
  const [washes, setWashes] = useState<Wash[]>([]);
  
  // 가입/로그인용 공통 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState('승용');

  // 세차장 데이터 로드 함수
  const loadWashes = async () => {
    try {
      const response = await fetch('http://10.0.2.2:3000/api/carwashes');
      const data: Wash[] = await response.json();
      setWashes(
        data.map((wash) => ({
          ...wash,
          latitude: Number(wash.latitude),
          longitude: Number(wash.longitude),
        }))
      );
    } catch (e) {
      console.error('데이터 로딩 에러:', e);
    }
  };

  useEffect(() => {
    if (currentScreen === 'MAP') {
      loadWashes();
    }
  }, [currentScreen]);

  // --- 1. 로그인 로직 ---
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('알림', '정보를 입력해주세요.');
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
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
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      await fetch('http://10.0.2.2:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userCredential.user.uid, email, carNumber, carType }),
      });
      Alert.alert('성공', '회원가입 완료! 로그인을 진행해주세요.');
      setCurrentScreen('LOGIN');
    } catch (e: any) {
      Alert.alert('가입 에러', e.message);
    } finally { setLoading(false); }
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
        {washes.map((wash) => (
          //미카 셍성 내용.
          //https://rnnavermap.mjstudio.net/docs/components/naver-map-view
          <NaverMapMarkerOverlay
            key={`wash-${wash.id}`}
            latitude={wash.latitude}
            longitude={wash.longitude}
            image={{ symbol: wash.status === '동파' ? 'red' : 'green' }}
            anchor={{ x: 0.5, y: 1 }}
            caption={{ text: wash.name }}
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
            const active = f.active;
            return (
              <Pressable
                onPress={() => Alert.alert('알림', `${f.key} 버튼 클릭됨.`)}
                key={f.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.panel,
                    borderColor: active ? 'transparent' : colors.panelBorder,
                  },
                ]}
              >
                <MaterialIcons name={f.icon as any} size={18} color={active ? '#fff' : colors.muted} />
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
              <Pressable
                onPress={() => Alert.alert('알림', '리스트 뷰 버튼 클릭됨.')}
                //router.push('/(tabs)/list')}
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
      {/* 라단 레이아웃 끝 */}
      <TouchableOpacity 
      style={styles.logoutBtn}
      onPress={() =>  Alert.alert('알림', '로그아웃 버튼 클릭됨. supabase 단 추가요청')}>
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
  logoutBtn: { position: 'absolute', bottom: 40, right: 20, backgroundColor: 'rgba(255,59,48,0.9)', padding: 15, borderRadius: 30 }
  
});

export default App;