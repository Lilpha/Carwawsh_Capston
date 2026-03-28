import { createClient } from '@supabase/supabase-js';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = (EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL/키가 없습니다. frontend 폴더에 .env 파일을 만들고 EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요. (.env.example 참고) 저장 후 Metro를 --reset-cache 로 다시 실행하세요.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);