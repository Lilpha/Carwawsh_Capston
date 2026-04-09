import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View, Text, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';

const colors = {
  primary: '#5a58e9',
  bg: '#ffffff',
  text: '#0F172A',
  muted: '#64748B',
};

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carType, setCarType] = useState('승용');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !carNumber) return Alert.alert('알림', '모든 정보를 입력해주세요.');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      
      if (data.user?.id) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ car_number: carNumber, car_type: carType })
          .eq('id', data.user.id);
          
        if (updateError) throw updateError;
      }
      
      Alert.alert('성공', '회원가입 완료! 로그인을 진행해주세요.');
      navigation.navigate('Login');
    } catch (e: any) {
      Alert.alert('가입 에러', e.message);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>회원가입</Text>
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
        <TextInput 
          style={styles.input} 
          placeholder="차량 번호" 
          value={carNumber} 
          onChangeText={setCarNumber} 
        />
        <View style={styles.pickerContainer}>
          <Picker selectedValue={carType} onValueChange={(v) => setCarType(v)}>
            <Picker.Item label="일반 승용차" value="승용" />
            <Picker.Item label="SUV / 대형차" value="SUV" />
          </Picker>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>가입 완료</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>이미 계정이 있나요? 로그인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: 32 },
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
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