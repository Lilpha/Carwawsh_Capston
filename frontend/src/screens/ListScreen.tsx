import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>세차장 리스트 화면 (List)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' }
});
