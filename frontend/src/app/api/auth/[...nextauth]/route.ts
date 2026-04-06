import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import { getSupabaseAdmin } from "@/lib/supabase";

const handler = NextAuth({
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "none",
      authorization: {
        params: {
          scope: "profile_nickname profile_image",
        },
      },
    }),
  ],
  callbacks: {
    // 1단계: 카카오 OAuth 완료 → Supabase users 테이블에 upsert
    async signIn({ user, account }) {
      if (account?.provider === "kakao") {
        try {
          const { data, error } = await getSupabaseAdmin()
            .from("users")
            .upsert(
              {
                kakao_id: account.providerAccountId,
                email: user.email ?? null,
                name: user.name ?? null,
                image: user.image ?? null,
              },
              { onConflict: "kakao_id" }
            )
            .select("id")
            .single();

          if (error) {
            console.error("[NextAuth] Supabase upsert 실패:", error.message);
            return false;
          }

          // user 객체에 supabase UUID 임시 저장 (jwt callback으로 전달)
          user.supabase_id = data.id;
        } catch (err) {
          console.error("[NextAuth] signIn callback 오류:", err);
          return false;
        }
      }
      return true;
    },

    // 2단계: JWT 생성 시 supabase UUID 주입 (최초 로그인 시만 user 존재)
    async jwt({ token, user }) {
      if (user?.supabase_id) {
        token.supabase_user_id = user.supabase_id;
      }
      return token;
    },

    // 3단계: session에 Supabase UUID 노출
    async session({ session, token }) {
      if (session.user && token.supabase_user_id) {
        session.user.id = token.supabase_user_id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
