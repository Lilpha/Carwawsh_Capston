import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useRoutePlan } from '../navigation/RoutePlanContext';
import { ROUTE_SLOT_LABELS, type RouteSlotKey } from '../lib/route-plan';

const colors = {
  primary: '#5a58e9',
  text: '#0F172A',
  muted: '#64748B',
  panel: '#ffffff',
  panelBorder: 'rgba(148,163,184,0.35)',
  statusBg: '#E8F5E9',
  statusText: '#27AE60',
  naver: '#03C75A',
  kakao: '#FEE500',
  kakaoText: '#191919',
};

const SLOTS: RouteSlotKey[] = ['origin', 'waypoint', 'destination'];

const PLACEHOLDERS: Record<RouteSlotKey, string> = {
  origin: '출발지 검색 (예: 춘천시청)',
  waypoint: '경유지 검색 (선택, 비워둘 수 있음)',
  destination: '목적지 검색 (예: 강원대)',
};

type RoutePlannerCardProps = {
  forceCollapsed?: boolean;
};

export default function RoutePlannerCard({ forceCollapsed = false }: RoutePlannerCardProps) {
  const {
    plan,
    expanded,
    setExpanded,
    statusMessage,
    searchResults,
    searching,
    activeSearchSlot,
    slotDrafts,
    setSlotDraft,
    clearSlot,
    searchKeyword,
    selectSearchResult,
    openNaver,
    openKakao,
  } = useRoutePlan();

  const isExpanded = !forceCollapsed && expanded;

  return (
    <View
      pointerEvents="auto"
      style={[
        styles.card,
        { backgroundColor: colors.panel, borderColor: colors.panelBorder, shadowColor: '#000' },
      ]}
    >
      <Pressable
        onPress={() => {
          if (!forceCollapsed) setExpanded(!expanded);
        }}
        style={styles.header}
        accessibilityRole="button"
      >
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>내비게이션 길찾기</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isExpanded
              ? '지도 마커 탭 → 출발·경유·목적 설정 · 출발·목적 필수'
              : '출발·목적을 지도에서 설정하세요'}
          </Text>
        </View>
        <MaterialIcons
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={28}
          color={colors.muted}
        />
      </Pressable>

      {isExpanded ? (
        <ScrollView
          style={styles.bodyScroll}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {statusMessage ? (
            <View style={[styles.statusBar, { backgroundColor: colors.statusBg }]}>
              <Text style={[styles.statusText, { color: colors.statusText }]} numberOfLines={2}>
                {statusMessage}
              </Text>
            </View>
          ) : null}

          {SLOTS.map((slot) => {
            const assigned = plan[slot];
            return (
              <View key={slot} style={styles.slotBlock}>
                <Text style={[styles.slotLabel, { color: colors.text }]}>{ROUTE_SLOT_LABELS[slot]}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.panelBorder, color: colors.text }]}
                    placeholder={PLACEHOLDERS[slot]}
                    placeholderTextColor={colors.muted}
                    value={slotDrafts[slot]}
                    onChangeText={(t) => setSlotDraft(slot, t)}
                    onSubmitEditing={() => searchKeyword(slot)}
                    returnKeyType="search"
                  />
                  <Pressable
                    style={[styles.searchBtn, { backgroundColor: colors.text }]}
                    onPress={() => searchKeyword(slot)}
                    disabled={searching}
                  >
                    {searching && activeSearchSlot === slot ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.searchBtnText}>검색</Text>
                    )}
                  </Pressable>
                  {assigned ? (
                    <Pressable
                      onPress={() => clearSlot(slot)}
                      hitSlop={8}
                      style={styles.clearBtn}
                      accessibilityLabel={`${ROUTE_SLOT_LABELS[slot]} 지우기`}
                    >
                      <MaterialIcons name="close" size={22} color={colors.muted} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}

          {searchResults.length > 0 && activeSearchSlot ? (
            <View style={styles.results}>
              {searchResults.map((r) => (
                <View
                  key={r.id}
                  style={[styles.resultItem, { borderColor: colors.panelBorder }]}
                >
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
                      {r.name}
                      {r.category ? ` · ${r.category}` : ''}
                    </Text>
                    {r.address ? (
                      <Text style={[styles.resultAddr, { color: colors.muted }]} numberOfLines={2}>
                        📍 {r.address}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={[styles.resultBtn, { backgroundColor: '#3498db' }]}
                    onPress={() => selectSearchResult(activeSearchSlot, r)}
                  >
                    <Text style={styles.resultBtnText}>{ROUTE_SLOT_LABELS[activeSearchSlot]}로 설정</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={[styles.execLabel, { color: colors.text }]}>내비게이션 실행</Text>
          <Pressable style={[styles.naverBtn, { backgroundColor: colors.naver }]} onPress={openNaver}>
            <Text style={styles.naverBtnText}>네이버 지도 앱으로 안내하기</Text>
          </Pressable>
          <Pressable style={[styles.kakaoBtn, { backgroundColor: colors.kakao }]} onPress={openKakao}>
            <Text style={[styles.kakaoBtnText, { color: colors.kakaoText }]}>카카오맵 앱으로 안내하기</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 420,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  bodyScroll: { maxHeight: 340, paddingHorizontal: 14, paddingBottom: 14 },
  statusBar: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  statusText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  slotBlock: { marginBottom: 10 },
  slotLabel: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    fontWeight: '500',
  },
  searchBtn: {
    minWidth: 56,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  clearBtn: { padding: 4 },
  results: { marginBottom: 12, gap: 8 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  resultInfo: { flex: 1, minWidth: 0 },
  resultName: { fontSize: 15, fontWeight: '800' },
  resultCat: { fontSize: 12, fontWeight: '500' },
  resultAddr: { fontSize: 12, marginTop: 4 },
  resultBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resultBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  execLabel: { fontSize: 15, fontWeight: '800', marginBottom: 8, marginTop: 4 },
  naverBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  naverBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  kakaoBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  kakaoBtnText: { fontSize: 15, fontWeight: '800' },
});
