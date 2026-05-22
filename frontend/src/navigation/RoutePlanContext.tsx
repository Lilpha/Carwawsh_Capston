import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { kakaoResultToRoutePlace, searchKakaoPlaces, type KakaoPlaceResult } from '../lib/kakao-places';
import { openKakaoRoute, openNaverRoute, openRouteAppSelector } from '../lib/navigation';
import {
  canNavigate,
  EMPTY_ROUTE_PLAN,
  formatRoutePlaceLabel,
  ROUTE_SLOT_LABELS,
  type RoutePlan,
  type RoutePlanPlace,
  type RouteSlotKey,
} from '../lib/route-plan';

type SlotDrafts = Record<RouteSlotKey, string>;

const EMPTY_DRAFTS: SlotDrafts = { origin: '', waypoint: '', destination: '' };

type MarkerAssignDialogState = {
  place: RoutePlanPlace;
  detailLines: string[];
};

const dialogColors = {
  text: '#0F172A',
  muted: '#64748B',
  action: '#27AE60',
  panel: '#ffffff',
};

type RoutePlanContextValue = {
  plan: RoutePlan;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  forceCollapsed: boolean;
  setForceCollapsed: (v: boolean) => void;
  statusMessage: string | null;
  searchResults: KakaoPlaceResult[];
  searching: boolean;
  activeSearchSlot: RouteSlotKey | null;
  slotDrafts: SlotDrafts;
  setSlotDraft: (slot: RouteSlotKey, text: string) => void;
  assignPlace: (slot: RouteSlotKey, place: RoutePlanPlace) => void;
  clearSlot: (slot: RouteSlotKey) => void;
  searchKeyword: (slot: RouteSlotKey) => Promise<void>;
  selectSearchResult: (slot: RouteSlotKey, result: KakaoPlaceResult) => void;
  clearSearchResults: () => void;
  showMarkerAssignDialog: (place: RoutePlanPlace, detailLines?: string[]) => void;
  startRouteGuidance: (place?: RoutePlanPlace) => void;
  openNaver: () => void;
  openKakao: () => void;
  /** 상단 검색 바 → 내비 카드 펼침 + 안내 (Search 화면 이동 없음) */
  openRouteSearchEntry: () => void;
};

const RoutePlanContext = createContext<RoutePlanContextValue | null>(null);

export function RoutePlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<RoutePlan>(EMPTY_ROUTE_PLAN);
  const [expandedState, setExpandedState] = useState(false);
  const [forceCollapsed, setForceCollapsed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<KakaoPlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeSearchSlot, setActiveSearchSlot] = useState<RouteSlotKey | null>(null);
  const [slotDrafts, setSlotDrafts] = useState<SlotDrafts>(EMPTY_DRAFTS);
  const [markerAssignDialog, setMarkerAssignDialog] = useState<MarkerAssignDialogState | null>(
    null,
  );

  const expanded = forceCollapsed ? false : expandedState;

  const closeMarkerAssignDialog = useCallback(() => {
    setMarkerAssignDialog(null);
  }, []);

  const setExpanded = useCallback((v: boolean) => {
    if (!forceCollapsed) setExpandedState(v);
  }, [forceCollapsed]);

  const setSlotDraft = useCallback((slot: RouteSlotKey, text: string) => {
    setSlotDrafts((prev) => ({ ...prev, [slot]: text }));
  }, []);

  const assignPlace = useCallback((slot: RouteSlotKey, place: RoutePlanPlace) => {
    setPlan((prev) => ({ ...prev, [slot]: place }));
    setSlotDrafts((prev) => ({ ...prev, [slot]: formatRoutePlaceLabel(place) }));
    setStatusMessage(`✔ ${place.name} (${ROUTE_SLOT_LABELS[slot]}) 설정 완료!`);
    setSearchResults([]);
    setActiveSearchSlot(null);
    setMarkerAssignDialog(null);
  }, []);

  const clearSlot = useCallback((slot: RouteSlotKey) => {
    setPlan((prev) => ({ ...prev, [slot]: null }));
    setSlotDrafts((prev) => ({ ...prev, [slot]: '' }));
    setStatusMessage(null);
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setActiveSearchSlot(null);
  }, []);

  const searchKeyword = useCallback(
    async (slot: RouteSlotKey) => {
      const keyword = slotDrafts[slot].trim();
      if (!keyword) {
        Alert.alert('알림', `${ROUTE_SLOT_LABELS[slot]} 검색어를 입력해주세요!`);
        return;
      }
      setActiveSearchSlot(slot);
      setSearching(true);
      setStatusMessage(`'${keyword}' (${ROUTE_SLOT_LABELS[slot]}) 검색 중… 결과에서 선택해주세요.`);
      try {
        const results = await searchKakaoPlaces(keyword);
        setSearchResults(results);
        if (results.length === 0) {
          Alert.alert('알림', '검색 결과가 없습니다.');
          setStatusMessage(null);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        Alert.alert('검색 실패', msg);
        setStatusMessage(null);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [slotDrafts],
  );

  const selectSearchResult = useCallback(
    (slot: RouteSlotKey, result: KakaoPlaceResult) => {
      assignPlace(slot, kakaoResultToRoutePlace(result));
    },
    [assignPlace],
  );

  const showMarkerAssignDialog = useCallback(
    (place: RoutePlanPlace, detailLines?: string[]) => {
      setMarkerAssignDialog({
        place,
        detailLines: detailLines?.filter(Boolean) ?? [],
      });
    },
    [],
  );

  const startRouteGuidance = useCallback(
    (place?: RoutePlanPlace) => {
      if (canNavigate(plan)) {
        openRouteAppSelector(plan);
        return;
      }

      const msg = place
        ? '출발지와 목적지를 모두 지정해야 합니다. 먼저 다른 장소를 「출발」로 설정하거나, 이곳을 출발로 설정한 뒤 목적지를 지정해 주세요.'
        : '출발지와 목적지를 모두 지정해 주세요.';

      if (!place) {
        Alert.alert('알림', msg);
        return;
      }

      Alert.alert('알림', msg, [
        { text: '이곳을 출발로', onPress: () => assignPlace('origin', place) },
        { text: '이곳을 목적지로', onPress: () => assignPlace('destination', place) },
        { text: '닫기', style: 'cancel' },
      ]);
    },
    [plan, assignPlace],
  );

  const openNaver = useCallback(() => openNaverRoute(plan), [plan]);
  const openKakao = useCallback(() => openKakaoRoute(plan), [plan]);

  const openRouteSearchEntry = useCallback(() => {
    if (forceCollapsed) {
      Alert.alert(
        '안내',
        '세차장 정보를 닫으면 아래에서 출발·목적지를 검색할 수 있습니다.',
      );
      return;
    }
    setExpandedState(true);
    setStatusMessage('출발·목적지는 아래에서 검색하세요. 세차장은 지도 마커를 눌러주세요.');
    setSearchResults([]);
    setActiveSearchSlot('destination');
  }, [forceCollapsed]);

  const value = useMemo(
    () => ({
      plan,
      expanded,
      setExpanded,
      forceCollapsed,
      setForceCollapsed,
      statusMessage,
      searchResults,
      searching,
      activeSearchSlot,
      slotDrafts,
      setSlotDraft,
      assignPlace,
      clearSlot,
      searchKeyword,
      selectSearchResult,
      clearSearchResults,
      showMarkerAssignDialog,
      startRouteGuidance,
      openNaver,
      openKakao,
      openRouteSearchEntry,
    }),
    [
      plan,
      expanded,
      setExpanded,
      forceCollapsed,
      statusMessage,
      searchResults,
      searching,
      activeSearchSlot,
      slotDrafts,
      setSlotDraft,
      assignPlace,
      clearSlot,
      searchKeyword,
      selectSearchResult,
      clearSearchResults,
      showMarkerAssignDialog,
      startRouteGuidance,
      openNaver,
      openKakao,
      openRouteSearchEntry,
    ],
  );

  return (
    <RoutePlanContext.Provider value={value}>
      {children}
      <Modal
        animationType="fade"
        transparent
        visible={markerAssignDialog != null}
        onRequestClose={closeMarkerAssignDialog}
      >
        {markerAssignDialog ? (
          <View style={markerDialogStyles.overlay}>
            <Pressable
              style={markerDialogStyles.backdrop}
              onPress={closeMarkerAssignDialog}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            />
            <View style={markerDialogStyles.card}>
              <View style={markerDialogStyles.headerRow}>
                <Text style={markerDialogStyles.title} numberOfLines={2}>
                  {markerAssignDialog.place.name}
                </Text>
                <Pressable
                  onPress={closeMarkerAssignDialog}
                  hitSlop={12}
                  style={markerDialogStyles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="닫기"
                >
                  <MaterialIcons name="close" size={24} color={dialogColors.muted} />
                </Pressable>
              </View>
              {markerAssignDialog.detailLines.length > 0 ? (
                <View style={markerDialogStyles.body}>
                  {markerAssignDialog.detailLines.map((line) => (
                    <Text key={line} style={markerDialogStyles.bodyLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={markerDialogStyles.actionsRow}>
                <Pressable
                  onPress={() => assignPlace('destination', markerAssignDialog.place)}
                  style={markerDialogStyles.actionBtn}
                >
                  <Text style={markerDialogStyles.actionText}>목적지</Text>
                </Pressable>
                <Pressable
                  onPress={() => assignPlace('waypoint', markerAssignDialog.place)}
                  style={markerDialogStyles.actionBtn}
                >
                  <Text style={markerDialogStyles.actionText}>경유지</Text>
                </Pressable>
                <Pressable
                  onPress={() => assignPlace('origin', markerAssignDialog.place)}
                  style={markerDialogStyles.actionBtn}
                >
                  <Text style={markerDialogStyles.actionText}>출발지</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </RoutePlanContext.Provider>
  );
}

const markerDialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: dialogColors.panel,
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: dialogColors.text,
  },
  closeBtn: {
    padding: 2,
  },
  body: {
    marginBottom: 16,
    gap: 4,
  },
  bodyLine: {
    fontSize: 14,
    color: dialogColors.text,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: dialogColors.action,
  },
});

export function useRoutePlan(): RoutePlanContextValue {
  const ctx = useContext(RoutePlanContext);
  if (!ctx) throw new Error('useRoutePlan must be used within RoutePlanProvider');
  return ctx;
}
