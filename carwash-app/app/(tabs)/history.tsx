import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HistoryScreen() {
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
      <Text style={[styles.title, { color: colors.text }]}>최근 조회</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        앱에서 상세 화면을 열어본 기록입니다. (샘플 데이터)
      </Text>

      {[
        { name: 'EcoWash', date: '오늘 14:20' },
        { name: 'QuickShine', date: '어제 09:40' },
        { name: 'FlashClean', date: '3일 전 18:10' },
      ].map((item) => (
        <View key={`${item.name}-${item.date}`} style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.badge, { color: colors.primary }]}>열람</Text>
          </View>
          <View style={styles.row}>
            <MaterialIcons name="schedule" size={14} color={colors.muted} />
            <Text style={[styles.meta, { color: colors.muted }]}>{item.date}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 10 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, fontWeight: '600' },
  badge: { fontSize: 12, fontWeight: '900' },
});

