import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  NaverMapView,
  NaverMapMarkerOverlay,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { DEMO_MAP_ZOOM, INITIAL_MAP_COORD } from '../lib/map-constants';
import BottomSheet from '@gorhom/bottom-sheet';

import type { EvMapPoint } from '../lib/ev';
import type { GasMapPoint } from '../lib/opinet';
import {
  evToRoutePlace,
  gasToRoutePlace,
  type RoutePlan,
  type RoutePlanPlace,
  type RouteSlotKey,
} from '../lib/route-plan';
import { useRoutePlan } from '../navigation/RoutePlanContext';
import WashBottomSheet, { type WashSheetWash } from './WashBottomSheet';

export type MapScreenHandle = {
  /** 데모용: 기본 중심(춘천 인근)으로 카메라 이동 */
  goToDemoLocation: () => void;
};

export type MapWashMarker = WashSheetWash & {
  latitude: number;
  longitude: number;
};

export type MapScreenProps = {
  visibleWashes: MapWashMarker[];
  /** List 화면에서 넘긴 세차장 id (소비 후 onOpenWashConsumed 호출) */
  openWashId?: number | null;
  allWashesForLookup?: MapWashMarker[];
  onOpenWashConsumed?: () => void;
  visibleGasStations?: GasMapPoint[];
  visibleEvChargers?: EvMapPoint[];
  routePlan?: RoutePlan;
  onSheetIndexChange?: (index: number) => void;
  onCameraIdle?: (e: { latitude: number; longitude: number; zoom?: number }) => void;
};

function evMarkerSymbol(statName?: string): 'green' | 'yellow' | 'red' {
  if (statName === '사용가능') return 'green';
  if (statName === '알수없음') return 'yellow';
  return 'red';
}

function formatGasPrice(price: number): string {
  if (!Number.isFinite(price)) return '—';
  return `${price.toLocaleString('ko-KR')}원/L`;
}

function formatDistanceMeters(meters?: number): string {
  if (meters == null || !Number.isFinite(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

type LatLng = Pick<RoutePlanPlace, 'latitude' | 'longitude'>;

const ROUTE_COORD_EPSILON = 0.00005;
const ROUTE_MARKER_Z_INDEX = 200;

function isSameCoordinate(a: LatLng, b: LatLng): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < ROUTE_COORD_EPSILON &&
    Math.abs(a.longitude - b.longitude) < ROUTE_COORD_EPSILON
  );
}

function routePlanPlaces(plan: RoutePlan): RoutePlanPlace[] {
  return [plan.origin, plan.waypoint, plan.destination].filter(
    (place): place is RoutePlanPlace => place != null,
  );
}

function isSelectedRouteCoordinate(
  latitude: number,
  longitude: number,
  places: RoutePlanPlace[],
): boolean {
  const point: LatLng = { latitude, longitude };
  return places.some((place) => isSameCoordinate(point, place));
}

/** 경로 슬롯별 짧은 타입 코드 (단일 경유 슬롯 → "1") */
const ROUTE_TYPE_CAPTION: Record<RouteSlotKey, string> = {
  origin: 'S',
  waypoint: '1',
  destination: 'D',
};

/** 경로 마커: 색상은 pink 통일, 역할은 caption(S/1/D)으로 구분 */
function RouteSlotMarkers({ plan }: { plan: RoutePlan }) {
  const routeSymbol = 'pink' as const;
  const slots = [
    { key: 'origin' as const, place: plan.origin, symbol: routeSymbol },
    { key: 'waypoint' as const, place: plan.waypoint, symbol: routeSymbol },
    { key: 'destination' as const, place: plan.destination, symbol: routeSymbol },
  ];

  return (
    <>
      {slots.map(({ key, place, symbol }) =>
        place ? (
          <NaverMapMarkerOverlay
            key={`route-${key}`}
            latitude={place.latitude}
            longitude={place.longitude}
            zIndex={ROUTE_MARKER_Z_INDEX}
            globalZIndex={ROUTE_MARKER_Z_INDEX}
            image={{ symbol }}
            anchor={{ x: 0.5, y: 1 }}
            caption={{ text: ROUTE_TYPE_CAPTION[key] }}
          />
        ) : null,
      )}
    </>
  );
}

const MapScreen = forwardRef<MapScreenHandle, MapScreenProps>(function MapScreen(
  {
    visibleWashes,
    openWashId = null,
    allWashesForLookup,
    onOpenWashConsumed,
    visibleGasStations = [],
    visibleEvChargers = [],
    routePlan: routePlanProp,
    onSheetIndexChange,
    onCameraIdle,
  },
  ref,
) {
  const { plan: planFromContext, showMarkerAssignDialog } = useRoutePlan();
  const routePlan = routePlanProp ?? planFromContext;

  const selectedRoutePlaces = useMemo(
    () => routePlanPlaces(routePlan),
    [routePlan.origin, routePlan.waypoint, routePlan.destination],
  );

  const mapRef = useRef<NaverMapViewRef>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedWash, setSelectedWash] = useState<MapWashMarker | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      goToDemoLocation: () => {
        mapRef.current?.animateCameraTo({
          ...INITIAL_MAP_COORD,
          zoom: DEMO_MAP_ZOOM,
          duration: 600,
          easing: 'EaseOut',
        });
      },
    }),
    [],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        setSelectedWash(null);
      }
      onSheetIndexChange?.(index);
    },
    [onSheetIndexChange],
  );

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
    setSelectedWash(null);
    onSheetIndexChange?.(-1);
  }, [onSheetIndexChange]);

  useEffect(() => {
    if (selectedWash == null) {
      onSheetIndexChange?.(-1);
    }
  }, [selectedWash, onSheetIndexChange]);

  useEffect(() => {
    if (!selectedWash) return;
    const t = setTimeout(() => bottomSheetRef.current?.snapToIndex(0), 0);
    return () => clearTimeout(t);
  }, [selectedWash]);

  useEffect(() => {
    if (openWashId == null) return;
    const pool = allWashesForLookup ?? visibleWashes;
    if (pool.length === 0) return;

    const wash = pool.find((w) => w.id === openWashId);
    if (wash) {
      setSelectedWash(wash);
      onSheetIndexChange?.(0);
    } else {
      Alert.alert('알림', '지도에서 해당 세차장을 찾을 수 없습니다. 목록에서 다시 선택해 주세요.');
    }
    onOpenWashConsumed?.();
  }, [
    openWashId,
    allWashesForLookup,
    visibleWashes,
    onOpenWashConsumed,
    onSheetIndexChange,
  ]);

  const onWashMarkerPress = useCallback(
    (wash: MapWashMarker) => {
      setSelectedWash(wash);
      onSheetIndexChange?.(0);
    },
    [onSheetIndexChange],
  );

  const poiMarkerHit = { width: 44, height: 44 };
  const washMarkerHit = { width: 52, height: 52 };

  const onGasMarkerPress = useCallback(
    (station: GasMapPoint) => {
      const dist = formatDistanceMeters(station.distance);
      const lines = [
        station.brandName ? `브랜드: ${station.brandName}` : null,
        `휘발유: ${formatGasPrice(station.price)}`,
        dist ? `거리: ${dist}` : null,
      ].filter(Boolean) as string[];
      showMarkerAssignDialog(gasToRoutePlace(station), lines);
    },
    [showMarkerAssignDialog],
  );

  const onEvMarkerPress = useCallback(
    (charger: EvMapPoint) => {
      const lines = [
        charger.typeName ? `충전기: ${charger.typeName}` : null,
        charger.statName ? `상태: ${charger.statName}` : null,
        charger.useTime ? `이용: ${charger.useTime}` : null,
        charger.address ? charger.address : null,
      ].filter(Boolean) as string[];
      showMarkerAssignDialog(evToRoutePlace(charger), lines);
    },
    [showMarkerAssignDialog],
  );

  return (
    <View style={styles.root} pointerEvents="box-none" collapsable={false}>
      <NaverMapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCamera={{
          ...INITIAL_MAP_COORD,
          zoom: DEMO_MAP_ZOOM,
        }}
        onCameraIdle={onCameraIdle}
      >
        <RouteSlotMarkers plan={routePlan} />
        {visibleGasStations.map((station) =>
          isSelectedRouteCoordinate(
            station.latitude,
            station.longitude,
            selectedRoutePlaces,
          ) ? null : (
          <NaverMapMarkerOverlay
            key={`gas-${station.id}`}
            latitude={station.latitude}
            longitude={station.longitude}
            zIndex={20}
            globalZIndex={20}
            {...poiMarkerHit}
            image={{ symbol: 'blue' }}
            anchor={{ x: 0.5, y: 1 }}
            isHideCollidedCaptions
            caption={{ text: station.brandName ?? '주유소' }}
            onTap={() => onGasMarkerPress(station)}
          />
        ))}
        {visibleEvChargers.map((charger) =>
          isSelectedRouteCoordinate(
            charger.latitude,
            charger.longitude,
            selectedRoutePlaces,
          ) ? null : (
          <NaverMapMarkerOverlay
            key={`ev-${charger.id}`}
            latitude={charger.latitude}
            longitude={charger.longitude}
            zIndex={20}
            globalZIndex={20}
            {...poiMarkerHit}
            image={{ symbol: evMarkerSymbol(charger.statName) }}
            anchor={{ x: 0.5, y: 1 }}
            isHideCollidedCaptions
            caption={{ text: charger.name ?? '충전소' }}
            onTap={() => onEvMarkerPress(charger)}
          />
        ))}
        {visibleWashes.map((wash) =>
          isSelectedRouteCoordinate(
            wash.latitude,
            wash.longitude,
            selectedRoutePlaces,
          ) ? null : (
          <NaverMapMarkerOverlay
            key={`wash-${wash.id}`}
            latitude={wash.latitude}
            longitude={wash.longitude}
            zIndex={100}
            globalZIndex={100}
            isForceShowIcon
            {...washMarkerHit}
            image={{ symbol: wash.status === '동파' ? 'red' : 'green' }}
            anchor={{ x: 0.5, y: 1 }}
            isHideCollidedCaptions
            caption={{ text: wash.name }}
            onTap={() => onWashMarkerPress(wash)}
          />
        ))}
      </NaverMapView>

      {selectedWash != null ? (
        <WashBottomSheet
          ref={bottomSheetRef}
          index={0}
          onChange={handleSheetChange}
          wash={selectedWash}
          onClosePress={handleClosePress}
        />
      ) : null}
    </View>
  );
});

export default MapScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
});
