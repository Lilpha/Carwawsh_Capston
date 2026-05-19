import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { MainTabParamList } from '../navigation/types';
import { useLoginRedirect } from '../navigation/LoginRedirectContext';
import { supabase } from '../lib/supabase';

const PRIMARY = '#5a58e9';
const AVATAR_BG = '#E8E6FC';

/** 목업 프로필 (당분간 고정) */
const PROFILE_MOCK = {
  initials: 'JD',
  name: '박시환',
  email: 'sihwan@carwash.app',
} as const;

export default function ProfileScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Profile'>>();
  const { requestGoToLogin } = useLoginRedirect();

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            // 부모 스택(App.tsx)의 네비게이션을 찾아서 로그인 화면으로 스택 리셋
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch {
            Alert.alert('오류', '로그아웃에 실패했습니다.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{PROFILE_MOCK.initials}</Text>
          </View>
          <Text style={styles.name}>{PROFILE_MOCK.name}</Text>
          <Text style={styles.email}>{PROFILE_MOCK.email}</Text>
        </View>

        <View style={styles.menu}>
          <View style={styles.menuRow}>
            <MaterialIcons name="directions-car" size={22} color={PRIMARY} />
            <Text style={styles.menuLabel}>내 차량 관리</Text>
            <MaterialIcons name="chevron-right" size={22} color="#CBD5E1" />
          </View>
          <View style={styles.menuDivider} />
          <View style={styles.menuRow}>
            <MaterialIcons name="mail-outline" size={22} color={PRIMARY} />
            <Text style={styles.menuLabel}>문의하기</Text>
            <MaterialIcons name="chevron-right" size={22} color="#CBD5E1" />
          </View>
          <View style={styles.menuDivider} />
          <Pressable
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
            onPress={confirmLogout}
            android_ripple={{ color: 'rgba(90,88,233,0.12)' }}
          >
            <MaterialIcons name="logout" size={22} color={PRIMARY} />
            <Text style={styles.menuLabel}>로그아웃</Text>
            <MaterialIcons name="chevron-right" size={22} color="#CBD5E1" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.45)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  profileBlock: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: AVATAR_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#312E81',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  email: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  menu: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  menuRowPressed: {
    backgroundColor: 'rgba(90,88,233,0.06)',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148,163,184,0.45)',
    marginLeft: 52,
  },
});
