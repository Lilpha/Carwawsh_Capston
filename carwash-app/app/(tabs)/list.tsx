import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';

type Carwash = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  tags: ('hotwater' | 'indoor' | 'ev' | 'card')[];
  busy: 'low' | 'medium' | 'high';
};

const CARWASHES: Carwash[] = [
  {
    id: 'ecowash',
    name: 'EcoWash',
    address: 'San Francisco, CA',
    distanceKm: 0.8,
    rating: 4.8,
    reviewCount: 124,
    tags: ['hotwater', 'card'],
    busy: 'medium',
  },
  {
    id: 'quickshine',
    name: 'QuickShine',
    address: 'San Francisco, CA',
    distanceKm: 1.4,
    rating: 4.6,
    reviewCount: 86,
    tags: ['indoor', 'ev', 'card'],
    busy: 'low',
  },
  {
    id: 'flashclean',
    name: 'FlashClean',
    address: 'San Francisco, CA',
    distanceKm: 2.1,
    rating: 4.4,
    reviewCount: 52,
    tags: ['hotwater', 'indoor'],
    busy: 'high',
  },
];

const TAGS: {
  key: Carwash['tags'][number];
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}[] = [
    { key: 'hotwater', label: 'Hot Water', icon: 'ac-unit' },
    { key: 'indoor', label: 'Indoor Bay', icon: 'home' },
    { key: 'ev', label: 'EV Charging', icon: 'bolt' },
    { key: 'card', label: 'Card Payment', icon: 'credit-card' },
  ];

export default function ExploreListScreen() {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<Carwash['tags'][number]>>(new Set(['hotwater']));

  const colors = useMemo(
    () => ({
      primary: '#5a58e9',
      bg: isDark ? '#111121' : '#f6f6f8',
      panel: isDark ? '#111121' : '#ffffff',
      panelBorder: isDark ? 'rgba(148,163,184,0.30)' : 'rgba(148,163,184,0.35)',
      text: isDark ? '#F1F5F9' : '#0F172A',
      muted: isDark ? '#94A3B8' : '#64748B',
      chipInactiveText: isDark ? '#E2E8F0' : '#334155',
      cardBg: isDark ? 'rgba(2,6,23,0.35)' : '#ffffff',
    }),
    [isDark]
  );

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tags = selectedTags;
    return CARWASHES.filter((c) => {
      const matchesQuery =
        q.length === 0 || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
      const matchesTags = tags.size === 0 || c.tags.some((t) => tags.has(t));
      return matchesQuery && matchesTags;
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [query, selectedTags]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>List View</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: colors.panel, borderColor: colors.panelBorder }]}>
          <MaterialIcons name="search" size={20} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search carwashes"
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          ) : (
            <MaterialIcons name="tune" size={20} color={colors.muted} />
          )}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.tagsRow}>
            {TAGS.map((t) => {
              const active = selectedTags.has(t.key);
              return (
                <Pressable
                  key={t.key}
                  onPress={() => {
                    setSelectedTags((prev) => {
                      const next = new Set(prev);
                      if (next.has(t.key)) next.delete(t.key);
                      else next.add(t.key);
                      return next;
                    });
                  }}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: active ? colors.primary : colors.panel,
                      borderColor: active ? 'transparent' : colors.panelBorder,
                    },
                  ]}
                >
                  <MaterialIcons name={t.icon} size={16} color={active ? '#fff' : colors.muted} />
                  <Text style={[styles.tagChipText, { color: active ? '#fff' : colors.chipInactiveText }]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push('/carwash-detail')}
            style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.panelBorder }]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
              <View
                style={[
                  styles.busyPill,
                  {
                    backgroundColor:
                      item.busy === 'low' ? '#DCFCE7' : item.busy === 'medium' ? '#DBEAFE' : '#FFE4E6',
                  },
                ]}
              >
                <Text style={styles.busyText}>
                  {item.busy === 'low' ? '여유' : item.busy === 'medium' ? '보통' : '혼잡'}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.address}</Text>
            <Text style={[styles.cardMeta, { color: colors.muted }]}>
              ⭐ {item.rating.toFixed(1)} (리뷰 {item.reviewCount}) · {item.distanceKm.toFixed(1)}km
            </Text>

            <View style={styles.badges}>
              {item.tags.map((t) => (
                <View key={t} style={[styles.badge, { borderColor: colors.panelBorder }]}>
                  <Text style={[styles.badgeText, { color: colors.muted }]}>
                    {t === 'hotwater'
                      ? '온수'
                      : t === 'indoor'
                        ? '실내'
                        : t === 'ev'
                          ? 'EV'
                          : '카드'}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>검색 결과가 없어요</Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>필터를 해제하거나 다른 키워드로 검색해보세요.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },

  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  search: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingBottom: 18, gap: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagChipText: { fontSize: 12, fontWeight: '700' },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardName: { fontSize: 16, fontWeight: '900' },
  cardMeta: { marginTop: 6, fontSize: 12, fontWeight: '600' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  busyPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  busyText: { fontSize: 11, fontWeight: '900', color: '#0F172A' },

  empty: { paddingTop: 30, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900' },
  emptyDesc: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});

