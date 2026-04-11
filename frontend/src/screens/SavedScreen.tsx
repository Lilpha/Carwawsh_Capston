import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
  UIManager,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  useSavedShops,
  type SavedWashCardModel,
} from '../navigation/SavedShopsContext';

export type { SavedWashCardModel };

const PRIMARY = '#5a58e9';
const SCREEN_BG = '#F6F7FB';

export default function SavedScreen() {
  const { items, removeSavedByRowId } = useSavedShops();

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const renderItem: ListRenderItem<SavedWashCardModel> = useCallback(
    ({ item }) => (
      <SavedWashCard model={item} onRemoveBookmark={() => removeSavedByRowId(item.id)} />
    ),
    [removeSavedByRowId],
  );

  const keyExtractor = useCallback((item: SavedWashCardModel) => item.id, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>저장됨</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>저장된 세차장이 없습니다.</Text>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerHint}>자주 방문하는 세차장을 더 추가해보세요</Text>
            <View style={styles.ctaOutline} accessibilityElementsHidden>
              <Text style={styles.ctaOutlineText}>주변 세차장 찾기</Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function SavedWashCard({
  model,
  onRemoveBookmark,
}: {
  model: SavedWashCardModel;
  onRemoveBookmark: () => void;
}) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: model.thumbnailUrl }} style={styles.thumb} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {model.name}
        </Text>
        <View
          style={[
            styles.badge,
            model.isOpen ? styles.badgeOpen : styles.badgeClosed,
          ]}
        >
          <Text style={[styles.badgeText, model.isOpen ? styles.badgeTextOpen : styles.badgeTextClosed]}>
            {model.isOpen ? '영업 중' : '영업 종료'}
          </Text>
        </View>
        <Text style={styles.distance}>{model.distanceKm.toFixed(1)}km</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.bookmarkBtn, pressed && styles.bookmarkBtnPressed]}
        onPress={onRemoveBookmark}
        hitSlop={8}
        accessibilityLabel="저장 해제"
      >
        <MaterialIcons name="bookmark" size={22} color={PRIMARY} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  header: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.45)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeOpen: {
    backgroundColor: 'rgba(22,163,74,0.12)',
  },
  badgeClosed: {
    backgroundColor: 'rgba(148,163,184,0.25)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextOpen: {
    color: '#16A34A',
  },
  badgeTextClosed: {
    color: '#64748B',
  },
  distance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  bookmarkBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(90, 88, 233, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtnPressed: {
    opacity: 0.7,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  footerHint: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaOutline: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.55)',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  ctaOutlineText: {
    fontSize: 15,
    fontWeight: '800',
    color: PRIMARY,
  },
});
