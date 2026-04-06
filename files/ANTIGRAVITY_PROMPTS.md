# ANTIGRAVITY_PROMPTS.md
# DocFlow AI — GenSpark 스타일 프론트엔드 디자인 요청서

> Antigravity에 아래 프롬프트를 그대로 복붙해서 사용한다.
> 화면 순서대로 진행하고, 각 화면 완성 후 [수정 프롬프트]로 세부 조정한다.

---

## 디자인 시스템 (모든 화면 공통)

```
Design System — DocFlow AI

Colors:
  Background primary:   #0a0a0f
  Background card:      #0f0f1a
  Background elevated:  #14141f
  Sidebar background:   #0d0d14
  Accent primary:       #6366f1  (Indigo)
  Accent hover:         #4f46e5
  Accent glow:          rgba(99,102,241,0.25)
  Text primary:         #ffffff
  Text secondary:       rgba(255,255,255,0.55)
  Text muted:           rgba(255,255,255,0.28)
  Border default:       rgba(255,255,255,0.07)
  Border hover:         rgba(255,255,255,0.13)
  Border accent:        rgba(99,102,241,0.4)

Type badges:
  PPT:      background rgba(99,102,241,0.18)  text #a5b4fc
  EXCEL:    background rgba(16,185,129,0.18)  text #6ee7b7
  PDF:      background rgba(245,158,11,0.18)  text #fcd34d
  CONTRACT: background rgba(236,72,153,0.18)  text #f9a8d4

Typography:
  Font: Geist (next/font/google) — fallback: system-ui
  Heading: font-weight 700, letter-spacing -0.03em
  Body: font-weight 400, line-height 1.65
  Label: font-weight 500, letter-spacing 0.02em

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
Border radius: button=8px, card=12px, input=14px, pill=9999px

Motion:
  Transition default: all 0.18s ease
  Hover lift: translateY(-1px)
  Fade in: opacity 0→1, translateY 8px→0, duration 0.3s
```

---

## SCREEN 01 — 메인 홈 (랜딩 + 입력)

> GenSpark의 검색 중심 홈과 동일한 구조.
> 모든 기능의 진입점이 되는 핵심 화면.

```
Build the main home page for "DocFlow AI" — an AI document automation SaaS.
Inspired by GenSpark's centered search interface. Dark theme throughout.

---

## NAVBAR

Height: 60px. Background: rgba(10,10,15,0.85), backdrop-filter: blur(16px).
Border-bottom: 1px solid rgba(255,255,255,0.06). Position: sticky top-0, z-50.

Left: Logo — "Doc" in white (font-weight 700) + "Flow" in #6366f1 + " AI" in white.
     Font-size 17px, letter-spacing -0.5px.

Center: Nav links — "기능" / "템플릿" / "요금제"
     Font-size 13px, color rgba(255,255,255,0.45).
     Hover: color rgba(255,255,255,0.85), transition 0.15s.

Right: Two buttons side by side, gap 8px.
  "로그인" — transparent bg, border 1px solid rgba(255,255,255,0.12),
             color rgba(255,255,255,0.55), padding 7px 16px, border-radius 8px.
  "무료 시작" — bg #6366f1, color white, padding 7px 16px, border-radius 8px,
               hover: bg #4f46e5, box-shadow 0 0 16px rgba(99,102,241,0.35).

---

## HERO SECTION

Container: min-height calc(100vh - 60px).
Display: flex, flex-direction column, align-items center, justify-content center.
Padding: 0 24px. Padding-bottom: 80px (to offset from true center slightly upward).

Elements top to bottom, center aligned, gap between each as specified:

[1] BADGE PILL  (margin-bottom: 24px)
    Text: "✦ AI 문서 자동화 플랫폼"
    Style: font-size 12px, font-weight 500, letter-spacing 0.4px,
           color #a5b4fc, background rgba(99,102,241,0.13),
           border 1px solid rgba(99,102,241,0.3),
           padding 5px 14px, border-radius 9999px.

[2] HEADLINE  (margin-bottom: 16px)
    Line 1: "말 한마디로"
    Line 2: "완성되는 문서"  ← this line color: #6366f1
    Font-size: 42px. Font-weight: 800. Letter-spacing: -1.5px. Line-height: 1.1.
    Text-align: center.

[3] SUBHEADLINE  (margin-bottom: 40px)
    "PPT · 엑셀 · 계약서 · 보고서를 자연어 명령 하나로 즉시 생성"
    Font-size: 15px. Color: rgba(255,255,255,0.42). Text-align: center.

[4] COMMAND INPUT BOX  (margin-bottom: 16px)
    Width: 100%. Max-width: 680px.
    Background: rgba(255,255,255,0.04).
    Border: 1px solid rgba(255,255,255,0.09).
    Border-radius: 16px.
    Padding: 6px 6px 6px 18px.
    Display: flex, align-items flex-end, gap 8px.
    On focus-within: border-color rgba(99,102,241,0.5),
                     box-shadow 0 0 0 3px rgba(99,102,241,0.12).
    Transition: all 0.2s.

    Inside left: <textarea>
      Placeholder: "어떤 문서가 필요하신가요?  예: 강남구 아파트 시세 분석 PPT 6슬라이드"
      Placeholder color: rgba(255,255,255,0.22).
      Background: transparent. Border: none. Outline: none.
      Color: white. Font-size: 14px. Line-height: 1.6.
      Resize: none. Min-height: 52px. Max-height: 180px.
      Padding: 12px 0. Flex: 1.
      Auto-resize on input (JS: element.style.height = element.scrollHeight + 'px').

    Inside right bottom: Send button
      Size: 38px × 38px. Background: #6366f1. Border-radius: 10px. Border: none.
      Icon: right-arrow SVG (→), white, 16px.
      Hover: bg #4f46e5, box-shadow 0 0 12px rgba(99,102,241,0.45).
      Margin-bottom: 5px.

[5] FORMAT CHIPS ROW  (margin-bottom: 28px)
    Display: flex, gap 8px, flex-wrap wrap, justify-content center.
    Chips: ["전체", "PPT 슬라이드", "엑셀 정산", "계약서", "보고서 PDF"]
    Default chip style:
      font-size 12px, padding 6px 14px, border-radius 9999px,
      border 1px solid rgba(255,255,255,0.09),
      color rgba(255,255,255,0.45), background transparent.
      Hover: border-color rgba(99,102,241,0.35), color rgba(255,255,255,0.75).
    Active chip (first one "전체" is active by default):
      border-color #6366f1, color #a5b4fc,
      background rgba(99,102,241,0.14).
    onClick: toggle active state (single select).

[6] SUGGESTED PROMPTS  (max-width 680px, width 100%)
    Label row: "추천 명령어" — font-size 10px, font-weight 600,
               letter-spacing 1px, color rgba(255,255,255,0.22),
               text-transform uppercase. Margin-bottom: 10px.
    3 suggestion rows stacked, gap 6px:
      Each row: display flex, align-items center, gap 12px.
      Background: rgba(255,255,255,0.02).
      Border: 1px solid rgba(255,255,255,0.06).
      Border-radius: 10px. Padding: 10px 14px. Cursor: pointer.
      Hover: background rgba(99,102,241,0.07),
             border-color rgba(99,102,241,0.28).
      Left dot: width 6px, height 6px, border-radius 50%,
                background #6366f1, opacity 0.65, flex-shrink 0.
      Text: font-size 13px, color rgba(255,255,255,0.48).
            hover: color rgba(255,255,255,0.78).
    Suggestion texts:
      "서울 강남구 아파트 매매 시세 동향 분석 PPT 6슬라이드 만들어줘"
      "전세 임대차 계약서 작성해줘 — 보증금 3억, 거주기간 2년"
      "10월 월세 수입 정산표 엑셀로 만들어줘, 세금 계산 포함"
    onClick each: fill the textarea with that suggestion text.

---

## RECENT DOCUMENTS SECTION

Position: below hero, padding 0 32px 48px. Max-width: 1100px, margin: 0 auto.

Header row: margin-bottom 16px.
  Left: "최근 생성 문서" — font-size 13px, font-weight 500,
        color rgba(255,255,255,0.5).
  Right: "전체 보기 →" — font-size 12px, color #6366f1,
         hover: color #818cf8.

Card grid: display grid, grid-template-columns repeat(3, 1fr), gap 10px.

Each card:
  Background: rgba(255,255,255,0.028).
  Border: 1px solid rgba(255,255,255,0.07).
  Border-radius: 12px. Padding: 16px. Cursor: pointer.
  Transition: all 0.18s.
  Hover: background rgba(99,102,241,0.06),
         border-color rgba(99,102,241,0.28),
         transform translateY(-2px).

  Top: type badge (see design system color table above).
       Font-size: 10px, font-weight 600, letter-spacing 0.5px,
       padding 3px 8px, border-radius 5px.
  Middle: document title — font-size 13px, font-weight 500,
          color rgba(255,255,255,0.82), margin 8px 0 4px,
          white-space nowrap, overflow hidden, text-overflow ellipsis.
  Bottom: metadata — font-size 11px, color rgba(255,255,255,0.25).

Sample cards (3 items):
  1. Type: PPT,  Title: "3분기 부동산 시장 분석 보고서", Meta: "2시간 전 · 슬라이드 8장"
  2. Type: EXCEL, Title: "마포구 월세 수입 정산표",     Meta: "어제 · 시트 3개"
  3. Type: PDF,  Title: "홍길동-김철수 임대차계약서",   Meta: "3일 전 · PDF 계약서"

---

## FOOTER (minimal)

Border-top: 1px solid rgba(255,255,255,0.05). Padding: 20px 32px.
Display: flex, justify-content space-between, align-items center.
Left: "© 2026 DocFlow AI" — font-size 12px, color rgba(255,255,255,0.2).
Right: "이용약관 · 개인정보처리방침" — same style.

---

## TECH STACK & CONSTRAINTS

- Next.js 14 App Router, TypeScript
- Tailwind CSS v3 (no shadcn on this page)
- Geist font via next/font/google
- "use client" directive only on the CommandInput sub-component
- onClick / onInput handlers: stub with console.log, no API calls
- Export: default export named `HomePage`
- File path: app/page.tsx + components/CommandInput.tsx
```

---

## SCREEN 02 — 생성 진행 화면 (Processing State)

> 사용자가 명령 제출 후 보이는 로딩 + 결과 화면.
> GenSpark의 "Researching…" 스텝 인디케이터와 동일한 패턴.

```
Build the document generation progress and result page for DocFlow AI.
This page has two states: GENERATING and RESULT.
Use a single component with `status: 'generating' | 'done'` prop.

---

## GENERATING STATE

Full page, dark background #0a0a0f.

Top bar (sticky):
  Back arrow (←) + truncated user prompt text.
  Example: "← 강남구 아파트 시세 분석 PPT 6슬라이드 만들어줘"
  Font-size 13px. Color rgba(255,255,255,0.45). Padding 16px 28px.
  Border-bottom 1px solid rgba(255,255,255,0.06).

Center content (vertically + horizontally centered):
  Max-width 480px. Text-align left.

  Title: "문서를 생성하고 있습니다"
  Font-size 18px, font-weight 600, color white. Margin-bottom 8px.

  Subtitle: streaming text (simulated with typewriter effect)
  Shows current AI action: "슬라이드 4: 지역별 시세 비교 데이터 작성 중..."
  Font-size 13px, color rgba(255,255,255,0.38). Margin-bottom 36px.

  Step timeline (vertical list, gap 0):
    4 steps total:
      1. "명령 분석"       — icon: MagnifyingGlass
      2. "구조 설계"       — icon: LayoutGrid
      3. "콘텐츠 생성"     — icon: PencilLine
      4. "파일 완성"       — icon: CheckCircle

    Each step row: display flex, align-items center, gap 14px.
    Height: 52px. Position relative.

    Left: step indicator circle (24px diameter)
      Pending:   border 1.5px solid rgba(255,255,255,0.15), bg transparent
      Active:    border 2px solid #6366f1, bg rgba(99,102,241,0.15)
                 + pulsing ring animation:
                 @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(99,102,241,0.5)}
                                         70%{box-shadow:0 0 0 8px transparent}
                                         100%{box-shadow:0 0 0 0 transparent} }
                 animation: pulse-ring 1.4s ease-out infinite
      Completed: bg #6366f1, white checkmark inside

    Connector line between steps (except last):
      Position absolute, left 11px, top 24px, width 2px, height 28px.
      Completed: bg #6366f1. Pending: bg rgba(255,255,255,0.08).

    Right: step label
      Font-size 13px.
      Completed: color rgba(255,255,255,0.55), text-decoration line-through (subtle)
      Active:    color white, font-weight 500
      Pending:   color rgba(255,255,255,0.28)

  Default active step for demo: step 3 "콘텐츠 생성".
  Steps 1 and 2 are completed.

---

## RESULT STATE  (status === 'done')

Two-column layout. Gap 24px. Max-width 1000px. Margin: 0 auto. Padding: 32px.

LEFT COLUMN (flex: 3) — Document Preview Panel
  Background: rgba(255,255,255,0.03).
  Border: 1px solid rgba(255,255,255,0.08).
  Border-radius: 16px. Padding: 24px. Height: fit-content.

  Slide preview card (simulated PPT slide):
    Aspect ratio: 16/9. Background: white. Border-radius: 8px.
    Padding: 32px 36px. Color: #1a1a2e.
    Contains:
      Top-right: small "DocFlow AI" watermark text (9px, muted gray)
      Slide number badge top-left: "01 / 06" (10px, indigo pill)
      Slide title: "강남구 아파트 시세 동향 분석" (22px, bold, dark navy)
      Divider line: 2px, indigo, width 48px, margin 16px 0
      Bullet points (4 items, font-size 13px, color #333, line-height 1.8):
        • 2026년 3분기 평균 매매가: 18.4억 (전분기 대비 +2.3%)
        • 전용 84㎡ 기준 최고가: 잠실 32억 / 도곡 28억
        • 거래량: 월 342건 (전년 동기 대비 -18%)
        • 향후 전망: 금리 인하 기대감으로 완만한 상승 예상
      Bottom-left: slide source tag "AI 생성 · DocFlow AI" (9px, muted)

  Slide navigation row (below preview):
    Previous (←) and Next (→) text buttons, muted color.
    Center: dot indicators (6 dots, active dot is filled indigo).
    Font-size 12px. Padding 12px 0.

RIGHT COLUMN (flex: 2) — Actions Panel
  Display: flex, flex-direction column, gap 16px.

  File info card:
    Background: rgba(255,255,255,0.03).
    Border: 1px solid rgba(255,255,255,0.07).
    Border-radius: 12px. Padding: 16px.
    Rows (label: value format):
      파일명:    강남구_아파트시세_분석.pptx
      형식:      PPT 슬라이드 (type badge component)
      슬라이드:  6장
      생성 시간: 방금 전
      파일 크기: 2.4 MB
    Label: font-size 12px, color rgba(255,255,255,0.35).
    Value: font-size 13px, color rgba(255,255,255,0.78).

  Download button (primary CTA):
    Full width. Height 46px. Background: #6366f1. Border-radius: 10px.
    Font-size 14px, font-weight 600, color white.
    Left icon: download arrow SVG.
    Text: "파일 다운로드"
    Hover: bg #4f46e5, box-shadow 0 4px 20px rgba(99,102,241,0.4).

  Secondary actions row (3 equal buttons):
    "수정 요청" / "공유하기" / "다시 생성"
    Each: flex 1, height 38px, background rgba(255,255,255,0.04),
          border 1px solid rgba(255,255,255,0.08), border-radius 8px,
          font-size 12px, color rgba(255,255,255,0.55).
          Hover: border-color rgba(99,102,241,0.3), color rgba(255,255,255,0.8).

  Modification request input:
    Label: "수정 요청" — font-size 11px, uppercase, letter-spacing 0.8px,
           color rgba(255,255,255,0.28). Margin-bottom 8px.
    Textarea: same style as home page command input, but smaller.
              Min-height 72px. Placeholder: "수정할 내용을 입력하세요.
              예: 3번 슬라이드 배경색을 네이비로 바꿔줘"
    Send button: right-aligned, small (32px), indigo.

---

## TECH STACK

- Next.js 14, TypeScript, Tailwind CSS
- lucide-react for icons (Download, ArrowLeft, ArrowRight, RotateCcw, Share2, Edit3)
- Props: interface GeneratePageProps { status: 'generating' | 'done'; prompt: string; }
- Default export: GeneratePage
- File: app/generate/page.tsx
```

---

## SCREEN 03 — 대시보드 + 사이드바 레이아웃

> 로그인 후 메인 작업 화면. GenSpark의 히스토리 패널과 동일한 UX.

```
Build the authenticated dashboard layout with sidebar for DocFlow AI.

---

## ROOT LAYOUT STRUCTURE

CSS Grid: grid-template-columns 240px 1fr. Height: 100vh. Overflow: hidden.
Background: #0a0a0f.

---

## SIDEBAR  (240px, background #0d0d14)

Border-right: 1px solid rgba(255,255,255,0.06).
Display: flex, flex-direction column. Height: 100vh. Padding: 0.

TOP SECTION — padding 20px 16px 16px:

  Logo row (margin-bottom 20px):
    Same logo as navbar. Font-size 16px.

  "새 문서 만들기" primary button:
    Full width. Height 40px. Background: #6366f1. Border-radius: 9px.
    Font-size 13px, font-weight 500, color white.
    Left icon: + (Plus, 14px). Gap: 8px.
    Hover: bg #4f46e5, box-shadow 0 0 16px rgba(99,102,241,0.3).
    Margin-bottom 8px.

NAVIGATION — padding 0 8px, flex 1:

  Section label: "메뉴"
  Font-size 10px, font-weight 600, letter-spacing 0.8px,
  color rgba(255,255,255,0.2), padding 8px 8px 4px, margin-bottom 2px.

  Nav items (each):
    Height 38px. Display flex. Align-items center. Gap 10px.
    Padding 0 10px. Border-radius 8px. Cursor pointer.
    Font-size 13px, color rgba(255,255,255,0.5). Transition 0.15s.
    Hover: background rgba(255,255,255,0.05), color rgba(255,255,255,0.85).
    Active: background rgba(99,102,241,0.14), color #a5b4fc,
            border-left 2px solid #6366f1 (use box-shadow inset instead).

    Items (icon from lucide-react + label + optional badge):
      Clock         "최근 문서"     (active by default)
      LayoutTemplate "템플릿"
      FileText      "계약서 양식"
      Search        "문서 검색"

  Section label: "문서 유형" — same label style, margin-top 16px.

  Type filter items (smaller, height 34px):
    Presentation   "PPT 슬라이드"   with type badge dot (indigo 6px circle)
    Table          "엑셀 정산표"    with type badge dot (emerald)
    FilePdf        "계약서 PDF"     with type badge dot (amber)

BOTTOM SECTION — padding 12px, border-top 1px solid rgba(255,255,255,0.06):

  User profile row:
    Avatar circle (32px): initials "MJ", bg rgba(99,102,241,0.2), color #a5b4fc.
    Name: "사용자" (13px, white 80%). Email: "user@email.com" (11px, muted).
    Right: Settings icon (14px, muted).

---

## MAIN CONTENT — Document History Page

Overflow-y: auto. Height: 100vh. Background: #0a0a0f. Padding: 32px.

PAGE HEADER (margin-bottom 24px):
  Title: "내 문서" — font-size 22px, font-weight 700, color white.
  Count badge: "24개" — font-size 12px, bg rgba(255,255,255,0.08),
               color rgba(255,255,255,0.5), padding 3px 10px, border-radius 9999px.
  Both on same row, gap 12px, align-items center.

FILTER ROW (margin-bottom 20px):
  Display flex. Gap 10px. Align-items center.

  Search input (flex 1, max-width 320px):
    Height 36px. Background rgba(255,255,255,0.04).
    Border 1px solid rgba(255,255,255,0.08). Border-radius 8px.
    Padding 0 12px 0 36px. Font-size 13px. Color white.
    Placeholder: "문서 검색..." color rgba(255,255,255,0.22).
    Left icon: Search (14px, muted, position absolute).
    Focus: border-color rgba(99,102,241,0.4).

  Format filter select:
    Height 36px. Background rgba(255,255,255,0.04).
    Border 1px solid rgba(255,255,255,0.08). Border-radius 8px.
    Padding 0 12px. Font-size 13px. Color rgba(255,255,255,0.6).
    Options: "모든 형식" / "PPT" / "EXCEL" / "PDF".

  Sort select: same style. Options: "최신순" / "오래된순" / "이름순".

DOCUMENT LIST (display flex, flex-direction column, gap 6px):

  Each document row:
    Background: rgba(255,255,255,0.025).
    Border: 1px solid rgba(255,255,255,0.06).
    Border-radius: 10px. Padding: 14px 16px.
    Display: grid. Grid-template-columns: auto 1fr auto auto auto.
    Align-items: center. Gap: 14px. Cursor: pointer. Transition: all 0.15s.
    Hover: background rgba(99,102,241,0.055),
           border-color rgba(99,102,241,0.22).

    Col 1 — Type badge: same color system as design tokens above.
    Col 2 — Document info:
      Title: font-size 14px, font-weight 500, color rgba(255,255,255,0.85).
      Meta: font-size 12px, color rgba(255,255,255,0.28), margin-top 2px.
    Col 3 — Date: font-size 12px, color rgba(255,255,255,0.28). Min-width 80px.
    Col 4 — File size: font-size 12px, color rgba(255,255,255,0.22). Min-width 60px.
    Col 5 — Action icons (visible on row hover only, use group-hover):
      Download (14px), Edit (14px), Trash (14px, hover: red).
      Gap 8px. Color rgba(255,255,255,0.35).

  Sample rows (8 items):
    PPT   | 3분기 부동산 시장 분석 보고서  | 2026.04.02 | 2.4 MB
    EXCEL | 마포구 월세 수입 정산표        | 2026.04.01 | 148 KB
    PDF   | 홍길동-김철수 임대차계약서     | 2026.03.30 | 820 KB
    PPT   | 서울시 공인중개사 현황 보고서  | 2026.03.28 | 3.1 MB
    EXCEL | 1분기 매출 정산 엑셀          | 2026.03.25 | 215 KB
    PDF   | 이철수-박영희 매매계약서       | 2026.03.22 | 760 KB
    PPT   | 신규 매물 소개 프레젠테이션   | 2026.03.20 | 5.2 MB
    EXCEL | 관리비 세부 내역서            | 2026.03.18 | 92 KB

EMPTY STATE (show when list is empty):
  Center of content area. Display flex, flex-direction column, align-items center.
  Gap 16px.
  Icon: large FileX from lucide-react (48px, color rgba(255,255,255,0.1)).
  Title: "아직 생성한 문서가 없습니다" — font-size 16px, color rgba(255,255,255,0.4).
  Sub: "명령 입력창에서 첫 번째 문서를 만들어 보세요" — font-size 13px, muted.
  CTA: "새 문서 만들기 →" button, indigo.

---

## TECH STACK

- Next.js 14 App Router, TypeScript
- Tailwind CSS + lucide-react
- Layout via CSS Grid (sidebar + main), not flexbox
- app/dashboard/layout.tsx + app/dashboard/page.tsx
- Sidebar: separate component components/Sidebar.tsx
- Document row: separate component components/DocumentRow.tsx
- All data is static mock — no API calls
```

---

## SCREEN 04 — 템플릿 갤러리 페이지

> GenSpark의 카테고리 브라우저와 동일한 그리드 레이아웃.

```
Build the template gallery page for DocFlow AI.
Uses the same dashboard layout (Sidebar + main content area).

---

## PAGE HEADER

Title: "템플릿" + badge "87개"
Sub: "자주 쓰는 문서 양식을 한 번에. 선택하면 즉시 생성됩니다."
Font-size 13px, color rgba(255,255,255,0.38). Margin-top 6px.

---

## CATEGORY TAB BAR

Horizontal scrollable row. Gap 8px. Margin-bottom 28px.
Tabs: "전체" "부동산" "세무/회계" "총무/인사" "영업/마케팅" "법무/계약"

Each tab:
  Padding 7px 16px. Border-radius 9999px. Font-size 13px. Cursor pointer.
  Default: border 1px solid rgba(255,255,255,0.09), color rgba(255,255,255,0.45).
  Active: border-color #6366f1, color #a5b4fc, bg rgba(99,102,241,0.13).
  Hover: border-color rgba(255,255,255,0.16).

---

## TEMPLATE GRID

Display: grid. Grid-template-columns: repeat(3, 1fr). Gap: 14px.

Each template card (height ~200px):
  Background: rgba(255,255,255,0.03).
  Border: 1px solid rgba(255,255,255,0.07).
  Border-radius: 14px. Padding: 20px. Cursor: pointer.
  Transition: all 0.2s.
  Hover: background rgba(99,102,241,0.07),
         border-color rgba(99,102,241,0.3),
         transform translateY(-3px).

  Top row: type badge (left) + category tag (right).
  Category tag: font-size 10px, color rgba(255,255,255,0.3),
                background rgba(255,255,255,0.05), padding 3px 8px, border-radius 4px.

  Template name: font-size 15px, font-weight 600, color rgba(255,255,255,0.88),
                 margin 12px 0 6px.

  Description: font-size 12px, color rgba(255,255,255,0.35), line-height 1.6.
               Max 2 lines, overflow hidden.

  Bottom row (margin-top auto, padding-top 16px):
    Left: "바로 사용" link — font-size 12px, color #6366f1.
          Hover: text-decoration underline.
    Right: usage count — font-size 11px, color rgba(255,255,255,0.2).
           Example: "1,240회 사용"

Sample templates (9 items in 3x3 grid):

  1. PPT   | 부동산 | 아파트 시세 동향 분석     | 지역별 매매·전세 시세 비교 슬라이드 | 2,840회
  2. EXCEL | 부동산 | 월세 수입 정산표          | 임대료 수입·지출 자동 계산         | 1,920회
  3. PDF   | 법무   | 표준 임대차 계약서        | 법정 서식 기반 자동 작성           | 3,100회
  4. PPT   | 영업   | 신규 매물 소개 자료       | 고객 제시용 매물 프레젠테이션       | 890회
  5. EXCEL | 세무   | 부가세 신고 정리표        | 매입·매출 세금계산서 정리          | 760회
  6. PDF   | 법무   | 부동산 매매 계약서        | 매도인·매수인 계약서 자동 생성      | 2,450회
  7. PPT   | 총무   | 월간 업무 보고서          | 주요 KPI 및 업무 현황 정리         | 1,130회
  8. EXCEL | 회계   | 월간 손익계산서           | 수입·비용 항목 자동 집계           | 540회
  9. PPT   | 마케팅 | 분기 실적 보고서          | 매출·목표 달성률 시각화 슬라이드    | 680회

---

## TECH STACK

- Same as dashboard page
- app/dashboard/templates/page.tsx
- Static mock data, no API
```

---

## 수정 프롬프트 — 완성 후 세부 조정

> 각 화면 생성 후 퀄리티를 높이고 싶을 때 추가로 입력.

### 애니메이션 & 인터랙션 강화

```
Enhance the existing DocFlow AI components with the following
micro-interactions and animations:

1. Page entrance animation:
   All content fades in + slides up slightly on mount.
   Use CSS keyframes: opacity 0→1, translateY 12px→0, duration 0.4s, ease-out.
   Stagger children by 60ms each using animation-delay.

2. Command input box:
   On focus: border transitions to rgba(99,102,241,0.5) over 0.25s.
   On submit (send button click): button scales to 0.9 then back to 1 (0.15s).
   Placeholder text: rotate through 3 different placeholders every 4 seconds
     using a crossfade animation (opacity transition).

3. Format chips:
   On select: scale 1→0.92→1 bounce effect (0.2s).
   Unselected chips: opacity transitions to 0.6 when another is active.

4. Suggestion rows:
   On hover: left indigo dot scales from 6px to 9px (0.15s).
   On click: brief flash background rgba(99,102,241,0.15) then fade out.

5. Document cards (recent + history):
   Hover: translateY(-2px) + border-color change, both 0.18s.
   Action icons: fade in on row hover using CSS group-hover.

6. Template cards:
   Hover: translateY(-4px) + subtle box-shadow 0 8px 24px rgba(99,102,241,0.15).

Keep all animations smooth, no janky repaints.
Use Tailwind transition classes where possible, keyframes for complex ones.
Wrap in @media (prefers-reduced-motion: reduce) { animation: none } guard.
```

### 반응형 모바일 대응

```
Add mobile responsive behavior to the DocFlow AI pages.
Breakpoints: sm=640px, md=768px, lg=1024px (Tailwind defaults).

Home page changes (below md):
  - Navbar: hide center nav links, keep logo + "무료 시작" button only
  - Hero headline font-size: 28px (from 42px)
  - Input box: full width, border-radius 12px
  - Format chips: horizontal scroll, no wrap, hide scrollbar
  - Suggested prompts: show only 2 (hide third)
  - Recent cards: grid-cols-1 (from 3)

Dashboard layout (below lg):
  - Sidebar: hidden by default, slide in from left on hamburger tap
  - Add hamburger menu button (Menu icon) in top-left of main area
  - Sidebar overlay: semi-transparent backdrop when open
  - Document list rows: stack into compact card layout on mobile

Result page (below md):
  - Two columns → single column stack (preview first, actions second)
  - Slide preview: full width

Do NOT break the existing desktop layout.
Use Tailwind responsive prefixes throughout (md:, lg:).
```

### 다크/라이트 모드 전환

```
Add a light mode variant to DocFlow AI with a toggle in the navbar.

Light mode colors:
  Background primary:   #f8f8fc
  Background card:      #ffffff
  Background elevated:  #f0f0f8
  Sidebar:              #fafafa
  Text primary:         #0f0f1a
  Text secondary:       #5a5a72
  Text muted:           #9090a8
  Border:               rgba(0,0,0,0.08)
  Accent:               #6366f1 (same)

Implementation:
  - Use next-themes (ThemeProvider wrapping root layout)
  - Toggle button in navbar: Sun / Moon icon from lucide-react
    32px, border 1px, border-radius 8px
  - All color values: use CSS custom properties with dark/light variants
    OR use Tailwind dark: prefix on every color class
  - Transition: background-color + color + border-color all 0.25s ease
    on <html> or <body> when theme switches

The dark theme should remain the default.
```

---

## Antigravity 사용 순서

```
Step 1: SCREEN 01 프롬프트로 메인 홈 생성
Step 2: "수정 프롬프트 — 애니메이션" 적용
Step 3: SCREEN 02 프롬프트로 생성 결과 화면 생성
Step 4: SCREEN 03 프롬프트로 대시보드 레이아웃 생성
Step 5: SCREEN 04 프롬프트로 템플릿 갤러리 생성
Step 6: "반응형 모바일" 프롬프트로 전체 페이지 모바일 대응
Step 7: 결과물을 Claude Code에 넘겨 API 연결
```

---

## Claude Code에 넘길 때 인계 프롬프트

> Antigravity에서 컴포넌트를 받은 후, Claude Code에 붙여넣을 텍스트.

```
아래는 Antigravity로 생성한 DocFlow AI 프론트엔드 컴포넌트야.
다음 작업을 순서대로 처리해줘:

1. components/CommandInput.tsx의 폼 제출 핸들러에
   POST /api/generate 요청 연결
   요청 body: { instruction: string, format: string }
   응답: { job_id: string }
   → job_id를 받으면 /generate?job_id={id} 로 라우팅

2. app/generate/page.tsx에 polling 로직 추가
   GET /api/jobs/{job_id} 를 3초마다 호출
   status가 'done'이 되면 RESULT state로 전환
   실패 시 에러 메시지 표시 (toast)

3. 다운로드 버튼에 GET /api/files/{file_id} 연결
   응답 blob을 a 태그로 다운로드 트리거

4. 기존 mock 데이터를 실제 API 응답 타입에 맞게 교체
   타입 정의는 types/api.ts에 분리

ARCHITECTURE.md의 API 명세를 참고해서 타입 정의해줘.
에러 처리, 로딩 상태는 기존 UI 컴포넌트 활용.
```
