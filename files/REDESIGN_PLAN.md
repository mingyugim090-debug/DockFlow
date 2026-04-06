# REDESIGN_PLAN.md
# DocFlow AI — 프론트엔드 전면 개편 계획서
# Antigravity 요청 프롬프트 모음

> 기존 GenSpark 클론 구조에서 → 문서 자동화 특화 올인원 워크스페이스로 전면 개편.
> 아래 순서대로 Antigravity에 요청한다.

---

## 서비스 정체성 재정의

```
Product: DocFlow AI
Tagline: "올인원 문서 자동화 워크스페이스"
Core value: 공고 모니터링부터 문서 완성·컨펌까지, 
            문서 업무의 전 과정을 AI가 처리한다.

핵심 기능 2가지:
  1. 워크플로우 빌더
     — 공모전·정부사업 공고를 자동 수집·분석하고
       지원서 초안을 생성한 뒤 담당자 컨펌을 받는 자동화 파이프라인
  
  2. 파일 → 문서 변환기
     — 사용자가 올린 어떤 파일이든 (사진, 엑셀, PDF, 메모 등)
       AI가 분석해 PPT · Word · PDF 등 원하는 형식으로 자동 문서화

Design direction:
  - 기존 단순 검색창 UI → 기능 중심 대시보드 UI로 전환
  - 색상: 다크 베이스 유지, 포인트 컬러 Indigo → Violet+Blue 듀얼 토운
  - 레이아웃: 왼쪽 사이드바 + 메인 워크스페이스 (Notion/Linear 느낌)
  - 키워드: 전문적, 효율적, 자동화, 신뢰감
```

---

## 디자인 시스템 v2 (모든 화면 공통)

> 모든 Antigravity 프롬프트 앞에 이 블록을 함께 붙여서 전송한다.

```
=== DocFlow AI Design System v2 ===

COLOR PALETTE:
  bg-base:        #08080f   (최하단 배경)
  bg-surface:     #0e0e1a   (카드, 패널)
  bg-elevated:    #13131f   (호버, 팝업)
  bg-sidebar:     #0b0b16   (사이드바)

  violet-500:     #8b5cf6   (1순위 강조)
  violet-400:     #a78bfa   (텍스트 강조)
  blue-500:       #3b82f6   (2순위 강조)
  blue-400:       #60a5fa   (링크, 서브 강조)
  
  gradient-accent: linear-gradient(135deg, #8b5cf6, #3b82f6)
  
  green-400:      #4ade80   (성공, 완료)
  amber-400:      #fbbf24   (경고, 진행중)
  red-400:        #f87171   (오류, 긴급)
  
  text-primary:   #f1f1f8
  text-secondary: rgba(241,241,248,0.5)
  text-muted:     rgba(241,241,248,0.25)
  
  border-default: rgba(255,255,255,0.07)
  border-hover:   rgba(255,255,255,0.13)
  border-violet:  rgba(139,92,246,0.35)
  border-blue:    rgba(59,130,246,0.35)

BADGE COLORS (document type):
  PPT:      bg rgba(139,92,246,0.18)  text #c4b5fd
  WORD:     bg rgba(59,130,246,0.18)  text #93c5fd
  PDF:      bg rgba(251,191,36,0.18)  text #fde68a
  EXCEL:    bg rgba(74,222,128,0.18)  text #86efac
  분석보고서: bg rgba(251,146,60,0.18) text #fed7aa

STATUS BADGES:
  완료:    bg rgba(74,222,128,0.15)   text #4ade80  dot green
  진행중:  bg rgba(251,191,36,0.15)   text #fbbf24  dot amber (pulse)
  검토중:  bg rgba(59,130,246,0.15)   text #60a5fa  dot blue
  대기:    bg rgba(255,255,255,0.07)  text rgba(255,255,255,0.35) dot gray

TYPOGRAPHY:
  Font: Pretendard (Korean) — fallback: -apple-system, system-ui
  import: @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css')
  
  Display:  48px / weight 800 / tracking -2px
  H1:       28px / weight 700 / tracking -1px
  H2:       20px / weight 600 / tracking -0.5px
  H3:       15px / weight 600
  Body:     14px / weight 400 / line-height 1.7
  Caption:  12px / weight 400
  Label:    11px / weight 600 / tracking 0.8px / uppercase

COMPONENT TOKENS:
  Card border-radius:   12px
  Button border-radius: 8px
  Input border-radius:  10px
  Pill border-radius:   9999px
  
  Card padding:   20px
  Section gap:    24px
  Item gap:       8px

MOTION:
  default: all 0.18s ease
  card-hover: translateY(-2px), 0.2s
  fade-in: opacity 0→1 + translateY 6px→0, 0.3s ease-out
  pulse: @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
=================================
```

---

## PHASE 1 — 글로벌 레이아웃 & 사이드바

### 요청 목적
기존 단순 검색 중심 레이아웃을 → 워크스페이스 레이아웃으로 교체.
모든 페이지의 뼈대가 되는 레이아웃 컴포넌트.

```
[Design System v2 블록 붙여넣기]

Build the root workspace layout for "DocFlow AI — 올인원 문서 자동화 워크스페이스".
Replace the existing simple search-centered layout.
This is a full-screen workspace (like Notion or Linear), not a landing page.

========== LAYOUT STRUCTURE ==========

CSS Grid: `grid-template-columns: 220px 1fr`
Height: 100vh. Overflow: hidden. Background: #08080f.

========== LEFT SIDEBAR (220px) ==========

Background: #0b0b16.
Border-right: 1px solid rgba(255,255,255,0.06).
Display: flex flex-col. Height: 100vh.

--- LOGO AREA (padding: 18px 16px 14px) ---
Row: logo mark + product name
  Logo mark: 28px square, border-radius 8px,
             background gradient(135deg, #8b5cf6, #3b82f6),
             white "D" letter, font-size 14px, font-weight 800.
  Product name: "DocFlow AI" font-size 14px, font-weight 700,
                color #f1f1f8, letter-spacing -0.3px.
  Below name: "워크스페이스" font-size 10px, color rgba(255,255,255,0.28).

Divider: 1px solid rgba(255,255,255,0.05), margin 4px 0 12px.

--- NEW BUTTON ---
"+ 새 작업 시작" button.
Width: calc(100% - 24px). Margin: 0 12px 16px.
Height: 36px. Border-radius: 8px.
Background: gradient(135deg, #8b5cf6, #3b82f6).
Color: white. Font-size: 13px. Font-weight: 600.
Hover: brightness(1.1), box-shadow 0 0 16px rgba(139,92,246,0.35).

--- NAVIGATION SECTIONS ---
Each section has a label + items. Padding: 0 8px.

[SECTION 1 — 메인 기능] (no label, directly below button)
Nav items:
  홈         icon: Home        → /
  내 문서    icon: FolderOpen  → /documents    (active page example)

[SECTION 2 — label: "자동화"] margin-top 16px
Nav items:
  워크플로우   icon: Workflow (or GitBranch)  → /workflows
  공고 모니터  icon: Radar (or Bell)          → /announcements
  스케줄       icon: CalendarClock             → /schedule

[SECTION 3 — label: "변환 도구"] margin-top 16px
Nav items:
  파일 변환    icon: FileInput   → /convert
  템플릿       icon: LayoutTemplate → /templates

Nav item style:
  Height: 36px. Display flex. Align-items center. Gap: 10px.
  Padding: 0 10px. Border-radius: 8px. Cursor pointer.
  Icon: 15px, color rgba(255,255,255,0.4).
  Label: font-size 13px, color rgba(255,255,255,0.5).
  Transition: all 0.15s.
  
  Hover:  bg rgba(255,255,255,0.05), icon+text color rgba(255,255,255,0.85).
  Active: bg rgba(139,92,246,0.14),
          box-shadow inset 2px 0 0 #8b5cf6,
          icon color #a78bfa, text color #e9d5ff, font-weight 500.

Section label style:
  Font-size 10px, font-weight 600, letter-spacing 0.8px,
  color rgba(255,255,255,0.2), padding 6px 10px 4px,
  text-transform uppercase.

--- BOTTOM AREA (margin-top auto) ---
Divider: 1px solid rgba(255,255,255,0.05), margin 0 0 12px.
Padding: 0 8px 16px.

Help item:  icon Help, label "도움말"   (same nav item style)
Settings:   icon Settings, label "설정"

User profile row (padding: 8px 10px, border-radius 8px):
  Avatar: 30px circle, gradient bg, initials "U", font-size 12px.
  Name: "사용자" 13px font-weight 500.
  Email: "user@docflow.ai" 11px muted.
  Right: ChevronDown 12px muted.
  Hover: bg rgba(255,255,255,0.04).

========== MAIN CONTENT AREA ==========

Overflow-y: auto. Height: 100vh. Background: #08080f.

--- TOP HEADER BAR ---
Height: 54px. Padding: 0 28px.
Display: flex. Align-items: center. Justify-content: space-between.
Border-bottom: 1px solid rgba(255,255,255,0.05).
Background: rgba(8,8,15,0.8). Backdrop-filter: blur(12px).
Position: sticky. Top: 0. Z-index: 40.

Left: breadcrumb — "내 문서" / "전체" (font-size 13px, muted, slash separator).
      Current page name in text-primary.

Center: (empty for now)

Right: icon buttons row, gap 8px.
  Search icon button (magnifying glass): 32px, border 1px border-default, border-radius 8px.
  Notification bell: 32px, same style, with optional red dot badge (6px).
  User avatar: 30px circle, gradient, initials.

--- PAGE CONTENT SLOT ---
Padding: 28px. (children injected here per page)

========== TECH STACK ==========
- Next.js 14 App Router, TypeScript
- Tailwind CSS + lucide-react
- Pretendard font via CSS import in globals.css
- File: app/layout.tsx → Sidebar.tsx + Header.tsx
- "use client" on Sidebar for active state
- Export: RootLayout (default)
```

---

## PHASE 2 — 홈 대시보드

### 요청 목적
서비스에 처음 들어왔을 때 보이는 화면.
전체 작업 현황을 한눈에 파악하고 바로 시작할 수 있어야 함.

```
[Design System v2 블록 붙여넣기]

Build the Home Dashboard page for DocFlow AI.
This is the main overview page inside the workspace layout (sidebar already exists).
Content area only — no sidebar, no navbar.

========== PAGE CONTENT ==========

--- WELCOME SECTION (margin-bottom 32px) ---
Text: "안녕하세요 👋"  font-size 22px, font-weight 700, color #f1f1f8.
Sub: "오늘도 문서 업무를 AI에게 맡겨보세요."
     font-size 14px, color rgba(255,255,255,0.4). Margin-top 4px.
Date: current date string  font-size 12px, muted. Margin-top 2px.

--- QUICK ACTION CARDS (margin-bottom 36px) ---
Label: "빠른 시작" (section label style).
Grid: 2 columns, gap 12px.

Card 1 — 워크플로우 만들기:
  Background: rgba(139,92,246,0.1).
  Border: 1px solid rgba(139,92,246,0.25).
  Border-radius: 14px. Padding: 20px.
  Icon area: 40px square, border-radius 10px,
             bg rgba(139,92,246,0.2), violet icon (GitBranch, 20px).
  Title: "워크플로우 만들기" 15px, font-weight 600, margin-top 14px.
  Sub: "공고 모니터링부터 문서 생성, 컨펌까지 자동화"
       13px, color rgba(255,255,255,0.4), margin-top 4px, line-height 1.5.
  Bottom: "시작하기 →" link text, violet, font-size 13px, margin-top 16px.
  Hover: border-color rgba(139,92,246,0.5), bg rgba(139,92,246,0.15),
         transform translateY(-2px).

Card 2 — 파일 변환하기:
  Background: rgba(59,130,246,0.1).
  Border: 1px solid rgba(59,130,246,0.25).
  Same structure as Card 1 but blue tones.
  Icon: FileInput (blue).
  Title: "파일 → 문서 변환"
  Sub: "사진, 엑셀, 메모 등 어떤 파일이든 PPT·Word·PDF로"
  Link: "변환 시작 →" blue color.

--- STATS ROW (margin-bottom 36px) ---
Label: "이번 달 현황" (section label style).
Grid: 4 columns, gap 10px.

Each stat card:
  Background: rgba(255,255,255,0.03).
  Border: 1px solid rgba(255,255,255,0.06).
  Border-radius: 12px. Padding: 16px 18px.
  
  Top: icon (16px, muted) + label (11px, muted, uppercase letter-spacing).
  Middle: large number 28px, font-weight 700, color white.
  Bottom: change indicator — "+3 지난달 대비" 11px.
    Positive: green-400. Negative: red-400.

4 stats:
  1. FileText icon    / "생성 문서"     / 24개   / +8
  2. GitBranch icon   / "활성 워크플로우" / 3개    / +1
  3. CheckCircle icon / "완료 작업"     / 18건   / +5
  4. Clock icon       / "평균 생성시간"  / 1.8분  / -0.3분 (green, faster is good)

--- ACTIVE WORKFLOWS (margin-bottom 36px) ---
Label: "진행중인 워크플로우" + "전체보기 →" right-aligned link.

List: 3 rows, gap 8px.

Each workflow row:
  Background: rgba(255,255,255,0.025).
  Border: 1px solid rgba(255,255,255,0.06).
  Border-radius: 10px. Padding: 14px 16px.
  Display: flex. Align-items: center. Gap: 14px.

  Left: status dot (8px circle, pulsing if 진행중).
  Icon block: 36px square, border-radius 8px, bg by type,
              icon 16px.
  Info:
    Name: 14px, font-weight 500, color rgba(255,255,255,0.85).
    Meta: 12px, muted. Format: "마지막 실행: N분 전 · 다음: OO시"
  Right: status badge (see design system STATUS BADGES).
  Far right: three-dot menu icon (muted, visible on hover).

  Hover: bg rgba(255,255,255,0.04), border-color rgba(255,255,255,0.1).

Sample rows:
  1. ⚡ 정부 R&D 공고 모니터링 / 5분 전 실행 · 자동 / 진행중 badge
  2. 📋 중기부 공모전 지원서 자동 작성 / 2시간 전 / 검토중 badge
  3. 📊 주간 매출 보고서 자동 생성 / 오늘 09:00 / 완료 badge

--- RECENT DOCUMENTS (margin-bottom 36px) ---
Label: "최근 생성 문서" + "전체보기 →".

Grid: 3 columns, gap 10px.

Each doc card:
  Background: rgba(255,255,255,0.025).
  Border: 1px solid rgba(255,255,255,0.06).
  Border-radius: 12px. Padding: 16px.
  Hover: bg rgba(255,255,255,0.04), border-color rgba(255,255,255,0.1),
         transform translateY(-2px).

  Top row: type badge left + time right (11px muted).
  Title: 14px, font-weight 500, color rgba(255,255,255,0.82),
         margin 10px 0 4px, line clamp 2.
  Meta: 12px muted.
  Bottom: download icon button (14px, appears on hover).

Samples:
  1. PPT   / "2026 중소기업 디지털 전환 지원사업 지원서" / 방금 전
  2. WORD  / "스마트팩토리 구축 제안서"              / 1시간 전
  3. 분석  / "과기부 R&D 공고 적합성 분석 보고서"    / 어제

========== TECH ==========
- app/dashboard/page.tsx (or app/page.tsx)
- TypeScript, Tailwind
- All data: static mock
- Subtle fade-in animation on mount for each section (stagger 80ms)
```

---

## PHASE 3 — 워크플로우 빌더 메인

### 요청 목적
공고 자동 수집 → AI 분석 → 문서 초안 생성 → 담당자 컨펌 파이프라인을
시각적으로 구성하고 관리하는 핵심 화면.

```
[Design System v2 블록 붙여넣기]

Build the Workflow Builder main page for DocFlow AI.
This page has two sub-views toggled by a tab:
  Tab A: "내 워크플로우" — list of existing workflows
  Tab B: "새 워크플로우" — creation wizard

========== TAB A: 내 워크플로우 ==========

PAGE HEADER:
  Title: "워크플로우" H1 style.
  Sub: "공고 수집부터 컨펌까지, 반복 문서 업무를 자동화합니다."
  Right side: "+ 새 워크플로우" button (violet gradient, 36px height).

TAB BAR (margin 20px 0):
  ["내 워크플로우" | "공고 모니터링" | "실행 기록"]
  Active tab: bottom border 2px violet, text violet-400.
  Default: text muted.

WORKFLOW CARDS GRID (2 columns, gap 14px):

Each workflow card:
  Background: rgba(255,255,255,0.03).
  Border: 1px solid rgba(255,255,255,0.07).
  Border-radius: 14px. Padding: 20px.
  Hover: border-color rgba(139,92,246,0.3),
         bg rgba(139,92,246,0.05), translateY(-2px).

  TOP ROW:
    Left: status badge (진행중/일시정지/완료).
    Right: toggle switch (on/off), 32px wide, violet when on.

  TITLE (margin-top 12px):
    14px font-weight 600, color rgba(255,255,255,0.88).

  DESCRIPTION (margin-top 4px):
    12px muted, line-clamp 2.

  PIPELINE PREVIEW (margin-top 16px):
    Horizontal mini flow showing steps as small pills.
    Pills: each step name, connected by → arrow.
    Pill style: 10px font, bg rgba(255,255,255,0.07),
                border-radius 4px, padding 3px 8px.
    Arrow: small → text, muted.
    Show max 4 steps, truncate rest as "+N개".

  STATS ROW (margin-top 14px, border-top border-default, padding-top 12px):
    3 mini stats side by side:
    "실행: 24회" / "성공률: 96%" / "마지막: 2시간 전"
    Font-size: 11px. Color: muted.

  BOTTOM ACTIONS (margin-top 12px):
    Left: "실행 기록 보기" text link (12px, muted).
    Right: Edit icon + Play icon buttons (14px, muted, hover violet).

SAMPLE CARDS (4 cards):

Card 1:
  Status: 진행중
  Title: "정부 R&D 공모전 자동 지원서 생성"
  Desc: "과기부, 중기부 공고를 매일 수집하여 적합 공고 발견 시 지원서 초안 자동 생성 및 슬랙 알림"
  Pipeline: 공고수집 → AI분석 → 초안생성 → 컨펌요청
  Stats: 실행 47회 / 성공 98% / 1시간 전

Card 2:
  Status: 진행중
  Title: "중소기업 지원사업 모니터링"
  Desc: "중소벤처기업부 공고 RSS 구독, 사업 적합성 점수 산출 후 주간 보고서 생성"
  Pipeline: RSS수집 → 적합성분석 → 점수산출 → 보고서생성
  Stats: 실행 12회 / 성공 100% / 어제

Card 3:
  Status: 일시정지
  Title: "주간 실적 보고서 자동 생성"
  Desc: "매주 월요일 9시, 지난주 데이터를 집계하여 PPT 보고서 생성 후 이메일 발송"
  Pipeline: 데이터수집 → 요약분석 → PPT생성 → 이메일발송
  Stats: 실행 8회 / 성공 87% / 3일 전

Card 4:
  Status: 완료 (일회성)
  Title: "2025 창업진흥원 지원서 패키지"
  Desc: "사업계획서, 재무계획, 팀 소개 자료를 일괄 생성한 완료된 워크플로우"
  Pipeline: 요건분석 → 사업계획서 → 재무계획 → 팀소개
  Stats: 실행 3회 / 성공 100% / 2주 전

EMPTY STATE (when no workflows):
  Centered. Icon: GitBranch 48px muted.
  Title: "아직 워크플로우가 없습니다"
  Sub: "반복되는 문서 업무를 자동화해 보세요"
  CTA: "+ 첫 워크플로우 만들기" violet gradient button.

========== TAB B: 새 워크플로우 (위저드) ==========

3-STEP WIZARD HEADER:
  Horizontal step indicator at top.
  Step 1: "기본 설정"  Step 2: "단계 구성"  Step 3: "트리거 설정"
  Active step: violet circle with number, violet text.
  Done step: checkmark circle, muted.
  Inactive: gray circle, muted.
  Connected by thin horizontal line.

--- STEP 1: 기본 설정 ---

Max-width: 560px. Margin: 32px auto. Display: flex flex-col, gap 20px.

Field — 워크플로우 이름:
  Label: "이름" (label style).
  Input: full width, height 42px, bg rgba(255,255,255,0.04),
         border 1px border-default, border-radius 10px,
         padding 0 14px, font-size 14px, color white.
  Placeholder: "예: 정부 R&D 공모전 지원서 자동화"
  Focus: border-color rgba(139,92,246,0.5),
         box-shadow 0 0 0 3px rgba(139,92,246,0.1).

Field — 목적 선택 (카드 그리드):
  Label: "이 워크플로우의 목적은?"
  2x2 card grid, gap 10px.
  
  Option cards (selectable):
    Default: border border-default, bg rgba(255,255,255,0.02).
    Selected: border border-violet, bg rgba(139,92,246,0.1),
              violet checkmark top-right.
    
    4 options:
    1. icon Bell     / "공고 모니터링"   / "공모전·정부사업 자동 수집 분석"
    2. icon FileText / "문서 자동 생성"  / "반복 문서를 자동으로 만들기"
    3. icon Send     / "결재·컨펌 자동화" / "검토 요청 및 승인 플로우"
    4. icon RefreshCw / "정기 보고서"    / "주/월간 보고서 자동 발행"

Field — 설명 (optional):
  Label: "설명 (선택)"
  Textarea: 3 rows, same style as input.
  Placeholder: "이 워크플로우가 어떤 일을 하는지 간단히 설명하세요"

Bottom: "다음 단계 →" button right-aligned, violet gradient.

--- STEP 2: 단계 구성 ---
(Show after Step 1 is complete)

Label: "자동화 단계를 구성하세요"
Sub: "드래그로 순서를 바꾸고, + 버튼으로 단계를 추가합니다."

PIPELINE CANVAS:
  Vertical list of step blocks, connected by dashed vertical line.
  
  Each step block:
    Background: rgba(255,255,255,0.03).
    Border: 1px border-default. Border-radius: 12px. Padding: 16px.
    Left: drag handle (⠿ icon, 3x2 dots, 16px, muted).
    Icon area: 32px, rounded, colored by step type.
    Step name: 14px, font-weight 500.
    Sub: step type label (12px muted).
    Right: Edit icon + Delete icon (hover reveal).
  
  Connector line between blocks:
    Dashed vertical line 1.5px, muted, with "→" label in center.
  
  ADD STEP button between each block:
    Small "+" circle (24px), dashed border, muted.
    Hover: solid violet border, violet "+".
  
  ADD STEP at bottom:
    Dashed border card, full width, centered "+" icon + "단계 추가".
    Hover: violet border.

STEP TYPE DRAWER (slide in from right when adding):
  Width: 300px. Background: #0e0e1a.
  Border-left: border-default.
  Title: "단계 선택". Close X button.
  
  Category list with step options:
  
  [수집] icon Rss
    공고 RSS 수집        → 정부24, 공고알리미 등
    웹 크롤링            → 특정 URL 주기적 수집
    이메일 수신          → 메일 트리거
  
  [AI 분석] icon Brain
    공고 적합성 분석     → 키워드 매칭 + LLM 분석
    문서 요약            → 핵심 내용 추출
    데이터 추출          → 구조화된 정보 파싱
  
  [문서 생성] icon FileOutput
    PPT 자동 생성
    Word 문서 생성
    PDF 계약서 생성
    분석 보고서 생성
  
  [알림·컨펌] icon Bell
    이메일 발송
    슬랙 메시지
    컨펌 요청 (승인/반려)
    카카오 알림톡

Default pipeline (pre-populated for 공고 모니터링 type):
  1. 공고 RSS 수집     (Rss icon, blue)
  2. AI 적합성 분석    (Brain icon, violet)
  3. 지원서 초안 생성  (FileText icon, orange)
  4. 컨펌 요청 발송    (Bell icon, green)

Bottom: "← 이전" + "다음 단계 →" buttons.

--- STEP 3: 트리거 설정 ---

Label: "언제 실행할까요?"

TRIGGER OPTIONS (radio card style, 2 columns):
  1. ⏰ 정해진 시간마다
     Sub: 매일, 매주 등 반복 실행
     When selected: show schedule builder
       [매일 / 매주 / 매월] select + [시간] time picker (9:00 AM style)
  
  2. 🔔 특정 조건 감지 시
     Sub: 새 공고 등록, 키워드 발견 등
     When selected: show keyword input + source selector
  
  3. 📁 파일 업로드 시
     Sub: 파일이 업로드되면 즉시 실행
  
  4. ▶ 수동 실행
     Sub: 버튼 클릭 시에만 실행

NOTIFICATION SETTINGS:
  Label: "완료 알림 받기"
  Toggle options (multi-select chips):
    이메일 / 슬랙 / 카카오톡
  Email input field if 이메일 selected.

Bottom: "← 이전" + "워크플로우 저장 ✓" button (violet gradient, larger).

========== TECH ==========
- app/workflows/page.tsx
- TypeScript, Tailwind, lucide-react
- Tab state with useState
- Wizard step state with useState (step: 1|2|3)
- All interactions client-side only, no API
- "use client" directive
```

---

## PHASE 4 — 공고 모니터링 화면

### 요청 목적
수집된 공모전·정부사업 공고를 보고, AI 분석 결과와 적합성 점수를 확인하는 화면.

```
[Design System v2 블록 붙여넣기]

Build the Announcement Monitoring page for DocFlow AI.
This page shows collected government/competition announcements
with AI analysis scores and action buttons.

========== PAGE HEADER ==========

Title: "공고 모니터링"
Sub: "AI가 공모전·정부사업 공고를 자동 수집하고 적합성을 분석합니다."

Right header actions:
  "필터" button (Filter icon, border style).
  "소스 설정" button (Settings icon, border style).
  "+ 수집 소스 추가" button (violet gradient).

========== STATS STRIP (margin-bottom 24px) ==========

4 stat pills in a horizontal row (not cards, just inline stats):
  "오늘 수집: 23건"  /  "분석 완료: 21건"  /  "높은 적합도: 5건"  /  "마감 임박: 3건"
  Each: bg rgba(255,255,255,0.05), border border-default,
        padding 6px 14px, border-radius 9999px, font-size 12px.
  "마감 임박" pill: amber color, amber border.
  "높은 적합도" pill: violet color, violet border.

========== FILTER BAR (margin-bottom 20px) ==========

Row: display flex, gap 10px, align-items center.

  Search: icon + input, width 260px.
  Category select: "전체 카테고리" / "R&D" / "창업지원" / "수출지원" / "제조혁신"
  Org select: "전체 기관" / "과학기술정보통신부" / "중소벤처기업부" / "산업통상자원부"
  Sort select: "최신순" / "마감임박순" / "적합도순"
  Score filter: "전체 점수" / "80점 이상" / "60-80점" / "60점 미만"

========== ANNOUNCEMENT LIST ==========

Display: flex flex-col, gap 10px.

Each announcement card:
  Background: rgba(255,255,255,0.025).
  Border: 1px solid rgba(255,255,255,0.07).
  Border-radius: 14px. Padding: 20px.
  Display: grid. Grid-template-columns: 1fr auto.
  Gap: 20px. Align-items: start.

  LEFT COLUMN:
  
    TOP ROW: category badge + org name + new badge (if < 24h).
      Category badge: small colored pill (R&D=blue, 창업=violet, 수출=green, etc).
      Org: 12px muted.
      New badge: "NEW" 10px, amber bg, amber text, pulse dot.
    
    TITLE (margin-top 8px):
      16px font-weight 600, color rgba(255,255,255,0.9).
      Hover: color white.
      Line-clamp 2.
    
    AI SUMMARY (margin-top 8px):
      Label: small "AI 요약" pill (10px, violet, violet bg).
      Text: 13px muted, line-clamp 2, line-height 1.6.
      This shows the AI-generated 1-2 sentence summary.
    
    METADATA ROW (margin-top 12px):
      Display flex, gap 16px, font-size 12px, muted.
      Items: "공고일: 2026.04.01" / "마감: 2026.04.30" / "지원금: 최대 5억원"
      
      DEADLINE INDICATOR: 
        If < 7 days: show "D-N" badge in red-400.
        If < 14 days: amber.
        Else: muted.
    
    KEYWORD TAGS (margin-top 10px):
      Matched keywords highlighted as small pills.
      Style: 10px, bg rgba(139,92,246,0.15), color #c4b5fd,
             border-radius 4px, padding 2px 6px.
      Show up to 5 keywords, rest as "+N".

  RIGHT COLUMN (width: 200px, text-align: right):
  
    AI SCORE DIAL:
      Large number: score (e.g. "87") font-size 32px, font-weight 800.
      Score color: ≥80 violet, 60-79 amber, <60 muted.
      Unit: "점" font-size 14px, muted, next to number.
      Sub: "AI 적합도" 11px muted.
      Progress bar below: thin 4px bar, width matches score%,
                          colored by score, bg rgba(255,255,255,0.06).
    
    ACTION BUTTONS (margin-top 16px, display flex flex-col gap 8px):
      "지원서 자동 생성" — primary, violet bg, height 34px,
                           font-size 12px, font-weight 600.
      "상세 분석 보기"   — secondary, border style, height 34px.
      
      Hover on primary: box-shadow 0 0 12px rgba(139,92,246,0.4).

  CARD HOVER: border-color rgba(139,92,246,0.25), bg rgba(139,92,246,0.04).
  
  HIGH SCORE CARD (≥80점): 
    Left border: 3px solid #8b5cf6.
    Background: rgba(139,92,246,0.05).
    Border: 1px solid rgba(139,92,246,0.2).

SAMPLE ANNOUNCEMENTS (5 items):

1. Score 92 | R&D | 과학기술정보통신부
   "2026년 중소기업 AI·디지털 전환 기술개발 지원사업"
   Summary: "AI 기반 제조공정 혁신 기술 개발에 최대 5억원 지원. 3년간 연구비 지원."
   D-12 / 지원금 5억 / 키워드: AI, 제조혁신, 중소기업

2. Score 78 | 창업지원 | 중소벤처기업부
   "2026 초기창업패키지 3차 모집 공고"
   Summary: "창업 3년 이내 기업 대상, 최대 1억원 사업화 자금 지원."
   D-5 (red) / 지원금 1억 / 키워드: 창업, 초기, 사업화

3. Score 65 | 수출지원 | 산업통상자원부
   "글로벌 강소기업 1000+ 수출바우처 지원사업"
   Summary: "수출 유망 중소기업 대상 글로벌 마케팅·통번역·특허 서비스 지원."
   D-21 / 지원금 3천만원 / 키워드: 수출, 글로벌, 마케팅

4. Score 88 | R&D | 과학기술정보통신부 — NEW 배지
   "클라우드·SaaS 기반 소프트웨어 개발 지원사업 공고"
   Summary: "SaaS 제품 개발 및 글로벌 진출을 위한 기술개발비 최대 2억 지원."
   D-30 / 지원금 2억 / 키워드: SaaS, 클라우드, 소프트웨어

5. Score 45 | 제조혁신 | 산업통상자원부
   "뿌리산업 스마트화 지원사업"
   Summary: "주조·단조·용접 등 뿌리기술 기반 제조업 스마트공장 구축 지원."
   D-45 / 지원금 4억 / 키워드: 제조, 스마트공장

========== PAGINATION ==========
Bottom: "1 2 3 ... 12" pagination, centered, muted style.

========== TECH ==========
- app/announcements/page.tsx
- TypeScript, Tailwind
- All static mock data
- Filter/search: client-side state only (no actual filtering needed, just UI)
```

---

## PHASE 5 — 파일 → 문서 변환 화면

### 요청 목적
파일 업로드 → AI 분석 → 원하는 형식으로 문서 자동 생성하는 핵심 기능 화면.

```
[Design System v2 블록 붙여넣기]

Build the File-to-Document Conversion page for DocFlow AI.
Users upload any file and AI converts/restructures it into PPT, Word, PDF, etc.
This page has 3 states: UPLOAD / ANALYZING / RESULT.
Show all 3 states stacked vertically for mockup (wrap each in a section with a state label).

========== STATE 1: UPLOAD ==========

CENTER LAYOUT: max-width 640px, margin: 0 auto, padding-top 24px.

HEADER:
  Title: "파일 → 문서 변환"
  Sub: "어떤 파일이든 올려주세요. AI가 분석해 원하는 문서로 만들어드립니다."

DROPZONE:
  Size: full width, height 220px.
  Background: rgba(255,255,255,0.025).
  Border: 2px dashed rgba(255,255,255,0.12).
  Border-radius: 16px.
  Display: flex flex-col, align-items center, justify-content center. Gap: 12px.
  
  Icon: UploadCloud, 40px, color rgba(255,255,255,0.2).
  Text: "파일을 드래그하거나 클릭해서 올리세요" 14px rgba(255,255,255,0.45).
  Sub: "PDF, Word, Excel, PowerPoint, 이미지, 텍스트 · 최대 50MB"
       12px muted.
  
  "파일 선택" button: mt-16px, border style, violet color, 36px.
  
  Drag-over state (show as variant):
    Border: 2px solid #8b5cf6.
    Background: rgba(139,92,246,0.08).
    UploadCloud icon: violet color, scale 1.1.

SUPPORTED FORMATS ROW (margin-top 16px):
  Horizontal chips: "PDF" "Word" "Excel" "PPT" "이미지" "텍스트" "CSV"
  Each: 10px, border border-default, rounded-full, padding 3px 10px,
        muted text. Non-interactive (decorative).

OUTPUT FORMAT SELECTOR (margin-top 28px):
  Label: "변환할 문서 형식"
  Grid: 2 columns, 5 option cards + 1 coming-soon.
  
  Option cards (selectable, single select):
    Default: border border-default, bg rgba(255,255,255,0.02).
    Selected: border-color by type, bg tinted.
    
    Cards:
    1. icon: BarChart2 (violet) / "PPT 프레젠테이션" / "슬라이드 자동 구성"
    2. icon: FileText (blue)   / "Word 문서"        / "서식 있는 문서"
    3. icon: FileCode (amber)  / "PDF 보고서"       / "인쇄·배포용"
    4. icon: Table (green)     / "Excel 정리"       / "데이터 표 구성"
    5. icon: FileSearch (orange)/ "AI 분석 보고서"  / "심층 분석 + 인사이트"

ADDITIONAL INSTRUCTIONS (margin-top 20px):
  Label: "추가 지시사항 (선택)"
  Textarea: 3 rows.
  Placeholder: "예: 임원 보고용으로 만들어줘. 3페이지 이내로. 수치 강조해줘."

CONVERT BUTTON:
  Full width. Height: 46px. Gradient bg. Font-size 15px, font-weight 600.
  Icon: Wand2, 16px, white.
  Text: "AI 문서 변환 시작"
  Disabled style when no file: opacity 0.4, cursor not-allowed.

========== STATE 2: ANALYZING (Progress) ==========

Background panel: same dropzone area replaced with progress UI.
Max-width: 640px, margin: 0 auto.

FILE INFO ROW:
  Icon by file type (32px, colored).
  Filename: 14px, font-weight 500.
  Filesize: 12px muted.
  Right: X button to cancel.

PROGRESS STEPS (vertical timeline):
  5 steps, similar to generate page but with different content.
  
  Steps:
  1. 파일 읽기 및 파싱        ✓ 완료
  2. 콘텐츠 구조 분석         ✓ 완료
  3. AI 문서 구조 설계        ● 진행중 (pulsing)
  4. 섹션별 콘텐츠 생성       ○ 대기
  5. 파일 렌더링 및 최적화    ○ 대기

Progress bar:
  Full width. Height: 4px. Border-radius 2px.
  Background: rgba(255,255,255,0.06).
  Fill: violet gradient, width 55% (for step 3 active).
  Animated: shimmer effect on fill.

Status text (below bar):
  "AI가 문서 구조를 설계하고 있습니다... (3/5)" 13px muted.
  Typewriter/changing text showing AI actions.

Cancel button: small, text style, muted, "변환 취소".

========== STATE 3: RESULT ==========

Two-column layout. Gap: 24px.

LEFT (flex 3) — PREVIEW PANEL:

  Header row: "변환 완료" green checkmark badge + time taken "8.4초".
  
  Document preview card:
    White background (simulating actual document).
    Border-radius: 10px. Padding: 28px 32px. Aspect-ratio: flexible.
    
    For PPT type preview:
      Aspect 16:9. Show first slide with title + content.
      Bottom: slide navigation (dots + arrows).
    
    For Word/PDF type preview:
      Show text document with title, section headings, body text.
      Max height: 380px. Overflow: hidden with fade gradient bottom.
      "전체 보기" link below.
  
  Page count / slide count indicator below preview.

RIGHT (flex 2) — ACTION PANEL:

  Quality metrics (mini cards row, 3 items):
    "완성도 96%" / "페이지 수 8p" / "예상 소요 시간 3분"
    Each: small bg card, icon + label + value.

  Download section:
    Primary download button (full width, violet gradient, 46px):
      "다운로드" with Download icon.
    
    Format conversion row below:
      "다른 형식으로 변환:" + chips [PPT] [PDF] [Word]
      Click: re-convert with different format.

  Re-edit instructions:
    Label: "수정 지시"
    Textarea (2 rows). Placeholder: "수정 요청을 입력하세요. 예: 표지 추가해줘"
    "재생성" button (small, right-aligned).

  Share / Store:
    Row: "내 문서함에 저장" checkbox (checked) + "공유 링크 생성" button.

========== CONVERSION HISTORY (below main area) ==========

Label: "최근 변환 기록" (section label style).

Table/list: 5 rows. Compact style.
Columns: 파일명(원본) / 변환 형식 badge / 변환 일시 / 파일 크기 / 다운로드 icon.

5 sample rows.

========== TECH ==========
- app/convert/page.tsx
- "use client", useState for state: 'upload' | 'analyzing' | 'result'
- File drag-drop: show border change on dragover
- All 3 states visible stacked for mockup review
- TypeScript, Tailwind, lucide-react
```

---

## PHASE 6 — 컨펌·승인 요청 화면

### 요청 목적
AI가 생성한 문서 초안을 담당자가 검토·승인·반려하는 화면.
공고 지원서 워크플로우의 마지막 단계.

```
[Design System v2 블록 붙여넣기]

Build the Document Review & Approval page for DocFlow AI.
This is where team members review AI-generated documents and approve or reject them.

========== PAGE HEADER ==========

Title: "컨펌 요청함"
Sub: "AI가 생성한 문서 초안을 검토하고 승인하세요."
Right: filter tabs — ["전체" "검토 대기" "승인됨" "반려됨"]
  Tab style: pill, active violet.

SUMMARY STRIP:
  "대기중 3건" (amber dot) / "오늘 마감 1건" (red dot) / "이번 주 완료 5건" (green dot).

========== REVIEW CARDS LIST ==========

Each review card (urgent card shown first):

URGENT CARD (마감 D-1):
  Left border: 3px solid #f87171.
  Background: rgba(248,113,113,0.06).
  Top badge: "⚡ 긴급 · 오늘 마감".

NORMAL CARD structure:
  Background: rgba(255,255,255,0.03).
  Border: 1px border-default. Border-radius: 14px. Padding: 20px.
  
  TOP ROW:
    Left: status badge (검토 대기 = amber pill).
    Center: workflow name (12px muted).
    Right: deadline "마감 D-3" (amber if <7).
  
  TITLE (margin-top 10px):
    16px font-weight 600.
    Example: "2026 중소기업 AI 전환 지원사업 지원서"
  
  META ROW (margin-top 6px, 12px muted, flex gap 16px):
    기관: 중소벤처기업부 / 사업비: 최대 3억원 / AI 적합도: 88점
  
  DOCUMENT PREVIEW STRIP (margin-top 14px):
    Horizontal strip showing document thumbnails.
    3 small cards side by side, each 140px wide, height 90px.
    White bg, border-radius 8px.
    Shows miniature document preview (title text, horizontal lines for content).
    Labeled: "사업계획서 6p" / "재무계획서 3p" / "팀 소개 2p"
    
  AI SUMMARY BOX (margin-top 12px):
    Background: rgba(139,92,246,0.08).
    Border: 1px solid rgba(139,92,246,0.2).
    Border-radius: 8px. Padding: 12px 14px.
    Label: "AI 분석 요약" (10px violet uppercase).
    Text: 13px, violet-100 color. 2-3 lines of summary text.
  
  REQUEST INFO (margin-top 12px, 12px muted):
    "요청자: AI 자동화 시스템 · 요청 시각: 2시간 전"
  
  ACTION BUTTONS (margin-top 16px, border-top border-default, padding-top 14px):
    Left: "문서 검토" link (icon ExternalLink, violet, 13px).
          "상세 보기" link (muted, 13px).
    Right: 
      "반려" button: border 1px red-400/30, color red-400, padding 8px 20px.
              Hover: bg rgba(248,113,113,0.1).
      "승인" button: bg violet gradient, color white, padding 8px 20px.
              Hover: brightness(1.1).

SAMPLE CARDS (3):

Card 1 (Urgent):
  Status: 검토 대기 / D-1 red
  Title: "2026 창업진흥원 초기창업패키지 지원서 (3차)"
  Meta: 창업진흥원 / 최대 1억원 / 적합도 91점
  Docs: 사업계획서 8p / 팀소개 2p / 재무계획 3p
  Summary: "사업 적합성 점수 91점. 'AI 기반 자동화'가 핵심 선정 키워드와 일치. 재무계획 보완 권고."

Card 2 (Normal):
  Status: 검토 대기 / D-5
  Title: "과학기술정보통신부 R&D 사업화 지원 신청서"
  Meta: 과기부 / 최대 5억원 / 적합도 84점
  Docs: 기술개발계획서 10p / 사업화전략 5p / 예산계획 4p
  Summary: "기술 독창성 항목 우수. 사업화 전략 구체성 추가 보완 필요. 전반적 완성도 높음."

Card 3 (Normal, 검토중):
  Status: 검토중 / D-12
  Title: "중소기업 스마트공장 구축 지원사업 신청서"
  Meta: 중기부 / 최대 3억원 / 적합도 72점
  (slightly muted as it's already being reviewed)

========== COMPLETED SECTION ==========

Collapsible section: "완료된 컨펌 (5건)" with chevron toggle.
When expanded: compact list showing completed items in muted style.
Each: checkmark icon + title + "승인됨/반려됨" badge + date.

========== TECH ==========
- app/approvals/page.tsx
- TypeScript, Tailwind, lucide-react
- useState for tab filter (전체/대기/승인/반려)
- useState for collapsed section
- "use client"
```

---

## 수정 프롬프트 — 전체 공통 적용

### 공통 인터랙션 & 애니메이션

```
[모든 화면 완성 후 마지막에 적용]

Add the following micro-interactions to ALL DocFlow AI pages:

1. SIDEBAR ACTIVE STATE ANIMATION:
   When navigating to a new page, active nav item:
   - background fades in (opacity 0→1, 0.2s)
   - left border slides in from top (scaleY 0→1, 0.15s)

2. PAGE TRANSITION:
   Each page content area: fade-in + slight translateY up on mount.
   @keyframes pageIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
   animation: pageIn 0.35s ease-out.

3. CARD INTERACTIONS:
   All clickable cards: transition: all 0.18s ease.
   Hover: translateY(-2px).
   Active (mousedown): translateY(0px), brightness(0.95).

4. STATUS BADGE PULSE:
   "진행중" status dots: 
   @keyframes statusPulse {
     0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.6) }
     50% { box-shadow: 0 0 0 5px transparent }
   }
   animation: statusPulse 1.8s ease infinite.

5. SCORE BAR ANIMATION (announcements page):
   On card mount, progress bar width animates from 0 to target %.
   Duration: 0.6s, ease-out. Add 100ms delay per card (stagger).

6. WORKFLOW PIPELINE CONNECTOR:
   Dashed connector line between steps:
   @keyframes dash { to { stroke-dashoffset: -20 } }
   For active workflows: animate the dash (gives "flowing" feel).

7. TOAST NOTIFICATIONS:
   Create a global Toast component (top-right, z-50).
   Slide in from right: translateX(100%)→0, 0.25s.
   Auto-dismiss after 3s with fade-out.
   Variants: success (green left border) / error (red) / info (violet).

8. BUTTON LOADING STATE:
   All primary action buttons: when clicked, show spinner (16px rotating circle)
   replacing the left icon. Text stays.
   Disable button during loading.

@media (prefers-reduced-motion: reduce) { 
  *, *::before, *::after { 
    animation-duration: 0.01ms !important; 
    transition-duration: 0.01ms !important; 
  } 
}

Apply these to all existing components.
TypeScript, Tailwind CSS.
```

---

## Claude Code 인계 프롬프트

> Antigravity에서 각 화면 코드를 받은 후,
> Claude Code에 붙여넣어 실제 기능 연결.

```
아래는 Antigravity로 생성한 DocFlow AI 프론트엔드야.
다음 작업을 TASKS.md 순서에 맞춰 처리해줘.

[연결 작업 목록]

1. 레이아웃 (PHASE 1):
   - app/layout.tsx에 Sidebar + Header 통합
   - active 상태는 next/navigation의 usePathname() 사용
   - 모바일 < 1024px: sidebar hidden + hamburger toggle

2. 대시보드 (PHASE 2):
   - GET /api/stats → 통계 카드 데이터 연결
   - GET /api/workflows?limit=3 → 활성 워크플로우 목록
   - GET /api/documents?limit=3 → 최근 문서 목록
   - SWR 사용해서 30초 자동 갱신

3. 워크플로우 (PHASE 3):
   - GET /api/workflows → 목록
   - POST /api/workflows → 위저드 Step 3 완료 시 저장
   - PATCH /api/workflows/:id/toggle → 토글 스위치

4. 공고 모니터링 (PHASE 4):
   - GET /api/announcements?page=1&limit=10&sort=score → 목록
   - POST /api/announcements/:id/generate → "지원서 자동 생성" 버튼
   - 필터: URL query string으로 관리 (useSearchParams)

5. 파일 변환 (PHASE 5):
   - POST /api/convert (multipart/form-data) → 변환 시작
   - GET /api/convert/:job_id/status → polling (2초 간격)
   - GET /api/files/:file_id → 다운로드
   - 드래그앤드롭: react-dropzone 사용

6. 컨펌 요청 (PHASE 6):
   - GET /api/approvals?status=pending → 목록
   - POST /api/approvals/:id/approve → 승인
   - POST /api/approvals/:id/reject + { reason } → 반려

공통:
- 에러: global Toast로 표시
- 로딩: skeleton UI (기존 목 데이터 자리에 shimmer)
- 타입 정의: types/api.ts에 분리
- API base: NEXT_PUBLIC_API_URL 환경변수
```

---

## 진행 순서 요약

```
Day 1:  PHASE 1 (레이아웃 + 사이드바) → 모든 화면 뼈대 완성
Day 2:  PHASE 2 (홈 대시보드)
Day 3:  PHASE 3 (워크플로우 빌더)
Day 4:  PHASE 4 (공고 모니터링)
Day 5:  PHASE 5 (파일 변환)
Day 6:  PHASE 6 (컨펌 요청함)
Day 7:  수정 프롬프트 (인터랙션 전체 적용)
Day 8~: Claude Code로 API 연결
```
