import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SavedScreen() {
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
      <Text style={[styles.title, { color: colors.text }]}>저장한 세차장</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>나중에 다시 보기 좋은 곳을 모아둡니다. (샘플)</Text>

      {['EcoWash', 'QuickShine'].map((name) => (
        <Pressable
          key={name}
          onPress={() => router.push('/carwash-detail')}
          style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.border }]}
        >
          <View style={styles.row}>
            <MaterialIcons name="favorite" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{name}</Text>
          </View>
          <Text style={[styles.meta, { color: colors.muted }]}>탭해서 상세 정보 보기</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 10 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, fontWeight: '600' },
});

