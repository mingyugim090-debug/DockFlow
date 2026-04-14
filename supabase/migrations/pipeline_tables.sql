-- 핵심 파이프라인: 공고 모니터링 + 승인 워크플로우 테이블
-- Supabase SQL Editor에서 실행

-- ═══════════════════════════════════════
-- 1. 공고(announcements) 테이블
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS announcements (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title         text NOT NULL,
    org           text NOT NULL DEFAULT '',       -- 기관명 (과기부, 중기부 등)
    category      text DEFAULT '',                -- R&D, 창업지원, 수출지원 등
    summary       text DEFAULT '',                -- AI 요약
    deadline      date,                            -- 마감일
    fund          text DEFAULT '',                -- "최대 5억원"
    keywords      text[] DEFAULT '{}',            -- 키워드 배열
    score         integer DEFAULT 0,              -- AI 적합도 점수 (0~100)
    source_url    text DEFAULT '',                -- 원본 공고 링크
    raw_content   text DEFAULT '',                -- 공고 원문 텍스트
    is_new        boolean DEFAULT true,
    status        text DEFAULT 'active',          -- active, expired, archived
    source        text DEFAULT 'bizinfo',         -- bizinfo, kstartup, manual
    external_id   text DEFAULT '',                -- 외부 시스템 고유 ID (중복 방지)
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS announcements_status_idx ON announcements(status);
CREATE INDEX IF NOT EXISTS announcements_deadline_idx ON announcements(deadline);
CREATE INDEX IF NOT EXISTS announcements_external_id_idx ON announcements(external_id);
CREATE INDEX IF NOT EXISTS announcements_score_idx ON announcements(score DESC);

-- ═══════════════════════════════════════
-- 2. 승인 요청(approval_requests) 테이블
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS approval_requests (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id   uuid REFERENCES announcements(id) ON DELETE CASCADE,
    user_id           uuid,
    status            text DEFAULT 'pending',     -- pending, approved, rejected, processing, completed
    analysis_summary  text DEFAULT '',             -- AI 분석 요약
    analysis_file_url text DEFAULT '',             -- 분석 보고서 다운로드 URL
    generated_file_url text DEFAULT '',            -- AI 생성 지원서 다운로드 URL
    created_at        timestamptz DEFAULT now(),
    reviewed_at       timestamptz
);

CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON approval_requests(status);
CREATE INDEX IF NOT EXISTS approval_requests_announcement_idx ON approval_requests(announcement_id);

-- ═══════════════════════════════════════
-- 3. RLS 정책
-- ═══════════════════════════════════════
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- 서비스 롤: 전체 접근
CREATE POLICY "service_all_announcements" ON announcements
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_approvals" ON approval_requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 인증 사용자: 공고 조회 가능
CREATE POLICY "authenticated_read_announcements" ON announcements
    FOR SELECT TO authenticated USING (true);

-- 인증 사용자: 본인 승인 요청만 조회
CREATE POLICY "authenticated_read_own_approvals" ON approval_requests
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "authenticated_insert_approvals" ON approval_requests
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
