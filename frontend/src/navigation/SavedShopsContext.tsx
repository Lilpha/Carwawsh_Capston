import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

/**
 * 저장 탭 / Supabase 연동용 카드 모델.
 * shopId는 shops.id 문자열과 매칭.
 */
export type SavedWashCardModel = {
  id: string;
  shopId: string;
  name: string;
  thumbnailUrl: string;
  distanceKm: number;
  isOpen: boolean;
};

export type SaveableShop = {
  id: number;
  name: string;
  status: string;
};

const DEFAULT_THUMB =
  'https://images.unsplash.com/photo-1520340351474-92d0dd7330e7?w=200&q=80';

function shopToSavedEntry(shop: SaveableShop): SavedWashCardModel {
  return {
    id: `saved-${shop.id}`,
    shopId: String(shop.id),
    name: shop.name,
    thumbnailUrl: DEFAULT_THUMB,
    distanceKm: 2.0,
    isOpen: shop.status !== '동파',
  };
}

type SavedShopsContextValue = {
  items: SavedWashCardModel[];
  isShopSaved: (shopId: number) => boolean;
  saveShop: (shop: SaveableShop) => void;
  removeSavedByShopId: (shopId: number) => void;
  removeSavedByRowId: (savedRowId: string) => void;
};

const SavedShopsContext = createContext<SavedShopsContextValue | null>(null);

export function SavedShopsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedWashCardModel[]>([]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const isShopSaved = useCallback(
    (shopId: number) => items.some((x) => x.shopId === String(shopId)),
    [items],
  );

  const saveShop = useCallback((shop: SaveableShop) => {
    setItems((prev) => {
      if (prev.some((x) => x.shopId === String(shop.id))) return prev;
      return [...prev, shopToSavedEntry(shop)];
    });
    // TODO(Supabase): insert user_saved_shops
  }, []);

  const removeSavedByShopId = useCallback((shopId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems((prev) => prev.filter((x) => x.shopId !== String(shopId)));
    // TODO(Supabase): delete where shop_id = shopId
  }, []);

  const removeSavedByRowId = useCallback((savedRowId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setItems((prev) => prev.filter((x) => x.id !== savedRowId));
    // TODO(Supabase): delete by saved row id
  }, []);

  const value = useMemo(
    () => ({
      items,
      isShopSaved,
      saveShop,
      removeSavedByShopId,
      removeSavedByRowId,
    }),
    [items, isShopSaved, saveShop, removeSavedByShopId, removeSavedByRowId],
  );

  return (
    <SavedShopsContext.Provider value={value}>{children}</SavedShopsContext.Provider>
  );
}

export function useSavedShops() {
  const ctx = useContext(SavedShopsContext);
  if (!ctx) {
    throw new Error('useSavedShops must be used within SavedShopsProvider');
  }
  return ctx;
}
