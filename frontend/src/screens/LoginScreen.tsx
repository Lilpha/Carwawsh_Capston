import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View, Text, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';

// Theme colors matching HomeScreen
const colors = {
  primary: '#5a58e9',
  bg: '#ffffff',
  text: '#0F172A',
  muted: '#64748B',
};

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('알림', '정보를 입력해주세요.');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // 로그인 성공 시 탭 네비게이터(메인 화면)로 전환
      navigation.replace('MainTabs');
    } catch (e: any) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인하세요.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Mapping</Text>
        <Text style={styles.subtitle}>세차장 매칭 서비스</Text>
        <TextInput 
          style={styles.input} 
          placeholder="이메일" 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address"
        />
        <TextInput 
          style={styles.input} 
          placeholder="비밀번호" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>로그인</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: 32 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  button: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  linkText: { color: colors.primary, textAlign: 'center', fontSize: 14 },
});