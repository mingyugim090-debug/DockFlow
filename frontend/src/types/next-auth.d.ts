import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string          // Supabase UUID
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    supabase_id?: string  // signIn → jwt callback 전달용
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    supabase_user_id?: string
  }
}
