import { NextRequest, NextResponse } from "next/server";

// Next.js 16에서 middleware가 deprecated 경고가 발생하므로
// 인증 체크는 각 페이지 컴포넌트에서 useSession으로 처리하고,
// 여기서는 모든 요청을 그대로 통과시킨다.
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
