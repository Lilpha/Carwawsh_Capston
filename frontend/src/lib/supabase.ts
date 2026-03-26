import { createClient } from '@supabase/supabase-js';
// @ts-ignore (타입 선언이 없다면 무시하도록 추가)
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ 환경 변수가 로드되지 않았습니다. .env 파일과 babel 설정을 확인하세요.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);