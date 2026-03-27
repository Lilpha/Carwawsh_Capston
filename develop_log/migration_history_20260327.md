# 세차장 매칭 서비스 (Carwash Capstone) 개발 일지

## 1. 프로젝트 초기 구조 분석 및 사전 작업 히스토리 (Naver Map 덮어쓰기)
- **과거 핵심 마이그레이션 배경:** 
  - 과거에 기존 앱은 **Google Map** 베이스로 구현되어 있었음. 
  - 그러나 국내 환경에 최적화하기 위해, 진행 중이던 별도의 `naver_map` 브랜치 소스를 가져와서 현재 코어 프로젝트인 `frontend` 디렉토리를 완전히 덮어 씌우는 대공사를 수행했음.
  - 이 과정에서 함께 기존 Expo 기반의 `carwash-app` 프로젝트 구조(기본 Layout, 화면들)를 네이버 지도를 덮어쓴 순수 RN CLI 기반의 `frontend` 쪽에 단계적으로 이식하기로 목표를 세움!

- **초기 상태:**
  - `carwash-app` (Expo 기반 프로젝트): `expo-router`를 사용하여 파일 기반 라우팅 사용 (`app/` 디렉토리 하위에 페이지들이 구성됨). 주요 지도 뷰와 검색, 필터, 탭 바 UI들이 이쪽에 구현되어 있었음.
  - `frontend` (순수 React Native CLI 기반 프로젝트): 네이버 지도 플러그인(`@mj-studio/react-native-naver-map`)의 네이티브 모듈 의존성 때문에 Expo 대신 순수 RN 환경으로 이전 작업을 수행 중이었음. 메인 `App.tsx` 하나에 네이버 지도 코드만 존재함.
- **주요 목표:** Expo 기반인 `carwash-app`에서 구현했던 UI 껍데기 요소(검색창, 필터버튼, 하단 플로팅 버튼 등)와 더미 화면 구조를 순수 RN 기반의 `frontend` 프로젝트로 마이그레이션(이식)하고, 앱 전반의 네비게이션(라우팅) 구조를 확립하는 것.

## 2. 작업 내역 진행 단계

### Step 1: 메인 UI 요소 (Screen 오버레이) 병합
- `carwash-app/app/(tabs)/index.tsx`에 있던 지도 상단의 **검색창, 테마별 필터 칩(Hot Water 등)** 및 하단의 **유틸리티 버튼(List View 등)** 코드를 추출하여 `frontend/App.tsx`에 그대로 복사 및 병합함.
- `pointerEvents="box-none"` 속성을 각 오버레이의 컨테이너에 적용하여, 버튼과 같은 컨트롤 요소가 아닌 빈 공간 터치 시 이벤트를 무시하여 **바닥에 깔린 네이버 지도가 정상적으로 드래그·터치 인식이 되도록 처리**함.
- 기존 Expo UI 코드에 얽혀있던 `expo-router` 의존성 모듈들을 모두 걷어내고 임시 `Alert.alert('알림', ...)`를 띄우는 형태로 콜백 처리를 변경하여 크래시를 방지함.

### Step 2: 클린 빌드 및 환경 문제 점검
- 순수 RN CLI의 특성상 네이티브 의존성 폴더(`android` 등)에서 자바 환경 및 CMake 빌드 에러 이슈가 간혹 발생함. 
- 이 문제를 해결·점검하기 위해 PowerShell 상에서 안드로이드 빌드 명령어(`npm run android`)와 자바 버전을 확인하며 이슈 트래킹을 수행함. (JDK 25를 사용 중인 설정 환경과 RN 빌드의 궁합 이슈를 체크 및 정리)
- (참고) 클린 빌드를 위한 명령어 스크립트를 숙지함:
  ```bash
  cd android
  .\gradlew clean
  cd ..
  npm start -- --reset-cache
  npm run android
  ```

### Step 3: React Navigation 도입 및 라우팅 아키텍처 재설계
- 기존 Expo Router의 파일 기반(라우팅) 구조를, 순수 RN 환경에 맞게 코드를 통해 라우팅을 구성하는 **React Navigation** 체계로 교체하기로 결정함.
- **패키지 설치 완료:**
  ```bash
  npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
  ```
- **디렉토리 구조 표준화:**
  - `frontend/src/screens/` 및 `frontend/src/navigation/` 폴더를 생성하여 코드를 기능 단위로 쪼개기 시작함.
- **App.tsx 분리 작업:**
  1. 기존에 만들었던 거대한 지도 UI 구조물을 `frontend/src/screens/HomeScreen.tsx` 파일로 생성 후 이관함.
  2. 비워진 최상위 `frontend/App.tsx` 파일은 오로지 `NavigationContainer`와 스택 라우터를 관리하는 중앙 관제탑 역할을 하도록 구조를 개편함.

### Step 4: 하단 탭 바 (더미 탭 컴포넌트) 생성
- `frontend/src/screens/` 하위에 더미 페이지 파일 생성:
  - `HistoryScreen.tsx` (기록창)
  - `SavedScreen.tsx` (저장된 곳 창)
  - `ProfileScreen.tsx` (프로필 창)
- Windows PowerShell 인코딩 문제로 한글 텍스트가 깨져 들어가는 버그를 확인하고, `Set-Content -Encoding UTF8` 방식으로 정정하여 적용 완료함.
- `frontend/src/navigation/TabNavigator.tsx` 파일을 생성하여 `createBottomTabNavigator`를 통해 지도, 기록, 저장, 프로필을 오가는 하단 탭 바 형태를 성공적으로 구현 및 병합함. (기존 Expo 프로젝트의 `(tabs)/_layout.tsx`와 상응하는 역할)

### Step 5: 스택 화면(전체화면) 전환 연결
- 전체화면으로 가려지는 `src/screens/ListScreen.tsx` 더미를 생성하고 루트 화면 구조(`App.tsx` 스택)에 등록함 (`<Stack.Screen name="List">`).
- `HomeScreen.tsx` 내에서 기존에 `Alert.alert` 임시 창이 뜨던 **[List View]** 버튼을 React Navigation의 `useNavigation` 훅을 이용해 `navigation.navigate('List')`로 전환하도록 코드를 실제 연동시킴.

## 3. 남은 작업 (TO-DO)
- **더미 스크린 구체화:** SearchScreen, CarWash Detail 상세요약 등 `carwash-app`에 있던 나머지 UI 화면 요소를 `src/screens`로 가져오고 스택에 연결하기.
- **기능 개발 & 백엔드 연동:** 안드로이드 (Emulator) 빌드를 정상적으로 띄운 상태에서, 현재 UI 상에 버튼이 눌리는 것을 트리거로 실제 Supabase 백엔드 로그인 연동이나 세차장 데이터 패칭 테스트 수행하기.