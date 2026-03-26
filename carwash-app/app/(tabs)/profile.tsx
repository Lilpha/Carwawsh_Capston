import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const colors = {
    bg: isDark ? '#111121' : '#f6f6f8',
    panel: isDark ? '#111121' : '#ffffff',
    border: isDark ? 'rgba(148,163,184,0.30)' : 'rgba(148,163,184,0.35)',
    text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    primary: '#5a58e9',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.profileCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>S</Text>
        </View>
        <View>
          <Text style={[styles.name, { color: colors.text }]}>시환님</Text>
          <Text style={[styles.email, { color: colors.muted }]}>sihwan@carwash.app</Text>
        </View>
      </View>

      {[
        { label: '내 차량 관리', icon: 'directions-car' },
        { label: '알림 설정', icon: 'notifications' },
        { label: '문의하기', icon: 'support-agent' },
      ].map((item) => (
        <Pressable
          key={item.label}
          onPress={() => {
            if (item.label === '내 차량 관리') {
              router.push('/vehicles');
            }
          }}
          style={[styles.menuCard, { backgroundColor: colors.panel, borderColor: colors.border }]}
        >
          <View style={styles.row}>
            <MaterialIcons name={item.icon as any} size={18} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>{item.label}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 10 },
  profileCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#5a58e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900' },
  name: { fontSize: 16, fontWeight: '900' },
  email: { fontSize: 12, fontWeight: '600' },
  menuCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuText: { fontSize: 14, fontWeight: '700' },
});

