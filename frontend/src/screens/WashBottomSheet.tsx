import React, { forwardRef, useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useSavedShops } from '../navigation/SavedShopsContext';

/** -1 닫힘 · 0 절반 · 1 전체(지도 덮음) */
const SNAP_POINTS = ['50%', '100%'] as const;

const colors = {
  primary: '#5a58e9',
  text: '#0F172A',
  muted: '#64748B',
  tabMuted: '#94A3B8',
  panelBorder: 'rgba(148,163,184,0.35)',
  panel: '#ffffff',
  mapFallback: '#E2E8F0',
};

const STATUS_OPEN = '#16A34A';
const STATUS_DONGPA = '#DC2626';

const SHEET_MOCK = {
  closingLine: '22:00시에 영업 종료',
  distanceLine: '거리 2.3km · 이동 6분',
  rating: '4.8',
  waitLine: '약 15분 대기',
  navCta: '6분 거리 · 길 안내 시작',
  buildingNameMock: 'Sparkle Shine Tower 1F',
  fallbackAddress: '서울특별시 강남구 테헤란로 123',
  servicePrices: [
    { label: '자동 세차', icon: 'local-car-wash' as const, price: '₩8,000', iconBg: '#DBEAFE' },
    { label: '프리미엄 세차', icon: 'auto-awesome' as const, price: '₩15,000', iconBg: '#EDE9FE' },
  ],
  facilityInfoRows: [
    { key: 'hotwater' as const, label: '온수 세차 가능', icon: 'thermostat' as const, iconBg: '#EDE9FE' },
    { key: 'indoor' as const, label: '실내 베이 있음', icon: 'home' as const, iconBg: '#DBEAFE' },
    { key: 'ev' as const, label: 'EV 충전 가능', icon: 'bolt' as const, iconBg: '#E0E7FF' },
  ],
} as const;

const PEEK_FACILITY_CHIPS: readonly {
  key: 'hotwater' | 'indoor' | 'ev';
  label: string;
  icon: 'thermostat' | 'home' | 'bolt';
}[] = [
  { key: 'hotwater', label: 'Hot water', icon: 'thermostat' },
  { key: 'indoor', label: 'Indoor bay', icon: 'home' },
  { key: 'ev', label: 'EV charging', icon: 'bolt' },
];

function isTruthyFacilityFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    return t === 'true' || t === '1' || t === 'yes';
  }
  return false;
}

export type WashSheetWash = {
  id: number;
  name: string;
  address: string;
  status: string;
  hasHeatedWater?: boolean;
  hasIndoorBay?: boolean;
  hasEvCharging?: boolean;
} & Record<string, unknown>;

export type WashBottomSheetProps = {
  index: number;
  onChange: (index: number) => void;
  wash: WashSheetWash | null;
  onClosePress: () => void;
};

const WashBottomSheet = forwardRef<BottomSheet, WashBottomSheetProps>(
  function WashBottomSheet({ index, onChange, wash, onClosePress }, ref) {
    const insets = useSafeAreaInsets();
    const { isShopSaved, saveShop, removeSavedByShopId } = useSavedShops();
    const gesturesEnabled = index !== -1;
    /** 절반(0)일 때는 스크롤 끔 → 세로 드래그가 시트에 전달됨. 전체(1)만 스크롤 */
    const scrollEnabled = index === 1;
    const row = wash ?? ({} as WashSheetWash);
    const title = wash?.name ?? '세차장';
    const addressLine = (wash?.address && String(wash.address).trim()) || SHEET_MOCK.fallbackAddress;
    const isDongpa = wash?.status === '동파';
    const hot = isTruthyFacilityFlag(row.hasHeatedWater);
    const indoor =
      isTruthyFacilityFlag(row.hasIndoorBay) || isTruthyFacilityFlag(row.has_indoor_bay);
    const ev = isTruthyFacilityFlag(row.hasEvCharging) || isTruthyFacilityFlag(row.has_ev_charging);

    const saved = wash != null && isShopSaved(wash.id);
    const onBookmarkPress = useCallback(() => {
      if (!wash) return;
      if (isShopSaved(wash.id)) {
        removeSavedByShopId(wash.id);
      } else {
        saveShop({ id: wash.id, name: wash.name, status: wash.status });
      }
    }, [wash, isShopSaved, saveShop, removeSavedByShopId]);

    const onNavPress = () => Alert.alert('알림', '길 안내(목업)');

    return (
      <BottomSheet
        ref={ref}
        index={index}
        snapPoints={[...SNAP_POINTS]}
        topInset={insets.top}
        bottomInset={insets.bottom}
        enablePanDownToClose
        enableHandlePanningGesture={gesturesEnabled}
        enableContentPanningGesture={gesturesEnabled}
        onChange={onChange}
      >
        <BottomSheetScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
          bounces={scrollEnabled}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.headerTrailing}>
              {wash != null ? (
                <Pressable
                  onPress={onBookmarkPress}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityState={{ selected: saved }}
                  accessibilityLabel={saved ? '저장됨, 탭하여 저장 해제' : '저장 안 됨, 탭하여 저장'}
                >
                  <MaterialIcons
                    name={saved ? 'bookmark' : 'bookmark-border'}
                    size={26}
                    color={saved ? colors.primary : colors.muted}
                  />
                </Pressable>
              ) : null}
              <Pressable onPress={onClosePress} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
                <Text style={styles.closeBtn}>×</Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.peekStatus, { color: isDongpa ? STATUS_DONGPA : STATUS_OPEN }]}>
            {isDongpa ? '동파' : '영업 중'}
          </Text>
          <Text style={styles.address} numberOfLines={2}>
            {addressLine}
          </Text>
          <Text style={styles.statLine}>{SHEET_MOCK.closingLine}</Text>
          <Text style={styles.statLineMuted}>{SHEET_MOCK.distanceLine}</Text>
          <Text style={styles.ratingRow}>
            <Text style={styles.statLineMuted}>★ {SHEET_MOCK.rating} · </Text>
            <Text style={styles.waitAccent}>{SHEET_MOCK.waitLine}</Text>
          </Text>

          <View style={styles.peekChipRow}>
            {PEEK_FACILITY_CHIPS.map((c) => {
              const on =
                (c.key === 'hotwater' && hot) ||
                (c.key === 'indoor' && indoor) ||
                (c.key === 'ev' && ev);
              return (
                <View
                  key={c.key}
                  style={[
                    styles.peekChip,
                    on ? styles.peekChipOn : styles.peekChipOff,
                    { borderColor: on ? colors.primary : colors.panelBorder },
                  ]}
                >
                  <MaterialIcons
                    name={c.icon}
                    size={18}
                    color={on ? colors.primary : colors.tabMuted}
                  />
                  <Text
                    style={[styles.peekChipLabel, { color: on ? colors.primary : colors.tabMuted }]}
                    numberOfLines={2}
                  >
                    {c.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <Pressable
            style={[styles.navCta, styles.navCtaPeek, { backgroundColor: colors.primary }]}
            onPress={onNavPress}
          >
            <MaterialIcons name="navigation" size={20} color="#fff" />
            <Text style={styles.navCtaText}>{SHEET_MOCK.navCta}</Text>
          </Pressable>

          <Text style={[styles.peekHint, { color: colors.tabMuted }]}>
            {index === 1
              ? '아래로 내려 절반으로 · 닫으려면 X'
              : '위로 밀어 전체 보기 · 지도로는 X'}
          </Text>

          <Text style={styles.sectionTitle}>서비스 및 가격</Text>
          <View style={styles.priceRow}>
            {SHEET_MOCK.servicePrices.map((s) => (
              <View
                key={s.label}
                style={[styles.priceCard, { borderColor: colors.panelBorder, backgroundColor: colors.panel }]}
              >
                <View style={[styles.priceIcon, { backgroundColor: s.iconBg }]}>
                  <MaterialIcons name={s.icon} size={22} color={colors.primary} />
                </View>
                <Text style={styles.priceLabel}>{s.label}</Text>
                <Text style={styles.priceValue}>{s.price}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>시설 정보</Text>
          {SHEET_MOCK.facilityInfoRows.map((f) => {
            const on =
              (f.key === 'hotwater' && hot) ||
              (f.key === 'indoor' && indoor) ||
              (f.key === 'ev' && ev);
            return (
              <View key={f.key} style={[styles.facilityRow, { borderColor: colors.panelBorder }]}>
                <View style={[styles.facilityIcon, { backgroundColor: f.iconBg }]}>
                  <MaterialIcons name={f.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.facilityLabel}>{f.label}</Text>
                <Text style={[styles.facilityOn, { color: on ? colors.primary : colors.tabMuted }]}>
                  {on ? '가능' : '—'}
                </Text>
              </View>
            );
          })}

          <Text style={styles.sectionTitle}>위치</Text>
          <Text style={styles.locationAddress}>{addressLine}</Text>
          <Text style={styles.buildingLine}>{SHEET_MOCK.buildingNameMock}</Text>
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.mapFallback }]} />

          <Pressable
            style={[styles.navCta, styles.navCtaFooter, { backgroundColor: colors.primary }]}
            onPress={onNavPress}
          >
            <MaterialIcons name="navigation" size={20} color="#fff" />
            <Text style={styles.navCtaText}>{SHEET_MOCK.navCta}</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  headerTrailing: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeBtn: { fontSize: 26, lineHeight: 28, color: colors.muted },
  peekStatus: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  address: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: colors.muted, marginBottom: 10 },
  statLine: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  statLineMuted: { fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 },
  waitAccent: { color: colors.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  peekChipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  peekChip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  peekChipOn: { backgroundColor: 'rgba(90, 88, 233, 0.10)' },
  peekChipOff: { backgroundColor: '#ffffff' },
  peekChipLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  navCta: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navCtaPeek: { marginBottom: 8 },
  navCtaFooter: { marginTop: 16, marginBottom: 8 },
  navCtaText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  peekHint: { fontSize: 12, fontWeight: '600', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  priceRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  priceCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  priceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  priceValue: { fontSize: 16, fontWeight: '800', color: colors.primary },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.35)',
  },
  facilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  facilityOn: { fontSize: 13, fontWeight: '700' },
  locationAddress: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  buildingLine: { fontSize: 13, color: colors.muted, marginBottom: 8 },
  mapPlaceholder: { width: '100%', height: 120, borderRadius: 12 },
});

export default WashBottomSheet;
