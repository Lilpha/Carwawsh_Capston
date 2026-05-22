import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DEFAULT_NEARBY_WASH_LIMIT, INITIAL_MAP_COORD } from '../lib/map-constants';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';

export type ListWashItem = {
  id: number;
  name: string;
  address: string;
  status: string;
  latitude: number;
  longitude: number;
};

const colors = {
  primary: '#5a58e9',
  bg: '#F6F7FB',
  text: '#0F172A',
  muted: '#64748B',
  panel: '#ffffff',
  border: 'rgba(148,163,184,0.35)',
};

function statusLabel(status: string): string {
  if (status === '동파') return '동파';
  return '영업';
}

function statusStyle(status: string) {
  return status === '동파'
    ? { bg: '#FEE2E2', fg: '#DC2626' }
    : { bg: '#DCFCE7', fg: '#16A34A' };
}

export default function ListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<ListWashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWashes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_nearby_washes', {
        user_lat: INITIAL_MAP_COORD.latitude,
        user_lng: INITIAL_MAP_COORD.longitude,
        search_limit: DEFAULT_NEARBY_WASH_LIMIT,
      });
      if (rpcError) throw rpcError;
      const rows = (data ?? []) as Record<string, unknown>[];
      setItems(
        rows
          .map((w) => {
            const lat = Number(w.latitude);
            const lng = Number(w.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
              id: Number(w.id),
              name: String(w.name ?? ''),
              address: String(w.address ?? ''),
              status: String(w.status ?? ''),
              latitude: lat,
              longitude: lng,
            } satisfies ListWashItem;
          })
          .filter((x): x is ListWashItem => x != null && Number.isFinite(x.id)),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWashes();
  }, [loadWashes]);

  const onSelectWash = useCallback(
    (wash: ListWashItem) => {
      navigation.navigate('MainTabs', {
        screen: 'Map',
        params: { openWashId: wash.id },
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>세차장 목록</Text>
        <View style={styles.iconBtn} />
      </View>

      <Text style={styles.hint}>항목을 누르면 지도에서 세차장 정보를 엽니다.</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>목록을 불러오지 못했습니다.</Text>
          <Pressable style={styles.retryBtn} onPress={loadWashes}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>주변 세차장이 없습니다.</Text>
          }
          renderItem={({ item }) => {
            const badge = statusStyle(item.status);
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => onSelectWash(item)}
              >
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowAddr} numberOfLines={2}>
                    {item.address || '주소 없음'}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: colors.panel,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  hint: {
    fontSize: 13,
    color: colors.muted,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    fontWeight: '600',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  listEmpty: { flexGrow: 1, paddingHorizontal: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyText: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 15,
    color: colors.muted,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panel,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  rowPressed: { opacity: 0.88 },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  rowAddr: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
