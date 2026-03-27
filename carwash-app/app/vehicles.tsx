import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

type Vehicle = {
  id: string;
  nickname: string;
  type: string;
  plateMasked: string;
  isPrimary: boolean;
};

const VEHICLES: Vehicle[] = [
  { id: 'v1', nickname: '내 세단', type: 'Sedan', plateMasked: '12가 34**', isPrimary: true },
  { id: 'v2', nickname: '주말 SUV', type: 'SUV', plateMasked: '78나 56**', isPrimary: false },
];

export default function VehiclesScreen() {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const colors = {
    bg: isDark ? '#111121' : '#f6f6f8',
    panel: isDark ? '#111121' : '#ffffff',
    border: isDark ? 'rgba(148,163,184,0.30)' : 'rgba(148,163,184,0.35)',
    text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    primary: '#5a58e9',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>내 차량 관리</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {VEHICLES.map((v) => (
          <View key={v.id} style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.cardLeft}>
              <View style={[styles.carIconWrap, { backgroundColor: `${colors.primary}1A` }]}>
                <MaterialIcons name="directions-car" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.nick, { color: colors.text }]}>{v.nickname}</Text>
                <Text style={[styles.meta, { color: colors.muted }]}>
                  {v.type} · {v.plateMasked}
                </Text>
              </View>
            </View>

            {v.isPrimary ? (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>기본 차량</Text>
              </View>
            ) : null}
          </View>
        ))}

        <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/vehicle-edit')}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>차량 추가</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 52,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },

  content: { padding: 16, gap: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  carIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nick: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  primaryBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  primaryBadgeText: { color: '#15803D', fontSize: 11, fontWeight: '900' },

  addBtn: {
    marginTop: 8,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});

