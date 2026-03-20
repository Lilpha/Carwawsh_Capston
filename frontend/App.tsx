import React, { useState } from 'react';
import { 
  SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Text, Alert, View 
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker'; // [추가] 피커 라이브러리 임포트

const App = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState('승용'); // 기본값을 '승용'으로 설정

  const handleSignUp = async () => {
    if (!email || !password || !carNumber || !carType) {
      Alert.alert('알림', '모든 정보를 입력해주세요.');
      return;
    }

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid; 

      const response = await fetch('http://10.0.2.2:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uid,
          email: email,
          carNumber: carNumber,
          carType: carType // 선택된 값이 서버로 전송됩니다.
        }),
      });

      if (response.ok) {
        Alert.alert('성공', `회원가입 완료!\n차종: ${carType}`);
        setEmail(''); setPassword(''); setCarNumber('');
      } else {
        throw new Error('서버 저장 실패');
      }
    } catch (error: any) {
      Alert.alert('에러', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Mapping - 세차장 매칭</Text>
        <Text style={styles.subtitle}>Step 1: 회원가입 및 차량 등록</Text>

        <TextInput
          style={styles.input}
          placeholder="이메일 (test@test.com)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="차량 번호 (예: 12가 3456)"
          value={carNumber}
          onChangeText={setCarNumber}
          autoCorrect={false}
          spellCheck={false}
        />

        {/* [수정] 차종 선택 Select Box (Picker) */}
        <Text style={styles.label}>차종 선택</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={carType}
            onValueChange={(itemValue) => setCarType(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="일반 승용차" value="승용" />
            <Picker.Item label="SUV / 대형차" value="SUV" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>가입하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center' },
  inner: { paddingHorizontal: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, color: '#333', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#DDD' },
  // 피커 전용 스타일
  pickerContainer: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#DDD', overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default App;