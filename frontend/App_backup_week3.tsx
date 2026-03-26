import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Text, View, Alert, ActivityIndicator 
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker, Callout } from 'react-native-maps';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('LOGIN'); // LOGIN, SIGNUP, MAP
  const [loading, setLoading] = useState(false);
  const [washes, setWashes] = useState([]);
  
  // 가입/로그인용 공통 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState('승용');

  // 세차장 데이터 로드 함수
  const loadWashes = async () => {
    try {
      const response = await fetch('http://10.0.2.2:3000/api/washes');
      const data = await response.json();
      setWashes(data);
    } catch (e) {
      console.error('데이터 로딩 에러:', e);
    }
  };

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
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.8813, longitude: 127.7298,
          latitudeDelta: 0.08, longitudeDelta: 0.08,
        }}
      >
        {washes.map((wash: any) => (
          <Marker key={wash.id} coordinate={{ latitude: wash.latitude, longitude: wash.longitude }}>
            <Callout>
              <View style={{ padding: 5 }}>
                <Text style={{ fontWeight: 'bold' }}>{wash.name}</Text>
                <Text style={{ fontSize: 10 }}>{wash.address}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <TouchableOpacity style={styles.logoutBtn} onPress={() => { auth().signOut(); setCurrentScreen('LOGIN'); }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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