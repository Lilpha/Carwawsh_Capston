import { Alert, Animated, ImageBackground, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { openNavigationSelector } from '@/lib/navigation';

type CarwashDetailData = {
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

const MAP_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCJt7ZbzMi0TYqwKqnMecchPnlsScePKVpYpfHKKKoEmkRcgNUmc72_G44iyuWicGkcPm736fGyxq8cZR8kpNKamnbljOLysrOn6F4Ah6VYMSyBx2caGill2s0PyRu51OI-PUO0murzW0RGrDJdYpDjDbwHzamPtLwKxTAF6n2p_mwJcvJ2Eb1JYNdTrhQ3RlzmfBKyyIoyQGhmcPZH4MJo3ZPoZlqRoumceZyWHhBbOFuYOQy0wq6waaM3YAuqylRLyMGY6HovqGQ';

const DETAIL_MOCKS: Record<string, CarwashDetailData> = {
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

export default function CarwashDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const colors = {
    primary: '#5a58e9',
    // Keep bottom-sheet tone bright and clean for this screen.
    sheetBg: '#ffffff',
    text: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    cardBg: '#F8FAFC',
  };

  const detail = DETAIL_MOCKS[id ?? 'ecowash'] ?? DETAIL_MOCKS.ecowash;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
    onPanResponderMove: (_, gesture) => {
      // Only allow downward drag from handle.
      if (gesture.dy > 0) {
        sheetTranslateY.setValue(gesture.dy);
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 90) {
        Animated.timing(sheetTranslateY, {
          toValue: 520,
          duration: 180,
          useNativeDriver: true,
        }).start(() => router.back());
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
  });

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: MAP_IMAGE_URI }} resizeMode="cover" style={styles.mapBackground}>
        <View style={styles.mapOverlay} />
        <View style={styles.markerWrap}>
          <View style={[styles.markerIconWrap, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="local-car-wash" size={28} color="#fff" />
          </View>
          <View style={[styles.markerTail, { backgroundColor: `${colors.primary}66` }]} />
        </View>
      </ImageBackground>

      <View style={styles.sheetOverlay}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.sheetBg, transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: '#CBD5E1' }]} />
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
                  {detail.reviewCount.toLocaleString()} Reviews
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}33` }]}>
                <View style={styles.statTitleRow}>
                  <MaterialIcons name="schedule" size={18} color={colors.primary} />
                  <Text style={[styles.statMain, { color: colors.primary }]}>~{detail.waitMinutes} min</Text>
                </View>
                <Text style={[styles.statCaption, { color: colors.primary }]}>Estimated Wait</Text>
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
                <MaterialIcons name="directions-car" size={22} color="#fff" />
                <Text style={styles.primaryBtnText}>Start Navigation</Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
                onPress={() => Alert.alert('준비중', '경유지 추가 기능은 다음 단계에서 연결합니다.')}
              >
                <MaterialIcons name="add-location-alt" size={20} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Add as Waypoint</Text>
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
                <Text style={[styles.detailsLink, { color: colors.primary }]}>Details</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapBackground: { flex: 1 },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.40)',
  },
  markerWrap: {
    position: 'absolute',
    top: '32%',
    left: '50%',
    alignItems: 'center',
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  markerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerTail: {
    width: 4,
    height: 14,
  },

  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
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
  handleArea: { height: 30, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 50, height: 6, borderRadius: 999 },
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
  secondaryBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '800' },

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
