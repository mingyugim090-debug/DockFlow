<!-- BEGIN:nextjs-agent-rules -->
# Next.js / Frontend 에이전트 규칙

루트의 `CLAUDE.md`도 반드시 읽는다. 이 파일은 Frontend 특화 규칙이다.

---

## Next.js 버전 주의

이 프로젝트는 Next.js 15 (App Router)를 사용한다.  
`node_modules/next/dist/docs/` 의 가이드를 확인하고, deprecation 경고를 무시하지 말 것.

---

## 절대 규칙 (위반 시 Vercel 빌드 실패)

### 1. `'use client'` 지시어
React 훅(`useState`, `useEffect`, `useSession`, `useRouter`, `usePathname` 등) 또는
브라우저 API를 사용하는 파일은 **첫 번째 줄**이 반드시 `'use client';`

```tsx
'use client';          // ← 파일 맨 위, import보다 위
import { useState } from 'react';
// ...
```

**확인 방법**: `grep -rn "useState\|useEffect\|useSession\|useRouter" src/` 로 나오는 파일 전부 첫 줄 확인

---

### 2. JSX 삼항 연산자 닫기
Turbopack은 JSX 구문을 엄격히 파싱한다. 삼항 연산자 닫는 `}` 앞에 `)` 없어야 한다.

```tsx
// 잘못된 예 — Turbopack 파싱 오류
{condition ? (
  <A />
) : null
)}    // ← 이 ) 가 오류

// 올바른 예
{condition ? (
  <A />
) : null
}
```

---

### 3. 파일 커밋 확인
import하는 컴포넌트·모듈 파일이 `git status`에서 untracked 이면 Vercel 빌드에서 "Module not found" 발생.  
새 파일 생성 후 반드시 `git add` 포함해 커밋.

---

### 4. API 호출 규칙
- **상대경로** 사용: `/api/generate/async`, `/api/upload` 등
- 절대 URL (`http://localhost:8000`) 사용 금지
- `axios` 사용 금지 → `fetch` 사용
- `X-User-Id` 헤더: `lib/api.ts`의 래퍼 함수 사용

```typescript
// lib/api.ts의 패턴을 따름
const res = await fetch('/api/generate/async', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

---

### 5. 이미지 외부 도메인
`next/image`로 외부 이미지(카카오 프로필 등)를 로드할 때 `next.config.ts`에 도메인 등록 필요.  
등록 안 하면 런타임 오류 발생.

---

## 커밋 전 체크

```bash
cd frontend
npx tsc --noEmit          # TypeScript + JSX 오류 전부 잡힘
npx next lint             # Next.js 특화 lint
```

또는 루트에서:
```bash
./scripts/validate.sh
```

---

## 파일 구조 패턴

```
src/
├── app/                  ← 페이지 (App Router)
│   ├── layout.tsx        ← 공통 레이아웃 (Server Component)
│   ├── page.tsx          ← 'use client' (useSession 사용)
│   └── [feature]/page.tsx
├── components/
│   ├── workspace/        ← Sidebar, Header
│   └── [feature]/        ← 기능별 컴포넌트
├── lib/
│   ├── api.ts            ← fetch 래퍼
│   └── supabase.ts       ← Supabase 클라이언트
└── types/                ← 공통 TypeScript 타입
```

<!-- END:nextjs-agent-rules -->
