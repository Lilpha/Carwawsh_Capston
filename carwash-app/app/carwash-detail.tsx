import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CarwashDetailSheet } from '@/components/carwash-detail-sheet';

const MAP_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCJt7ZbzMi0TYqwKqnMecchPnlsScePKVpYpfHKKKoEmkRcgNUmc72_G44iyuWicGkcPm736fGyxq8cZR8kpNKamnbljOLysrOn6F4Ah6VYMSyBx2caGill2s0PyRu51OI-PUO0murzW0RGrDJdYpDjDbwHzamPtLwKxTAF6n2p_mwJcvJ2Eb1JYNdTrhQ3RlzmfBKyyIoyQGhmcPZH4MJo3ZPoZlqRoumceZyWHhBbOFuYOQy0wq6waaM3YAuqylRLyMGY6HovqGQ';

/** 목록·검색 등에서 진입 시: 별도 화면 + 동일 시트 UI */
export default function CarwashDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const washId = id ?? 'ecowash';

  return (
    <View style={styles.container}>
      <Pressable style={styles.mapTapLayer} onPress={() => router.back()}>
        <ImageBackground source={{ uri: MAP_IMAGE_URI }} resizeMode="cover" style={styles.mapBackground}>
          <View style={styles.mapOverlay} />
        </ImageBackground>
      </Pressable>
      <CarwashDetailSheet washId={washId} onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapTapLayer: { ...StyleSheet.absoluteFillObject },
  mapBackground: { width: '100%', height: '100%' },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.40)',
  },
});
