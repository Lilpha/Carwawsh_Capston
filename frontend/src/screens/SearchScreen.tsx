/**
 * carwash-app/app/search.tsx 포팅 (Expo Router → React Navigation)
 * develop_log/navigation_guide.md 의 Stack 등록·navigate 패턴을 따릅니다.
 */
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type SearchItem = {
  id: 'ecowash' | 'quickshine' | 'flashclean' | 'elite';
  name: string;
  addressText: string;
  rating: number;
  status: 'open' | 'closed' | 'busy';
  priceRange: string;
  distanceMiles: number;
  image: string;
};

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'ecowash',
    name: 'Aqua Shine Pro',
    addressText: '123 Sunset Blvd',
    rating: 4.8,
    status: 'open',
    priceRange: '$25 - $60',
    distanceMiles: 0.8,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBaOPFxeNbLsrHNqBy7yZfCzhBhGu7O-5u8lgkwnAxjXz7dUyfSycfhsv5k89UbW9ZEMUFfC4F0HtpciX0ocGZHpIxjEfko7c1CgHI4tr_-sPMemX-Of4aLFuKfEelBTA_qil18Tmsn67Ms41Padk0Km484yTHphI0NzDyVcCBONiygSIt6T2OhGKy78QW4p2hcO_dHF7c-Zt4Vi4wPjInM3nGgkJsJ9zlhEYWbmFQd0o6esiF8x9_R4vKEm6AwcqfJnjTL63VWeiQ',
  },
  {
    id: 'elite',
    name: 'Elite Car Care',
    addressText: '45 Industrial Way',
    rating: 4.5,
    status: 'open',
    priceRange: '$35 - $85',
    distanceMiles: 1.2,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWs2YkOps0l1VUuH6q_AhADw0dFtURUYsAX-muQw1qZ9Yvup98Yrhsl4mD8rHV-r1P-UR4pGRArCwFtj8LtWZNL_Hi8pfpQtemAflMD0Cct06qN3JI9ZsNV1TlpBnWzuIJD82u256saK1PdAivtp7HAIHwEl0qwaf10R_ZwS-dvEuIJsdhrJUvMMwHUWzyft6h7VF-EQjLwHk7z-tn8b0MkOEvkAWMZkScbsgnNlfszOahnm_RZGe8ISAdotEeH_Umwq5aS2xn4Og',
  },
  {
    id: 'quickshine',
    name: 'Sparkle Drive-Thru',
    addressText: '890 Maple St',
    rating: 4.2,
    status: 'closed',
    priceRange: '$15 - $40',
    distanceMiles: 2.5,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAdnm0BZJCfyC2j3aUdtJ73FyA7fAjYIXNaoDYFX5U1XmszJwcTy76KMbNsSeASUnWRNut0GBoXylQUBpHNFgfy5eFaHZPdE1JjFHaXEfTkpzr5kQW-wWC89YsWL-SkNJFsEzvoZEDGvLTDoYLJ3qL4JR1tOIJenQ_2rRo8IVKBZnJ_qoLTHiZcD_Z5TZDTq9cs_061qqYrNUt3dfZt0xO3a5r3UCwMSpEaacM1CMO2dgB6TxC3sAljR7PaSoa9TXeNRvUDo7DBp78',
  },
  {
    id: 'flashclean',
    name: 'EcoClean Mobile',
    addressText: 'Service Area: Downtown',
    rating: 4.9,
    status: 'busy',
    priceRange: '$45 - $120',
    distanceMiles: 3.1,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCP83MtdVfYzLuEmd_DuyTh-VIfG9EybTnn55oHIMSClXWbwBmbLcKmOZoN1sYUzCILeFx-GOgO4LjiVq3BON7O2hWpeOgJ7hlXtOV4dOWF5iLzRXb26OPRexcVbmgaPbjwWzC_Il9rnE5G1KrnCKLCYy9uqjvU3LPxk9uwcmoYMx2Cr3KMAdmqLpp34SqqoXTXxvSvOeMBgba_q8AY9EyvHmQzdM5escuHqJONwUgqqFD7ohMSVzEiXR-PFhKgHCwwnrSusOC7GfU',
  },
];

const RECENT_SEARCHES = ['강남 손세차', '24시 자동세차', '셀프세차장', '분당 노터치'];

const RECENT_VISITS = [
  { id: 'v1', name: '워시존 하이테크 강남점', address: '서울특별시 강남구 테헤란로 123', date: '2023.11.24 조회' },
  { id: 'v2', name: '코엑스 주차장 B2', address: '서울특별시 강남구 봉은사로 524', date: '2023.11.22 조회' },
  { id: 'v3', name: '버블사인 역삼본점', address: '서울특별시 강남구 역삼로 45', date: '2023.11.18 조회' },
];

const POPULAR_NEARBY = [
  {
    id: 'p1',
    name: '프리미엄 세차 논현점',
    meta: '내 위치에서 1.2km',
    rating: 4.8,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBaOPFxeNbLsrHNqBy7yZfCzhBhGu7O-5u8lgkwnAxjXz7dUyfSycfhsv5k89UbW9ZEMUFfC4F0HtpciX0ocGZHpIxjEfko7c1CgHI4tr_-sPMemX-Of4aLFuKfEelBTA_qil18Tmsn67Ms41Padk0Km484yTHphI0NzDyVcCBONiygSIt6T2OhGKy78QW4p2hcO_dHF7c-Zt4Vi4wPjInM3nGgkJsJ9zlhEYWbmFQd0o6esiF8x9_R4vKEm6AwcqfJnjTL63VWeiQ',
  },
  {
    id: 'p2',
    name: '워시가드 압구정',
    meta: '내 위치에서 2.5km',
    rating: 4.6,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWs2YkOps0l1VUuH6q_AhADw0dFtURUYsAX-muQw1qZ9Yvup98Yrhsl4mD8rHV-r1P-UR4pGRArCwFtj8LtWZNL_Hi8pfpQtemAflMD0Cct06qN3JI9ZsNV1TlpBnWzuIJD82u256saK1PdAivtp7HAIHwEl0qwaf10R_ZwS-dvEuIJsdhrJUvMMwHUWzyft6h7VF-EQjLwHk7z-tn8b0MkOEvkAWMZkScbsgnNlfszOahnm_RZGe8ISAdotEeH_Umwq5aS2xn4Og',
  },
];

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const colors = {
    primary: '#5956E9',
    bg: isDark ? '#111121' : '#f6f6f8',
    surface: isDark ? '#0f172a' : '#ffffff',
    card: isDark ? '#1e293b' : '#ffffff',
    muted: isDark ? '#94a3b8' : '#64748b',
    text: isDark ? '#f1f5f9' : '#0f172a',
    border: isDark ? '#334155' : '#e2e8f0',
    inputBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEARCH_ITEMS.filter((item) => {
      if (q.length === 0) return true;
      return item.name.toLowerCase().includes(q) || item.addressText.toLowerCase().includes(q);
    });
  }, [query]);

  const isEmptyQuery = query.trim().length === 0;

  const onResultPress = (item: SearchItem) => {
    // 상세 스택(CarWashDetail) 연결 시 navigation.navigate('Detail', { id: item.id }) 로 교체
    Alert.alert('선택됨', `${item.name} (id: ${item.id})`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Search Car Wash</Text>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('MainTabs')}>
            <MaterialIcons name="map" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Pressable
            style={[styles.searchBar, { backgroundColor: colors.inputBg }]}
            onPress={() => searchInputRef.current?.focus()}
          >
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              ref={searchInputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="세차장 검색"
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')}>
                <MaterialIcons name="cancel" size={20} color={colors.muted} />
              </Pressable>
            ) : null}
          </Pressable>
        </View>
        {isEmptyQuery ? (
          <ScrollView contentContainerStyle={styles.recentContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitleK, { color: colors.text }]}>최근 검색어</Text>
              <Pressable>
                <Text style={[styles.sectionAction, { color: colors.muted }]}>전체 삭제</Text>
              </Pressable>
            </View>

            <View style={styles.recentTagWrap}>
              {RECENT_SEARCHES.map((s) => (
                <Pressable key={s} style={[styles.recentTag, { backgroundColor: colors.inputBg }]}>
                  <Text style={[styles.recentTagText, { color: colors.text }]}>{s}</Text>
                  <MaterialIcons name="close" size={14} color={colors.muted} />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionTitleK, { color: colors.text, marginTop: 8 }]}>최근에 본 곳</Text>
            {RECENT_VISITS.map((v, idx) => (
              <View
                key={v.id}
                style={[
                  styles.visitRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: idx === RECENT_VISITS.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <View style={[styles.visitIconWrap, { backgroundColor: colors.inputBg }]}>
                  <MaterialIcons name={idx === 1 ? 'location-on' : 'event'} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.visitName, { color: colors.text }]}>{v.name}</Text>
                  <Text style={[styles.visitAddr, { color: colors.muted }]}>{v.address}</Text>
                  <Text style={[styles.visitDate, { color: colors.muted }]}>{v.date}</Text>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitleK, { color: colors.text, marginTop: 10 }]}>내 주변 인기 세차장</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
              {POPULAR_NEARBY.map((p) => (
                <Pressable key={p.id} style={[styles.popularCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Image source={{ uri: p.image }} style={styles.popularThumb} />
                  <View style={styles.popularContent}>
                    <View style={styles.popularTop}>
                      <Text style={[styles.popularName, { color: colors.text }]} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <View style={styles.popularRating}>
                        <MaterialIcons name="star" size={12} color="#f59e0b" />
                        <Text style={[styles.popularRatingText, { color: colors.primary }]}>{p.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.popularMeta, { color: colors.muted }]}>{p.meta}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </ScrollView>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterRow}
            >
              <FilterChip text="거리" active icon />
              <FilterChip text="참고 가격대" icon />
              <FilterChip text="영업 중" />
              <FilterChip text="시설 유형" icon />
            </ScrollView>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={<Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Results</Text>}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onResultPress(item)}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: item.status === 'closed' ? 0.82 : 1 },
                  ]}
                >
                  <Image source={{ uri: item.image }} style={styles.thumb} />

                  <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View>
                      <View style={styles.cardTop}>
                        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                        <View style={styles.ratingWrap}>
                          <MaterialIcons name="star" size={12} color={colors.primary} />
                          <Text style={[styles.rating, { color: colors.primary }]}>{item.rating.toFixed(1)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.addr, { color: colors.muted }]}>
                        {item.addressText}, {item.distanceMiles.toFixed(1)} miles
                      </Text>
                    </View>

                    <View style={styles.cardBottom}>
                      <StatusBadge status={item.status} />
                      <Text style={[styles.price, { color: colors.primary }]}>참고 {item.priceRange}</Text>
                    </View>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>검색 결과가 없습니다.</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function FilterChip({ text, active, icon }: { text: string; active?: boolean; icon?: boolean }) {
  return (
    <View style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}>
      <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextInactive]}>{text}</Text>
      {icon ? (
        <MaterialIcons name="keyboard-arrow-down" size={14} color={active ? '#fff' : '#64748b'} />
      ) : null}
    </View>
  );
}

function StatusBadge({ status }: { status: 'open' | 'closed' | 'busy' }) {
  const cfg =
    status === 'open'
      ? { text: 'OPEN NOW', bg: '#DCFCE7', color: '#15803D' }
      : status === 'closed'
        ? { text: 'CLOSED', bg: '#FEE2E2', color: '#B91C1C' }
        : { text: 'BUSY', bg: '#FEF9C3', color: '#A16207' };

  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '900' },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

  filterScroll: { maxHeight: 48 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  filterChipActive: { backgroundColor: '#5956E9' },
  filterChipInactive: { backgroundColor: '#F1F5F9' },
  filterText: { fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  filterTextInactive: { color: '#475569' },

  recentContent: { paddingHorizontal: 16, paddingBottom: 20, gap: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitleK: { fontSize: 31, fontWeight: '900' },
  sectionAction: { fontSize: 12, fontWeight: '700' },
  recentTagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentTag: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recentTagText: { fontSize: 13, fontWeight: '700' },

  visitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12 },
  visitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitName: { fontSize: 15, fontWeight: '800' },
  visitAddr: { marginTop: 3, fontSize: 12, fontWeight: '600' },
  visitDate: { marginTop: 3, fontSize: 11, fontWeight: '600' },

  popularRow: { gap: 10, paddingBottom: 4 },
  popularCard: { width: 210, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  popularThumb: { width: '100%', height: 108, backgroundColor: '#E2E8F0' },
  popularContent: { padding: 10, gap: 6 },
  popularTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  popularName: { fontSize: 14, fontWeight: '800', flex: 1 },
  popularRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  popularRatingText: { fontSize: 12, fontWeight: '900' },
  popularMeta: { fontSize: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 25, fontWeight: '900', marginVertical: 8 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    gap: 12,
  },
  thumb: { width: 92, height: 92, borderRadius: 9, backgroundColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '800' },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 11, fontWeight: '800' },
  addr: { marginTop: 4, fontSize: 12, fontWeight: '500' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '900' },
  price: { fontSize: 20, fontWeight: '900' },
  empty: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
