import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// 인증이 필요한 경로 — 미인증 사용자는 홈("/")으로 리다이렉트
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/documents/:path*",
    "/generate/:path*",
    "/dashboard/:path*",
    "/workflows/:path*",
    "/approvals/:path*",
    "/schedule/:path*",
    "/convert/:path*",
    "/announcements/:path*",
    "/slides/:path*",
  ],
};
