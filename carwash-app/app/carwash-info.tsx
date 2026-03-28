import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { openNavigationSelector } from '@/lib/navigation';

type CarwashInfo = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  subtitle: string;
  rating: number;
  reviewText: string;
  distanceText: string;
  waitText: string;
  priceFrom: string;
  durationText: string;
  openText: string;
};

const HEADER_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBvb3WgQc0rprpnyiGaORlm2bzFr00VIC1TnYSNbHTu_Sb6alRTQoauGab6m47lT9IcUJnGOKiY0I-_1o2r1gF6vd1IATq3hzFkw2rKdMvBXs5_GEoQnTfrulosIAwJoHC4SVJcGHelFJTLIMjG0wpoFkxNnx_RtCT8TqdRLtHET6RDZxRxQNbabdCrwvaNAgAQX1XGW0CQhu_e7uvO1wBCUSepr8yNH4pg6EOHdxKfhRP4kE-FQGmUL_smNGv1CMyWpff1WmymUrs';

const MINI_MAP_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBcoheelZo6jzNu8LM8tp9vprsEUcBW0nWa6q3kt7DHGa-WGXAaeyz8B8np6QXTOyupTlyG899YqrNI3C9t0WXK3HwTWWueaVmqQeNkln6ZG9dx6B6RGo2oOzKMt239qHb-PNRiwxCNWTBvcSn0pnYE6Fm35r63C3CV93ro3OH4JypxM7XwKgaK7o8L2Pfi0zx-Vv11ZS-3i7b8WQYlXnHis8QQGf_92XyOUsKTVcCTiI05GI3i700GiA6zeyLONmLmmwuS0bYG7dU';

const INFO_MOCKS: Record<string, CarwashInfo> = {
  ecowash: {
    id: 'ecowash',
    name: 'Sparkle Clean Auto Spa',
    address: '123 Main St, Springfield, IL',
    latitude: 37.4979,
    longitude: 127.0276,
    subtitle: 'Fast & premium touchless wash',
    rating: 4.8,
    reviewText: '(2.4k reviews)',
    distanceText: '1.2 miles away',
    waitText: '15 mins',
    priceFrom: '$12.00',
    durationText: '~10 mins',
    openText: 'OPEN',
  },
  quickshine: {
    id: 'quickshine',
    name: 'QuickShine Auto Wash',
    address: '88 Sunset Blvd, Springfield, IL',
    latitude: 37.4909,
    longitude: 127.0148,
    subtitle: 'Fast lane express wash',
    rating: 4.6,
    reviewText: '(1.1k reviews)',
    distanceText: '0.9 miles away',
    waitText: '10 mins',
    priceFrom: '$10.00',
    durationText: '~8 mins',
    openText: 'OPEN',
  },
  flashclean: {
    id: 'flashclean',
    name: 'FlashClean Bay',
    address: '51 River Rd, Springfield, IL',
    latitude: 37.5133,
    longitude: 127.1001,
    subtitle: 'Affordable self-wash station',
    rating: 4.4,
    reviewText: '(540 reviews)',
    distanceText: '2.1 miles away',
    waitText: '20 mins',
    priceFrom: '$8.00',
    durationText: '~12 mins',
    openText: 'OPEN',
  },
};

export default function CarwashInfoScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const info = INFO_MOCKS[id ?? 'ecowash'] ?? INFO_MOCKS.ecowash;

  const colors = {
    bg: isDark ? '#111121' : '#f6f6f8',
    surface: isDark ? '#0f172a' : '#ffffff',
    card: isDark ? '#1e293b' : '#eef2f7',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#94a3b8' : '#64748b',
    primary: '#5a58e9',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroWrap}>
            <ImageBackground source={{ uri: HEADER_IMAGE_URI }} style={styles.heroImage}>
              <View style={styles.heroGradient} />
            </ImageBackground>

            <View style={styles.heroTopRow}>
              <Pressable style={styles.heroIconBtn} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={20} color="#fff" />
              </Pressable>
              <View style={styles.heroRightBtns}>
                <Pressable style={styles.heroIconBtn} onPress={() => Alert.alert('공유', '공유 기능은 준비중입니다.')}>
                  <MaterialIcons name="share" size={20} color="#fff" />
                </Pressable>
                <Pressable style={styles.heroIconBtn} onPress={() => Alert.alert('즐겨찾기', '즐겨찾기에 추가되었습니다.')}>
                  <MaterialIcons name="favorite-border" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={[styles.contentPanel, { backgroundColor: colors.surface }]}>
            <View style={styles.mainInfoHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{info.name}</Text>
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={14} color={colors.muted} />
                  <Text style={[styles.address, { color: colors.muted }]}>{info.address}</Text>
                </View>
              </View>
              <View style={styles.openBadge}>
                <MaterialIcons name="check-circle" size={14} color="#15803d" />
                <Text style={styles.openBadgeText}>{info.openText}</Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.ratingLeft}>
                <MaterialIcons name="star" size={16} color="#f59e0b" />
                <Text style={[styles.ratingValue, { color: colors.text }]}>{info.rating.toFixed(1)}</Text>
                <Text style={[styles.ratingReviews, { color: colors.muted }]}>{info.reviewText}</Text>
              </View>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <Text style={[styles.distanceText, { color: colors.primary }]}>{info.distanceText}</Text>
            </View>

            <Text style={[styles.disclaimer, { color: colors.muted }]}>
              대기·가격·소요 시간은 참고용입니다. 방문 전 현장 안내를 확인해 주세요.
            </Text>

            <View style={styles.statsGrid}>
              <InfoCard icon="schedule" label="예상 대기" value={info.waitText} colors={colors} />
              <InfoCard icon="sell" label="참고 가격(부터)" value={info.priceFrom} colors={colors} />
              <InfoCard icon="timer" label="예상 소요" value={info.durationText} colors={colors} />
            </View>

            <SectionTitle text="서비스 안내" color={colors.text} />
            <ServiceRow
              icon="directions-car"
              title="Automatic Wash"
              subtitle="노터치·자동 라인 (예시)"
              price="$12.00"
              colors={colors}
            />
            <ServiceRow
              icon="pan-tool-alt"
              title="Hand Wash & Wax"
              subtitle="손세차·왁스 (예시)"
              price="$25.00"
              popular
              colors={colors}
            />

            <SectionTitle text="위치" color={colors.text} />
            <View style={styles.mapPreviewWrap}>
              <ImageBackground source={{ uri: MINI_MAP_URI }} style={styles.mapPreview}>
                <View style={styles.mapPin}>
                  <MaterialIcons name="local-car-wash" size={16} color="#fff" />
                </View>
              </ImageBackground>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomCtaWrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.navBtnFull, { backgroundColor: colors.primary }]}
            onPress={() =>
              openNavigationSelector({
                id: info.id,
                name: info.name,
                address: info.address,
                latitude: info.latitude,
                longitude: info.longitude,
              })
            }
          >
            <MaterialIcons name="near-me" size={20} color="#fff" />
            <Text style={styles.navBtnFullText}>길찾기 앱에서 열기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ text, color }: { text: string; color: string }) {
  return <Text style={[styles.sectionTitle, { color }]}>{text}</Text>;
}

function InfoCard({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  colors: { card: string; text: string; muted: string; primary: string };
}) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
      <MaterialIcons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function ServiceRow({
  icon,
  title,
  subtitle,
  price,
  popular,
  colors,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle: string;
  price: string;
  popular?: boolean;
  colors: { primary: string; border: string; text: string; muted: string; card: string };
}) {
  return (
    <View
      style={[
        styles.serviceRow,
        {
          borderColor: popular ? colors.primary : colors.border,
          borderWidth: popular ? 2 : 1,
          backgroundColor: popular ? `${colors.primary}0f` : 'transparent',
        },
      ]}
    >
      <View style={styles.serviceLeft}>
        <View style={[styles.serviceIconWrap, { backgroundColor: popular ? colors.primary : `${colors.primary}1a` }]}>
          <MaterialIcons name={icon} size={18} color={popular ? '#fff' : colors.primary} />
        </View>
        <View>
          <Text style={[styles.serviceTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.serviceSubtitle, { color: colors.muted }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.servicePrice, { color: colors.primary }]}>{price}</Text>
        {popular ? <Text style={[styles.popularBadge, { color: colors.primary }]}>POPULAR</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  heroWrap: { height: 250, position: 'relative' },
  heroImage: { flex: 1, justifyContent: 'flex-end' },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.32)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroRightBtns: { flexDirection: 'row', gap: 8 },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  contentPanel: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  mainInfoHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 31, fontWeight: '900' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  address: { fontSize: 13, fontWeight: '600' },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openBadgeText: { color: '#15803d', fontSize: 11, fontWeight: '800' },

  disclaimer: { fontSize: 12, fontWeight: '600', lineHeight: 17, marginBottom: 12 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 14 },
  ratingLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontSize: 13, fontWeight: '900' },
  ratingReviews: { fontSize: 12, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 999 },
  distanceText: { fontSize: 13, fontWeight: '800' },

  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  infoCard: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', gap: 3 },
  infoLabel: { fontSize: 11, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '900' },

  sectionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, marginTop: 4 },
  serviceRow: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  serviceIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { fontSize: 15, fontWeight: '800' },
  serviceSubtitle: { fontSize: 11, fontWeight: '600' },
  servicePrice: { fontSize: 22, fontWeight: '900' },
  popularBadge: { fontSize: 10, fontWeight: '900', marginTop: 2 },

  mapPreviewWrap: { height: 128, borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  mapPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapPin: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5a58e9',
    borderWidth: 3,
    borderColor: 'rgba(90,88,233,0.3)',
  },

  bottomCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  navBtnFull: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navBtnFullText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});

