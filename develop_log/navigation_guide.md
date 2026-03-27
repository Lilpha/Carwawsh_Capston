# React Navigation 화면 추가 가이드

본 가이드는 기존 `expo-router`의 파일 기반 라우팅(URL 경로 방식)에서 순수 React Native CLI의 `React Navigation` (컴포넌트 기반 라우팅)으로 전환한 프로젝트를 위한 가이드입니다. 

새로운 전체 화면(예: 검색창, 상세페이지 등)을 추가하고 싶을 때는 아래의 **3단계 규칙**만 따라주시면 됩니다.

---

## 🔥 화면 추가 3단계 규칙

### 1단계: 화면 컴포넌트(Screen) 파일 생성하기
`src/screens/` 폴더에 이동할 새로운 화면 파일을 만듭니다. (예: `SearchScreen.tsx`)

```tsx
// src/screens/SearchScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text>검색 화면입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
```

### 2단계: App.tsx (중앙 관제탑) 에 화면 등록 및 타입 지정하기
화면을 만들었다고 해서 끝나는 것이 아닙니다. 네비게이션이 이 화면을 인식할 수 있도록 `App.tsx`에 이름표를 달아 등록해야 합니다.

1. **타입(`RootStackParamList`)에 등록:** TypeScript에서 오타를 방지하고 자동완성을 지원하기 위해 이름을 등록합니다.
2. **`Stack.Screen`으로 등록:** 실제로 넘어갈 컴포넌트를 짝지어 줍니다.

```tsx
// App.tsx
import SearchScreen from './src/screens/SearchScreen'; // 추가된 파일 Import

// 1. 네비게이터 타입 목록에 "원하는 이름" 추가
export type RootStackParamList = {
  MainTabs: undefined;
  List: undefined;
  Search: undefined; // 👈 새로 추가할 화면의 이름과 파라미터 타입(아무것도 안넘기면 undefined)
};

// ... 생략 ...

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs">
        {/* 기존 탭 및 리스트 화면 */}
        <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="List" component={ListScreen} />
        
        {/* 2. 신규 화면 Stack에 등록 ("원하는 이름"을 name 속성에 매칭) */}
        <Stack.Screen 
          name="Search" // 👈 위의 파라미터 타입에서 선언한 이름과 일치해야 함
          component={SearchScreen} 
          options={{ title: '검색하기' }} // 상단 헤더의 이름 설정
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 3단계: 사용할 버튼에서 화면 이동 (Navigate) 호출하기
이제 다른 화면(예: `HomeScreen.tsx`의 검색 버튼)에서 만들어둔 화면으로 이동할 수 있습니다.

```tsx
// src/screens/HomeScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App'; // 타입 가져오기

const HomeScreen = () => {
  // 1. 네비게이션 객체 생성 (타입을 묶어줌)
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    // ... 생략 ...
    {/* 2. 버튼 클릭 시 이동! ('Search'라는 등록된 이름을 부름) */}
    <Pressable onPress={() => navigation.navigate('Search')}>
      <Text>검색창 열기</Text>
    </Pressable>
  );
}
```

---

### 💡 파라미터(데이터)를 함께 넘기고 싶을 때는?
상세페이지(DetailScreen)처럼 화면을 넘길 때 어떤 세차장을 클릭했는지 'id'를 같이 넘겨줘야 할 때가 있습니다.

**1) 타입 정의 변경 (App.tsx)**
```tsx
export type RootStackParamList = {
  Detail: { storeId: number }; // undefined 대신 넘길 데이터를 정의
};
```

**2) 보낼 때 (보내는 화면)**
```tsx
navigation.navigate('Detail', { storeId: 101 }); // 👈 두번째 인자로 데이터를 보냄
```

**3) 받을 때 (받는 화면 부분 - DetailScreen.tsx)**
```tsx
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

export default function DetailScreen() {
  // route.params 로 넘어온 데이터를 꺼내 씁니다.
  const route = useRoute<RouteProp<RootStackParamList, 'Detail'>>();
  const { storeId } = route.params;

  return <Text>선택된 세차장 ID: {storeId}</Text>;
}
```