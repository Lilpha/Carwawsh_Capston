import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { openNavigationSelector } from '@/lib/navigation';

const SCREEN_H = Dimensions.get('window').height;

export type CarwashDetailData = {
  id: string;
  name: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  waitMinutes: number;
  address: string;
  openUntil: string;
  verified: boolean;
  latitude: number;
  longitude: number;
};

export const CARWASH_DETAIL_MOCKS: Record<string, CarwashDetailData> = {
  ecowash: {
    id: 'ecowash',
    name: 'EcoWash',
    subtitle: 'Premium detailing & eco-friendly wash',
    rating: 4.8,
    reviewCount: 1240,
    waitMinutes: 15,
    address: '123 Sparkle Ave, Gangnam-gu, Seoul',
    openUntil: 'Open until 10:00 PM',
    verified: true,
    latitude: 37.4979,
    longitude: 127.0276,
  },
  quickshine: {
    id: 'quickshine',
    name: 'QuickShine',
    subtitle: 'Fast lane express wash',
    rating: 4.6,
    reviewCount: 860,
    waitMinutes: 10,
    address: '88 Sunset Blvd, Seocho-gu, Seoul',
    openUntil: 'Open until 11:00 PM',
    verified: true,
    latitude: 37.4909,
    longitude: 127.0148,
  },
  flashclean: {
    id: 'flashclean',
    name: 'FlashClean',
    subtitle: 'Compact self-wash station',
    rating: 4.4,
    reviewCount: 520,
    waitMinutes: 20,
    address: '51 River Road, Songpa-gu, Seoul',
    openUntil: 'Open until 9:00 PM',
    verified: false,
    latitude: 37.5133,
    longitude: 127.1001,
  },
};

type Props = {
  washId: string;
  onClose: () => void;
};

const colors = {
  primary: '#5a58e9',
  sheetBg: '#ffffff',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  cardBg: '#F8FAFC',
};

export function CarwashDetailSheet({ washId, onClose }: Props) {
  const detail = CARWASH_DETAIL_MOCKS[washId] ?? CARWASH_DETAIL_MOCKS.ecowash;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_H)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const closeSheet = useCallback(() => {
    Animated.timing(sheetTranslateY, {
      toValue: SCREEN_H,
      duration: 240,
      useNativeDriver: true,
    }).start(() => onCloseRef.current());
  }, [sheetTranslateY]);

  useEffect(() => {
    sheetTranslateY.setValue(SCREEN_H);
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 56,
      friction: 11,
    }).start();
  }, [washId, sheetTranslateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          sheetTranslateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldClose = gesture.dy > 90 || (gesture.dy > 48 && gesture.vy > 1.1);
        if (shouldClose) {
          Animated.timing(sheetTranslateY, {
            toValue: SCREEN_H,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onCloseRef.current());
        } else {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          bounciness: 6,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={styles.dim} onPress={closeSheet} accessibilityLabel="닫기" />

      <View style={styles.sheetOverlay} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.sheetBg, transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.handleBarRow} {...panResponder.panHandlers}>
            <View style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: '#CBD5E1' }]} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              hitSlop={12}
              style={styles.closeBtn}
              onPress={closeSheet}
            >
              <MaterialIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>{detail.name}</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>{detail.subtitle}</Text>
              </View>
              {detail.verified ? (
                <View style={styles.verifiedBox}>
                  <MaterialIcons name="verified" size={28} color={colors.primary} />
                </View>
              ) : null}
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.statTitleRow}>
                  <MaterialIcons name="star" size={18} color="#F59E0B" />
                  <Text style={[styles.statMain, { color: colors.text }]}>{detail.rating.toFixed(1)}</Text>
                </View>
                <Text style={[styles.statCaption, { color: colors.muted }]}>
                  리뷰 {detail.reviewCount.toLocaleString()}건 (참고)
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}33` }]}>
                <View style={styles.statTitleRow}>
                  <MaterialIcons name="schedule" size={18} color={colors.primary} />
                  <Text style={[styles.statMain, { color: colors.primary }]}>~{detail.waitMinutes}분</Text>
                </View>
                <Text style={[styles.statCaption, { color: colors.primary }]}>예상 대기(참고)</Text>
              </View>
            </View>

            <View style={styles.actionCol}>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() =>
                  openNavigationSelector({
                    id: detail.id,
                    name: detail.name,
                    address: detail.address,
                    latitude: detail.latitude,
                    longitude: detail.longitude,
                  })
                }
              >
                <MaterialIcons name="near-me" size={22} color="#fff" />
                <Text style={styles.primaryBtnText}>길찾기 앱에서 열기</Text>
              </Pressable>
            </View>

            <View style={styles.footerRow}>
              <View style={[styles.locationIconWrap, { backgroundColor: colors.cardBg }]}>
                <MaterialIcons name="location-on" size={20} color={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.address, { color: colors.text }]}>{detail.address}</Text>
                <Text style={[styles.openInfo, { color: colors.muted }]}>{detail.openUntil}</Text>
              </View>
              <Pressable onPress={() => router.push({ pathname: '/carwash-info', params: { id: detail.id } })}>
                <Text style={[styles.detailsLink, { color: colors.primary }]}>상세 안내</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.40)',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  handleBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 12,
    position: 'relative',
  },
  handleArea: { height: 28, alignItems: 'center', justifyContent: 'center', flex: 1 },
  handle: { width: 48, height: 5, borderRadius: 999 },
  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 4,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 26, paddingTop: 2 },

  headerRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '900', lineHeight: 36, letterSpacing: -0.3 },
  subtitle: { marginTop: 4, fontSize: 12, fontWeight: '600' },
  verifiedBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90,88,233,0.12)',
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  statTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statMain: { fontSize: 24, fontWeight: '900', lineHeight: 24 },
  statCaption: { fontSize: 11, fontWeight: '700' },

  actionCol: { gap: 12, marginBottom: 18 },
  primaryBtn: {
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    shadowColor: '#5a58e9',
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  address: { fontSize: 14, fontWeight: '700' },
  openInfo: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  detailsLink: { fontSize: 13, fontWeight: '900' },
});
