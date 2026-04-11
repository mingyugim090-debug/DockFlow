-- ============================================================
-- DocFlow AI — Sprint 5 마이그레이션
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. workflows 테이블 생성 (Sprint 4 API에서 사용)
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflows (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  purpose       TEXT,
  trigger_type  TEXT,
  steps         JSONB       NOT NULL DEFAULT '[]',
  enabled       BOOLEAN     NOT NULL DEFAULT TRUE,
  status        TEXT        NOT NULL DEFAULT 'active',  -- active | paused | completed
  run_count     INTEGER     NOT NULL DEFAULT 0,
  success_count INTEGER     NOT NULL DEFAULT 0,
  last_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workflows_updated_at ON workflows;
CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ──────────────────────────────────────────────────────────────
-- 2. RLS 활성화
-- ──────────────────────────────────────────────────────────────

ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows  ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 3. users 테이블 RLS 정책
--    - 본인 row만 조회/수정 가능
--    - INSERT는 NextAuth signIn callback이 service_role로 수행 → 정책 불필요
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users: 본인만 조회" ON users;
CREATE POLICY "users: 본인만 조회"
  ON users FOR SELECT
  USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "users: 본인만 수정" ON users;
CREATE POLICY "users: 본인만 수정"
  ON users FOR UPDATE
  USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');


-- ──────────────────────────────────────────────────────────────
-- 4. documents 테이블 RLS 정책
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "documents: 본인만 조회" ON documents;
CREATE POLICY "documents: 본인만 조회"
  ON documents FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "documents: 본인만 삽입" ON documents;
CREATE POLICY "documents: 본인만 삽입"
  ON documents FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "documents: 본인만 삭제" ON documents;
CREATE POLICY "documents: 본인만 삭제"
  ON documents FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');


-- ──────────────────────────────────────────────────────────────
-- 5. workflows 테이블 RLS 정책
-- ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "workflows: 본인만 조회" ON workflows;
CREATE POLICY "workflows: 본인만 조회"
  ON workflows FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "workflows: 본인만 삽입" ON workflows;
CREATE POLICY "workflows: 본인만 삽입"
  ON workflows FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "workflows: 본인만 수정" ON workflows;
CREATE POLICY "workflows: 본인만 수정"
  ON workflows FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "workflows: 본인만 삭제" ON workflows;
CREATE POLICY "workflows: 본인만 삭제"
  ON workflows FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');


-- ──────────────────────────────────────────────────────────────
-- 참고: service_role 키(백엔드)는 RLS를 우회합니다.
--      소유권 검증은 백엔드 코드(api/routes/*.py)에서 수행합니다.
-- ──────────────────────────────────────────────────────────────
