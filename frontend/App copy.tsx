import React, { useEffect, useState } from 'react';
import { 
  SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Text, Alert, View, ActivityIndicator 
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker, Callout } from 'react-native-maps';

const App = () => {
  // --- 상태 관리 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 가입/로그인 여부
  const [loading, setLoading] = useState(false);
  const [washes, setWashes] = useState([]); // 세차장 데이터

  // 가입 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState('승용');

  // --- 세차장 데이터 불러오기 (Step 2 연동) ---
  const fetchWashes = async () => {
    try {
      const response = await fetch('http://10.0.2.2:3000/api/washes');
      const data = await response.json();
      setWashes(data);
    } catch (err) {
      console.error('지도 데이터 로딩 실패:', err);
    }
  };

  // --- 회원가입 로직 (Step 1 연동) ---
  const handleSignUp = async () => {
    if (!email || !password || !carNumber || !carType) {
      Alert.alert('알림', '모든 정보를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 1. Firebase Auth 가입
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid; 

      // 2. 우리 DB(PostgreSQL)에 회원정보 저장
      const response = await fetch('http://10.0.2.2:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uid,
          email: email,
          carNumber: carNumber,
          carType: carType 
        }),
      });

      if (response.ok) {
        Alert.alert('성공', `환영합니다, 태영 님! 춘천 세차장 지도로 이동합니다.`);
        await fetchWashes(); // 세차장 데이터 미리 땡겨오기
        setIsLoggedIn(true); // 지도 화면으로 전환
      } else {
        throw new Error('서버 저장 실패');
      }
    } catch (error: any) {
      Alert.alert('에러', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 1. 가입 전: 회원가입 화면 ---
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>Mapping - 춘천</Text>
          <Text style={styles.subtitle}>회원가입 및 차량 등록</Text>

          <TextInput style={styles.input} placeholder="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="차량 번호 (예: 12가 3456)" value={carNumber} onChangeText={setCarNumber} />

          <Text style={styles.label}>차종 선택</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={carType} onValueChange={(itemValue) => setCarType(itemValue)} style={styles.picker}>
              <Picker.Item label="일반 승용차" value="승용" />
              <Picker.Item label="SUV / 대형차" value="SUV" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>가입하고 지도 보기</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- 2. 가입 후: 지도 화면 (Step 3 통합 결과물) ---
  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.8813, 
          longitude: 127.7298,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {washes.map((wash: any) => (
          <Marker
            key={wash.id}
            coordinate={{ latitude: wash.latitude, longitude: wash.longitude }}
            pinColor={carType === 'SUV' ? 'orange' : 'blue'} // 차종에 따른 마커 색 변화 (매칭 UI 맛보기)
          >
            <Callout>
              <View style={{ width: 150, padding: 5 }}>
                <Text style={{ fontWeight: 'bold' }}>{wash.name}</Text>
                <Text style={{ fontSize: 11 }}>{wash.address}</Text>
                <Text style={{ color: 'blue', fontSize: 10, marginTop: 5 }}>[{wash.op_status}]</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      {/* 상단 안내 바 */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>📍 춘천시 세차장 125곳 매칭 완료 ({carType} 맞춤)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 가입 화면 스타일
  container: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center' },
  inner: { paddingHorizontal: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, color: '#333', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  pickerContainer: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#DDD' },
  picker: { height: 50, width: '100%' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  // 지도 화면 스타일
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },
  topBar: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.9)', padding: 15, borderRadius: 20, elevation: 5, alignItems: 'center' },
  topBarText: { fontWeight: 'bold', color: '#333' }
});

export default App;