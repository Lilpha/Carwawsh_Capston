import { useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CarwashDetailSheet } from '@/components/carwash-detail-sheet';
import { MAP_FACILITY_FILTER_OPTIONS, type MapFacilityFilterKey } from '@/lib/map-facility-filters';

type Marker = {
  id: string;
  name: string;
  color: string;
  top: string;
  left: string;
  faded?: boolean;
};

const MAP_IMAGE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC0YBS6GwMQ1YVPr-0Rvc_YDz551OWXpV-Hsk8_sHaaqZ9ZjZLgM6iqC3UTmcQ7vnLDYOWieV0_Qb8OZ4-ZRvhIkW3E2McGi0tWwuv3cn2xzRrZ_V622gbN6KZQFfthNA4fITPOels9dss7YTQ-fRQQ9YaebGrgVxHX_-TDPMvJE1K9N2lk7JgqYzbZWohgIkwj1Ho-eciB5kIZsG0ixHFV8tx3dTFPS-C-nXHw5AqmbfC4KTs7Qp6grkxcbca_X6pjm91mhLUZ3Ss";

const MARKERS: Marker[] = [
  { id: 'ecowash', name: 'EcoWash', color: '#10B981', top: '32%', left: '22%' },
  { id: 'quickshine', name: 'QuickShine', color: '#F59E0B', top: '48%', left: '62%' },
  { id: 'flashclean', name: 'FlashClean', color: '#F43F5E', top: '66%', left: '46%', faded: true },
];

export default function ExploreMapScreen() {
  const [selectedWashId, setSelectedWashId] = useState<string | null>(null);
  /** 선택된 시설 필터. 비어 있으면 “필터 미적용(전체)”로 두고, 데이터 연동 시 이 Set을 쿼리 조건으로 넘기면 됩니다. */
  const [selectedFacilityFilters, setSelectedFacilityFilters] = useState<Set<MapFacilityFilterKey>>(() => new Set());
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const colors = useMemo(
    () => ({
      primary: '#5a58e9',
      bg: isDark ? '#111121' : '#ffffff',
      panel: isDark ? '#111121' : '#ffffff',
      panelBorder: isDark ? 'rgba(148,163,184,0.30)' : 'rgba(148,163,184,0.35)',
      text: isDark ? '#F1F5F9' : '#0F172A',
      muted: isDark ? '#94A3B8' : '#64748B',
      tabMuted: isDark ? '#64748B' : '#94A3B8',
      mapFallback: isDark ? '#1F2937' : '#E2E8F0',
    }),
    [isDark]
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.root}>
        <View style={StyleSheet.absoluteFill}>
          <ImageBackground
            source={{ uri: MAP_IMAGE_URI }}
            resizeMode="cover"
            style={[styles.map, { backgroundColor: colors.mapFallback }]}
          />

          {MARKERS.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.markerWrap, { top: m.top as any, left: m.left as any }]}
              onPress={() => setSelectedWashId(m.id)}
              hitSlop={12}
            >
              <View style={styles.markerInner}>
                <View
                  style={[
                    styles.markerLabel,
                    {
                      backgroundColor: colors.panel,
                      borderColor: colors.panelBorder,
                      opacity: m.faded ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.markerLabelText, { color: colors.text }]}>{m.name}</Text>
                </View>
                <MaterialIcons name="location-on" size={40} color={m.color} style={styles.markerPin} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.searchOuter} pointerEvents="box-none">
            <Pressable
              onPress={() => router.push('/search')}
              style={[
                styles.search,
                { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
              ]}
            >
              <MaterialIcons name="search" size={22} color={colors.primary} style={styles.searchIcon} />
              <Text style={[styles.searchPlaceholder, { color: colors.muted }]}>세차장 이름·지역 검색</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            style={styles.filtersScroll}
          >
            {MAP_FACILITY_FILTER_OPTIONS.map((f) => {
              const active = selectedFacilityFilters.has(f.key);
              return (
                <Pressable
                  key={f.key}
                  onPress={() => {
                    setSelectedFacilityFilters((prev) => {
                      const next = new Set(prev);
                      if (next.has(f.key)) next.delete(f.key);
                      else next.add(f.key);
                      return next;
                    });
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.panel,
                      borderColor: active ? 'transparent' : colors.panelBorder,
                    },
                  ]}
                >
                  <MaterialIcons name={f.icon} size={18} color={active ? '#fff' : colors.muted} />
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.muted }]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.bottomOverlay} pointerEvents="box-none">
          <View style={styles.bottomActions}>
            <Pressable
              style={[
                styles.squareButton,
                { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
              ]}
            >
              <MaterialIcons name="layers" size={22} color={colors.primary} />
            </Pressable>

            <View style={styles.ctaRow}>
              <Pressable
                onPress={() => router.push('/(tabs)/list')}
                style={[
                  styles.cta,
                  { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
                ]}
              >
                <MaterialIcons name="list" size={20} color={colors.primary} />
                <Text style={[styles.ctaText, { color: colors.text }]}>목록 보기</Text>
              </Pressable>
              <Pressable style={[styles.cta, { backgroundColor: colors.primary, borderColor: 'transparent' }]}>
                <MaterialIcons name="near-me" size={20} color="#fff" />
                <Text style={[styles.ctaText, { color: '#fff' }]}>My Location</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {selectedWashId != null ? (
          <CarwashDetailSheet washId={selectedWashId} onClose={() => setSelectedWashId(null)} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  map: { flex: 1 },

  markerWrap: {
    position: 'absolute',
  },
  markerInner: { alignItems: 'center' },
  markerLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: '800',
  },
  markerPin: {
    textShadowColor: 'rgba(0,0,0,0.20)',
    textShadowRadius: 10,
  },

  topOverlay: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchOuter: { alignItems: 'center' },
  search: {
    width: '100%',
    maxWidth: 420,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
    }),
  },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },

  filtersScroll: {
    marginTop: 4,
  },
  filters: {
    paddingHorizontal: 2,
    gap: 10,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 5 },
    }),
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  bottomOverlay: {
    marginTop: 'auto',
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
    alignItems: 'flex-end',
  },
  squareButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 7 },
    }),
  },
  ctaRow: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    gap: 12,
  },
  cta: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 7 },
    }),
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

