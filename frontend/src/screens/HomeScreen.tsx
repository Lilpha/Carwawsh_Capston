import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
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
import { supabase } from '../lib/supabase';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useLoginRedirect } from '../navigation/LoginRedirectContext';
import {
  MAP_FACILITY_FILTER_OPTIONS,
  type MapFacilityFilterKey,
} from '../lib/map-facility-filters';

import MapScreen from './MapScreen';

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
  const { registerGoToLogin } = useLoginRedirect();

  const [currentScreen, setCurrentScreen] = useState('MAP');
  const [loading, setLoading] = useState(false);
  const [washes, setWashes] = useState<Wash[]>([]);
  const [selectedFacilityFilters, setSelectedFacilityFilters] = useState<
    Set<MapFacilityFilterKey>
  >(() => new Set());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState('승용');

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

  useFocusEffect(
    useCallback(() => {
      registerGoToLogin(() => {
        setCurrentScreen('LOGIN');
      });
    }, [registerGoToLogin]),
  );

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
          })),
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
    } finally {
      setLoading(false);
    }
  };

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
    } finally {
      setLoading(false);
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

  return (
    <View style={styles.mapContainer}>
      <MapScreen visibleWashes={visibleWashes} onSheetIndexChange={setMapSheetIndex} />

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
  container: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center' },
  inner: { paddingHorizontal: 30 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#007AFF' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#666' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  pickerContainer: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  linkText: { textAlign: 'center', marginTop: 20, color: '#007AFF' },
});

export default HomeScreen;
