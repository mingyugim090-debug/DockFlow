"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Presentation, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface GenerateModalProps {
  onClose: () => void;
}

type Phase = "input" | "generating" | "error";

interface ProgressState {
  percent: number;
  message: string;
  currentSlide: number;
  totalSlides: number;
  stage: number;
  totalStages: number;
  modelHint?: string;
  slideLayouts: string[];
}

export default function GenerateModal({ onClose }: GenerateModalProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(8);
  const [theme, setTheme] = useState("modern_dark");
  const [phase, setPhase] = useState<Phase>("input");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<ProgressState>({
    percent: 0,
    message: "준비 중...",
    currentSlide: 0,
    totalSlides: 0,
    stage: 0,
    totalStages: 6,
    slideLayouts: [],
  });

  const THEMES = [
    { value: "modern_dark",  label: "모던 다크",    color: "#0a0a0f" },
    { value: "executive",    label: "임원 보고용",   color: "#1a1a2e" },
    { value: "minimal",      label: "심플 화이트",   color: "#ffffff" },
    { value: "government",   label: "정부 제안서",   color: "#f8f9fa" },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setPhase("generating");
    setProgress({ percent: 0, message: "요청 전송 중...", currentSlide: 0, totalSlides: 0, stage: 0, totalStages: 6, slideLayouts: [] });

    try {
      const res = await fetch("/api/slides/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slide_count: slideCount, theme }),
      });

      if (!res.ok || !res.body) {
        throw new Error("서버 연결 실패");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(part.slice(6));

            if (event.type === "stage" || event.type === "progress") {
              setProgress(prev => ({
                ...prev,
                percent: event.percent,
                message: event.message,
                stage: event.stage ?? prev.stage,
                totalStages: event.total_stages ?? prev.totalStages,
                modelHint: event.model,
              }));
            } else if (event.type === "slide_done") {
              setProgress(prev => ({
                percent: event.percent,
                message: `슬라이드 ${event.current}/${event.total} — ${event.title}`,
                currentSlide: event.current,
                totalSlides: event.total,
                stage: event.stage ?? prev.stage,
                totalStages: prev.totalStages,
                modelHint: undefined,
                slideLayouts: [...prev.slideLayouts, event.layout ?? "content"],
              }));
            } else if (event.type === "complete") {
              setProgress(prev => ({
                ...prev,
                percent: 100,
                message: event.message ?? "완성!",
                currentSlide: event.slide_count,
                totalSlides: event.slide_count,
                stage: 6,
              }));
              setTimeout(() => {
                onClose();
                router.push(`/slides/${event.deck_id}`);
              }, 600);
              return;
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            // 파싱 실패 시 skip
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(msg);
      setPhase("error");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#0c0c14",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "32px 40px",
        width: 540,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        position: "relative",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
      }}>
        {/* 닫기 버튼 (생성 중에는 비활성) */}
        {phase !== "generating" && (
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#c4b5fd" }}>
            <Presentation className="w-5 h-5" />
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2 }}>NEW PRESENTATION</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 8 }}>
            AI 슬라이드 자동 생성
          </div>
        </div>

        {/* ── 입력 폼 ── */}
        {phase === "input" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>발표 주제 및 핵심 내용</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="예: 2024년 4분기 모바일 앱 마케팅 성과 및 내년도 계획..."
                  rows={4}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: 16,
                    color: "#fff", fontSize: 15, lineHeight: 1.6,
                    resize: "none", outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 24 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>슬라이드 장수</label>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "8px 16px",
                  }}>
                    <button onClick={() => setSlideCount(Math.max(3, slideCount - 1))} style={{ color: "white", background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>-</button>
                    <span style={{ color: "white", fontSize: 16, fontWeight: 500 }}>{slideCount}장</span>
                    <button onClick={() => setSlideCount(Math.min(20, slideCount + 1))} style={{ color: "white", background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>+</button>
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>디자인 테마</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, padding: "0 16px", height: 48,
                      color: "#fff", fontSize: 14, outline: "none", appearance: "none", cursor: "pointer",
                    }}
                  >
                    {THEMES.map(t => (
                      <option key={t.value} value={t.value} style={{ background: "#1a1a2e", color: "white" }}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!topic.trim()}
              style={{
                marginTop: 16, height: 54,
                background: !topic.trim() ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 16, fontWeight: 600,
                cursor: !topic.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.2s",
              }}
            >
              <Sparkles className="w-5 h-5" />
              구조 설계 및 생성 시작
            </button>
          </>
        )}

        {/* ── 생성 중 프로그레스 ── */}
        {phase === "generating" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 단계 표시 파이프 */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {Array.from({ length: progress.totalStages }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{
                    flex: 1, height: 3, borderRadius: 999,
                    background: i < progress.stage
                      ? "linear-gradient(90deg, #8b5cf6, #3b82f6)"
                      : i === progress.stage
                        ? "rgba(139,92,246,0.5)"
                        : "rgba(255,255,255,0.08)",
                    transition: "background 0.4s",
                  }} />
                </div>
              ))}
            </div>

            {/* 메시지 + 모델 힌트 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", minHeight: 20, flex: 1 }}>
                {progress.message}
              </div>
              {progress.modelHint && (
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                  padding: "3px 8px", borderRadius: 6,
                  background: progress.modelHint.includes("local")
                    ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.2)",
                  color: progress.modelHint.includes("local") ? "#4ade80" : "#a5b4fc",
                  border: `1px solid ${progress.modelHint.includes("local") ? "rgba(74,222,128,0.3)" : "rgba(165,180,252,0.3)"}`,
                  whiteSpace: "nowrap",
                }}>
                  {progress.modelHint}
                </div>
              )}
            </div>

            {/* 프로그레스 바 */}
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 999, height: 6, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progress.percent}%`,
                  background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                  borderRadius: 999,
                  transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              <span>
                {progress.totalSlides > 0
                  ? `${progress.currentSlide} / ${progress.totalSlides} 슬라이드`
                  : `${progress.stage} / ${progress.totalStages} 단계`}
              </span>
              <span>{progress.percent}%</span>
            </div>

            {/* 슬라이드 완성 도트 (레이아웃 뱃지 포함) */}
            {progress.totalSlides > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {Array.from({ length: progress.totalSlides }).map((_, i) => {
                  const isDone = i < progress.currentSlide;
                  const isActive = i === progress.currentSlide;
                  const layout = progress.slideLayouts[i];
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{
                        width: isDone ? 12 : 10,
                        height: isDone ? 12 : 10,
                        borderRadius: "50%",
                        background: isDone
                          ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                          : isActive
                            ? "rgba(139,92,246,0.6)"
                            : "rgba(255,255,255,0.08)",
                        transition: "all 0.3s",
                        boxShadow: isActive ? "0 0 8px rgba(139,92,246,0.6)" : "none",
                      }} />
                      {layout && (
                        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                          {layout.slice(0, 4)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>
              로컬 AI → 클라우드 AI 순으로 협력하여 최적의 프레젠테이션을 만듭니다.
            </p>
          </div>
        )}

        {/* ── 에러 ── */}
        {phase === "error" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#f87171" }}>
              <AlertCircle className="w-5 h-5" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button
              onClick={() => { setPhase("input"); setError(""); }}
              style={{
                height: 44, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, color: "#fff", fontSize: 14, cursor: "pointer",
              }}
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
