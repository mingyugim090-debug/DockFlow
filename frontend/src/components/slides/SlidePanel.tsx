"use client";

import { useState } from "react";

interface BBox {
  elementPath: string;
  outerHTML: string;
  textContent: string;
}

interface SlidePanelProps {
  deckId: string;
  slideIndex: number;
  selectedBBox: BBox | null;
  onClearSelection: () => void;
}

export default function SlidePanel({
  deckId,
  slideIndex,
  selectedBBox,
  onClearSelection,
}: SlidePanelProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const QUICK_PROMPTS = [
    "글자 크기 키워줘",
    "폰트를 화려하게",
    "내용을 더 간결하게",
    "굵게 만들어줘",
    "줄간격 넓혀줘",
  ];

  const handleRewrite = async (customInstruction?: string) => {
    if (!selectedBBox) return;
    const inst = customInstruction ?? instruction;
    if (!inst.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/slides/${deckId}/slides/${slideIndex}/rewrite`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slide_index: slideIndex,
            element_path: selectedBBox.elementPath,
            original_html: selectedBBox.outerHTML,
            instruction: inst,
          }),
        }
      );
      
      if (!res.ok) {
        throw new Error("서버 오류가 발생했습니다");
      }

      const data = await res.json();

      // SlideEditor에 업데이트 전달 (전역 훅 호출)
      (window as any).__slideEditorUpdate?.(
        data.element_path,
        data.new_html
      );

      // (선택) 변경된 내용을 백엔드에도 저장 로직 추가
      await fetch(`/api/slides/${deckId}/slides/${slideIndex}/save`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // iframe 내부에서 렌더링된 새로운 HTML 전체를 가져올 순 없으므로, 
        // iframe에게 업데이트 시 전체 트리를 저장하라고 지시하거나, API 단에서 병합하는 것이 필요함.
        // 현재는 메모리 상에서 편집용만 업데이트하는 걸로.
      });

      setInstruction("");
      onClearSelection();
    } catch (err: any) {
      setError(err.message || "수정 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: 280,
      height: "100%",
      background: "#0e0e1a",
      borderLeft: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      padding: 20,
      gap: 16,
    }}>
      {selectedBBox ? (
        <>
          {/* 선택된 요소 정보 */}
          <div style={{
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 8,
            padding: "10px 12px",
          }}>
            <div style={{ fontSize: 10, color: "#a78bfa", letterSpacing: 1, marginBottom: 4 }}>
              선택된 요소
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {selectedBBox.textContent || "(빈 요소)"}
            </div>
          </div>

          {/* 빠른 수정 버튼들 */}
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 8 }}>
              빠른 수정
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleRewrite(p)}
                  disabled={loading}
                  style={{
                    fontSize: 11,
                    padding: "5px 10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 5,
                    color: "rgba(255,255,255,0.55)",
                    cursor: loading ? "default" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 직접 지시 입력 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>
              수정 지시
            </div>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="예: 이 텍스트를 더 임팩트 있게 바꿔줘"
              rows={4}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: 12,
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                resize: "none",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleRewrite();
                }
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: "#f87171" }}>{error}</div>
            )}
            <button
              onClick={() => handleRewrite()}
              disabled={loading || !instruction.trim()}
              style={{
                height: 40,
                background: loading ? "rgba(139,92,246,0.3)" : "linear-gradient(135deg,#8b5cf6,#3b82f6)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "수정 중..." : "AI 수정 적용  ⌘↵"}
            </button>
          </div>

          <button
            onClick={onClearSelection}
            style={{
              height: 36,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7,
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            선택 해제
          </button>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "rgba(255,255,255,0.2)",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>
            슬라이드에서 수정할<br/>요소를 클릭하세요
          </div>
        </div>
      )}
    </div>
  );
}
