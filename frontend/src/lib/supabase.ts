import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 서버 사이드 전용 (NextAuth signIn callback 등): service_role key 사용, RLS 우회
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 클라이언트 사이드 또는 일반 서버 사이드: anon key 사용
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
