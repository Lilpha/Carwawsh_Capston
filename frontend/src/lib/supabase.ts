import { createClient } from '@supabase/supabase-js';
// @ts-ignore (이름에서 EXPO_PUBLIC_을 빼주세요!)
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

// 터미널에 주소가 찍히는지 확인 (undefined가 나오면 안 됩니다)
console.log("📍 연결 주소 확인:", EXPO_PUBLIC_SUPABASE_URL);

if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("환경 변수 로드 실패! 이름을 확인하세요.");
}

export const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);