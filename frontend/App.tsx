<<<<<<< HEAD
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './src/navigation/TabNavigator';
import ListScreen from './src/screens/ListScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  List: undefined; // 전체 화면으로 뜰 리스트 스크린 타입 추가
=======
import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Text, View, Alert, ActivityIndicator 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
// import MapView, { Marker, Callout } from 'react-native-maps';
import NaverMapView, { Marker } from "react-native-nmap";
// 우리가 만든 Supabase 설정 파일을 가져옵니다.
import { supabase } from './src/lib/supabase';
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(); // 모든 경고창 숨기기


// [TypeScript] 세차장 데이터의 '신분증' 같은 규격을 정의합니다.
interface Wash {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

const App = () => {
  // --- [상태 관리] ---
  const [currentScreen, setCurrentScreen] = useState('LOGIN'); // 현재 화면 (로그인/회원가입/지도)
  const [loading, setLoading] = useState(false);               // 로딩 애니메이션 상태
  const [washes, setWashes] = useState<Wash[]>([]);            // 지도에 뿌릴 세차장 리스트
  
  const [email, setEmail] = useState('');                      // 이메일 입력값
  const [password, setPassword] = useState('');                // 비밀번호 입력값
  const [carNumber, setCarNumber] = useState('');              // 차량 번호
  const [carType, setCarType] = useState('승용');               // 차량 종류 (기본값: 승용)

  // --- [데이터 로드] ---
  // Supabase의 'shops' 테이블에서 모든 세차장 정보를 가져옵니다.
  const loadWashes = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*'); 

      if (error) throw error;
      setWashes(data || []); // 받아온 데이터를 상태에 저장
    } catch (e: any) {
      console.error('데이터 로딩 에러:', e.message);
    }
  };

  // --- [로그인 로직] ---
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('알림', '정보를 입력해주세요.');
    setLoading(true);
    try {
      // Supabase Auth 서버에 이메일/비번 확인 요청
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 로그인 성공 시 세차장 데이터를 미리 불러오고 지도 화면으로 이동
      await loadWashes();
      setCurrentScreen('MAP');
    } catch (e: any) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인하세요.');
    } finally { setLoading(false); }
  };

  // --- [회원가입 로직] ---
  const handleSignUp = async () => {
    if (!email || !password || !carNumber) return Alert.alert('알림', '모든 정보를 입력해주세요.');
    setLoading(true);
    try {
      // 1. 계정 생성: Supabase 인증 서버에 유저 계정을 만듭니다.
      // -> 이 순간 DB 트리거가 발동하여 public.users 테이블에 기본 정보를 자동 생성합니다!
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // 2. 추가 정보 입력: 트리거가 이미 만든 행(row)을 찾아서 차량 번호와 차종을 업데이트합니다.
      const { error: updateError } = await supabase
        .from('users')
        .update({ car_number: carNumber, car_type: carType })
        .eq('id', data.user?.id); // 가입된 유저의 고유 ID와 일치하는 행을 찾음

      if (updateError) throw updateError;

      Alert.alert('성공', '회원가입 완료! 로그인을 진행해주세요.');
      setCurrentScreen('LOGIN');
    } catch (e: any) {
      Alert.alert('가입 에러', e.message);
    } finally { setLoading(false); }
  };

  // --- [로그아웃 로직] ---
  const handleLogout = async () => {
    await supabase.auth.signOut(); // 서버 세션 종료
    setCurrentScreen('LOGIN');     // 로그인 화면으로 튕겨냄
  };

  // --- [UI 렌더링 영역] ---

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

  // [C] 지도 화면 (최종 결과물)
  return (
    <View style={styles.mapContainer}>
      <NaverMapView
        style={styles.map}
        showsMyLocationButton={true} // 내 위치 버튼 활성화
        center={{ 
          latitude: 37.8813, 
          longitude: 127.7298, 
          zoom: 12 
        }}
      >
        {washes.map((wash: Wash) => (
          <Marker 
            key={wash.id} 
            coordinate={{ latitude: wash.latitude, longitude: wash.longitude }}
            caption={{ text: wash.name }} // 마커 밑에 이름 바로 표시
            onClick={() => Alert.alert(wash.name, wash.address)}
          />
        ))}
      </NaverMapView>
      
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
>>>>>>> 273e290 (fix: 네이버 지도 401 인증 오류 해결 및 SDK 버전 최적화)
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs">
        {/* 기존: 기본 하단 탭 (지도, 히스토리 등 포함) */}
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        {/* 신규: 탭에서 버튼을 누르면 위로 덮어씌워질 전체 화면 스택 */}
        <Stack.Screen 
          name="List" 
          component={ListScreen} 
          options={{ 
            headerShown: true, // 뒤로가기 버튼을 위해 헤더 표시
            title: '세차장 목록', 
            // modal 효과를 주고 싶다면 (IOS에서 위에서 아래로 올라옴):
            // presentation: 'modal' 
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}