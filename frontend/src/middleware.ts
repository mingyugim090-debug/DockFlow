export { default } from "next-auth/middleware";

// 인증이 필요한 경로 목록 — 미인증 사용자는 pages.signIn("/")으로 리다이렉트
export const config = {
  matcher: [
    "/documents/:path*",
    "/generate/:path*",
    "/dashboard/:path*",
    "/workflows/:path*",
    "/approvals/:path*",
    "/schedule/:path*",
  ],
};
