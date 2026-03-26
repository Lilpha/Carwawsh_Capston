import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function VehicleEditScreen() {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const [nickname, setNickname] = useState('');
  const [type, setType] = useState('');
  const [plate, setPlate] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);

  const colors = {
    bg: isDark ? '#111121' : '#f6f6f8',
    panel: isDark ? '#111121' : '#ffffff',
    border: isDark ? 'rgba(148,163,184,0.30)' : 'rgba(148,163,184,0.35)',
    text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    primary: '#5a58e9',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>차량 등록</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.panel, borderColor: colors.border }]}>
        <Field
          label="차량 별칭"
          placeholder="예: 내 세단"
          value={nickname}
          onChangeText={setNickname}
          colors={colors}
        />
        <Field label="차종" placeholder="예: Sedan / SUV" value={type} onChangeText={setType} colors={colors} />
        <Field
          label="차량 번호"
          placeholder="예: 12가 3456"
          value={plate}
          onChangeText={setPlate}
          colors={colors}
        />

        <View style={[styles.switchRow, { borderColor: colors.border }]}>
          <View>
            <Text style={[styles.switchTitle, { color: colors.text }]}>기본 차량으로 설정</Text>
            <Text style={[styles.switchDesc, { color: colors.muted }]}>길찾기/예약 시 기본 선택됩니다.</Text>
          </View>
          <Switch value={isPrimary} onValueChange={setIsPrimary} trackColor={{ true: colors.primary }} />
        </View>

        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Alert.alert('저장 완료', '차량 정보가 저장되었습니다.');
            router.back();
          }}
        >
          <Text style={styles.saveBtnText}>저장</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  colors,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: { border: string; text: string; muted: string };
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 52,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },

  formCard: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700' },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },

  switchRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: { fontSize: 14, fontWeight: '800' },
  switchDesc: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  saveBtn: {
    marginTop: 6,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});

