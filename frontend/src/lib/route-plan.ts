export type MapPointKind = 'wash' | 'gas' | 'ev';

export type RouteSlotKey = 'origin' | 'waypoint' | 'destination';

export type RoutePlanPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: MapPointKind;
  address?: string;
};

export type RoutePlan = {
  origin: RoutePlanPlace | null;
  waypoint: RoutePlanPlace | null;
  destination: RoutePlanPlace | null;
};

export const ROUTE_SLOT_LABELS: Record<RouteSlotKey, string> = {
  origin: '출발지',
  waypoint: '경유지',
  destination: '목적지',
};

export const EMPTY_ROUTE_PLAN: RoutePlan = {
  origin: null,
  waypoint: null,
  destination: null,
};


export function formatRoutePlaceLabel(place: RoutePlanPlace): string {
  return `${place.name}`;
}

export function canNavigate(plan: RoutePlan): boolean {
  return plan.origin != null && plan.destination != null;
}

export function washToRoutePlace(wash: {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}): RoutePlanPlace {
  return {
    id: `wash-${wash.id}`,
    kind: 'wash',
    name: wash.name,
    latitude: wash.latitude,
    longitude: wash.longitude,
    address: wash.address,
  };
}

export function gasToRoutePlace(gas: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  brandName?: string;
}): RoutePlanPlace {
  return {
    id: `gas-${gas.id}`,
    kind: 'gas',
    name: gas.name,
    latitude: gas.latitude,
    longitude: gas.longitude,
    address: gas.brandName,
  };
}

export function evToRoutePlace(ev: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}): RoutePlanPlace {
  return {
    id: `ev-${ev.id}`,
    kind: 'ev',
    name: ev.name,
    latitude: ev.latitude,
    longitude: ev.longitude,
    address: ev.address,
  };
}
