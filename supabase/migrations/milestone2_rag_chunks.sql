-- Milestone 2: RAG 청크 저장 테이블 및 검색 함수
-- Supabase SQL Editor에서 실행 (pgvector 활성화 완료 전제)

-- 1. 청크 저장 테이블
CREATE TABLE IF NOT EXISTS document_chunks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id   text NOT NULL,
    user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
    content     text NOT NULL,
    embedding   vector(1536),
    chunk_index integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. HNSW 코사인 유사도 인덱스 (빠른 검색)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
    ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 3. upload_id 조회 인덱스
CREATE INDEX IF NOT EXISTS document_chunks_upload_id_idx
    ON document_chunks(upload_id);

-- 4. RLS 활성화
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책: 서비스 롤은 모두 허용
CREATE POLICY "service_role_all" ON document_chunks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. RLS 정책: 본인 청크만 조회 가능
CREATE POLICY "users_read_own_chunks" ON document_chunks
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- 7. 유사도 검색 RPC 함수
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(1536),
    filter_upload_id text,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id          uuid,
    upload_id   text,
    content     text,
    chunk_index integer,
    similarity  float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        dc.id,
        dc.upload_id,
        dc.content,
        dc.chunk_index,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE dc.upload_id = filter_upload_id
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
$$;
