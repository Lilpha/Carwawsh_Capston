import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  List: undefined;
  Search: undefined;
};

export type MainTabParamList = {
  /** List 화면에서 선택한 세차장 → 바텀시트 열기 */
  Map: { openWashId?: number } | undefined;
  Saved: undefined;
  Profile: undefined;
};
