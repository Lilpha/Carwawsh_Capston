import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View, Text, ActivityIndicator, Alert, Modal, ScrollView, Platform } from 'react-native';
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

  // 약관 동의 상태
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);   // (필수) 서비스 이용약관
  const [agreePrivacy, setAgreePrivacy] = useState(false); // (필수) 개인정보 처리방침
  const [agreeMarketing, setAgreeMarketing] = useState(false); // (선택) 마케팅 수신 동의

  // 약관 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  const TERMS_CONTENT = {
    service: `[서비스 이용약관]
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tempor a velit ac aliquet. Donec sit amet purus non sem euismod iaculis et in nisi. Nulla tristique rhoncus convallis. Morbi ut nulla vel lacus molestie facilisis. Nullam congue vestibulum ante, at iaculis sem varius eu. Duis commodo commodo velit, et facilisis lacus congue a. Proin aliquet commodo mi vitae egestas. Pellentesque sed ultrices sem.

Sed tristique velit sit amet odio suscipit tincidunt. Duis congue urna eget felis vulputate, eget ullamcorper purus condimentum. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nulla risus neque, tempor ac ex eu, porta tempor dolor. Etiam odio velit, laoreet lobortis maximus sed, facilisis ac orci. Aliquam erat volutpat. Pellentesque ut lorem eu neque porta viverra. In bibendum commodo fermentum. Morbi neque quam, tempor sit amet luctus volutpat, commodo nec ligula.`,
    privacy: `[개인정보 수집 및 이용 동의]
Aliquam convallis nulla nulla, at egestas arcu placerat eu. Suspendisse vitae pharetra erat. Duis ex nisi, tincidunt eget interdum eu, scelerisque id mauris. Fusce rutrum odio ac lacus consectetur, in consectetur massa efficitur. In vel diam a ante maximus posuere ac sit amet diam. Ut ornare feugiat dui, sit amet sodales tortor convallis in. Suspendisse tempus orci ac lobortis faucibus. Aenean at magna id diam egestas condimentum sed ut metus. Vivamus eros risus, pretium quis ipsum non, posuere placerat nisl. Nam mauris mi, ultrices eget consectetur at, auctor sed felis. Donec eu aliquam augue.`
  };

  const openTermsModal = (type: 'service' | 'privacy') => {
    if (type === 'service') {
      setModalTitle('서비스 이용약관');
      setModalContent(TERMS_CONTENT.service);
    } else if (type === 'privacy') {
      setModalTitle('개인정보 수집 및 이용 동의');
      setModalContent(TERMS_CONTENT.privacy);
    }
    setModalVisible(true);
  };

  // 전체 동의 핸들러
  const handleAgreeAll = () => {
    const newValue = !agreeAll;
    setAgreeAll(newValue);
    setAgreeTerms(newValue);
    setAgreePrivacy(newValue);
    setAgreeMarketing(newValue);
  };

  // 개별 동의 상태가 변할 때 전체 동의 상태 업데이트
  useEffect(() => {
    if (agreeTerms && agreePrivacy && agreeMarketing) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeTerms, agreePrivacy, agreeMarketing]);

  const handleSignUp = async () => {
    if (!email || !password || !carNumber) return Alert.alert('알림', '모든 정보를 입력해주세요.');
    if (!agreeTerms || !agreePrivacy) return Alert.alert('알림', '필수 약관에 동의해주세요.');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            car_number: carNumber,
            car_type: carType,
            marketing_agreed: agreeMarketing,
          },
        },
      });
      if (signUpError) throw signUpError;
      
      if (data.user?.id) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            car_number: carNumber, 
            car_type: carType,
            marketing_agreed: agreeMarketing
          })
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
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
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

        {/* 약관 동의 영역 */}
        <View style={styles.termsContainer}>
          <TouchableOpacity style={styles.termRowAll} onPress={handleAgreeAll}>
            <View style={[styles.checkbox, agreeAll && styles.checkboxActive]} />
            <Text style={styles.termTextAll}>약관 전체동의</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />

          <View style={styles.termRow}>
            <TouchableOpacity style={styles.termCheckArea} onPress={() => setAgreeTerms(!agreeTerms)}>
              <View style={[styles.checkboxSmall, agreeTerms && styles.checkboxActive]} />
              <Text style={styles.termText}>[필수] 서비스 이용약관 동의</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openTermsModal('service')}>
              <Text style={styles.termDetailLink}>보기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termRow}>
            <TouchableOpacity style={styles.termCheckArea} onPress={() => setAgreePrivacy(!agreePrivacy)}>
              <View style={[styles.checkboxSmall, agreePrivacy && styles.checkboxActive]} />
              <Text style={styles.termText}>[필수] 개인정보 수집 및 이용 동의</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openTermsModal('privacy')}>
              <Text style={styles.termDetailLink}>보기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termRow}>
            <TouchableOpacity style={styles.termCheckArea} onPress={() => setAgreeMarketing(!agreeMarketing)}>
              <View style={[styles.checkboxSmall, agreeMarketing && styles.checkboxActive]} />
              <Text style={styles.termText}>[선택] 혜택 및 마케팅 알림 수신 동의</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, (!agreeTerms || !agreePrivacy) && styles.buttonDisabled]} 
          onPress={handleSignUp}
          disabled={!agreeTerms || !agreePrivacy}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>가입 완료</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>이미 계정이 있나요? 로그인</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 약관 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalContentText}>{modalContent}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
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
  buttonDisabled: { backgroundColor: '#ccc' },
  linkText: { color: colors.primary, textAlign: 'center', fontSize: 14 },
  
  // 약관 동의 영역 스타일
  termsContainer: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termRowAll: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  termTextAll: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  termCheckArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  termDetailLink: {
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  checkboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 5 },
    }),
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalScrollView: {
    padding: 20,
  },
  modalContentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    padding: 15,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});