import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import BottomSheet from '@gorhom/bottom-sheet';

import WashBottomSheet, { type WashSheetWash } from './WashBottomSheet';

const INITIAL_COORD = { latitude: 37.8823, longitude: 127.7358 };

export type MapWashMarker = WashSheetWash & {
  latitude: number;
  longitude: number;
};

export type MapScreenProps = {
  visibleWashes: MapWashMarker[];
  onSheetIndexChange?: (index: number) => void;
  onCameraChanged?: (e: { latitude: number; longitude: number; zoom?: number }) => void;
};

export default function MapScreen({ visibleWashes, onSheetIndexChange, onCameraChanged }: MapScreenProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState(-1);
  const [selectedWash, setSelectedWash] = useState<MapWashMarker | null>(null);

  const handleSheetChange = useCallback(
    (index: number) => {
      setSheetIndex(index);
      onSheetIndexChange?.(index);
      if (index === -1) {
        setSelectedWash(null);
      }
    },
    [onSheetIndexChange],
  );

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const onMarkerPress = useCallback(
    (wash: MapWashMarker) => {
      setSelectedWash(wash);
      /** 제어 모드: index는 state로만 맞춤. snapToIndex만 쓰면 다음 렌더에 -1로 덮여 안 올라올 수 있음 */
      setSheetIndex(0);
      onSheetIndexChange?.(0);
    },
    [onSheetIndexChange],
  );

  return (
    <View style={styles.root}>
      <NaverMapView
        style={StyleSheet.absoluteFill}
        initialCamera={{
          ...INITIAL_COORD,
          zoom: 14,
        }}
        onCameraChanged={onCameraChanged}
      >
        {visibleWashes.map((wash) => (
          <NaverMapMarkerOverlay
            key={`wash-${wash.id}`}
            latitude={wash.latitude}
            longitude={wash.longitude}
            image={{ symbol: wash.status === '동파' ? 'red' : 'green' }}
            anchor={{ x: 0.5, y: 1 }}
            caption={{ text: wash.name }}
            onTap={() => onMarkerPress(wash)}
          />
        ))}
      </NaverMapView>

      <WashBottomSheet
        ref={bottomSheetRef}
        index={sheetIndex}
        onChange={handleSheetChange}
        wash={selectedWash}
        onClosePress={handleClosePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
