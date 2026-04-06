"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SlideEditor from "@/components/slides/SlideEditor";
import SlidePanel from "@/components/slides/SlidePanel";
import { Loader2 } from "lucide-react";

export default function SlideEditorPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const [deckInfo, setDeckInfo] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [selectedBBox, setSelectedBBox] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/slides/${deckId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Deck not found");
        return r.json();
      })
      .then((data) => {
        setDeckInfo(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        // Error handling out of scope for mockup
        setLoading(false);
      });
  }, [deckId]);

  const handleExport = async (format: "pptx" | "pdf") => {
    setExporting(true);
    setExportMsg("내보내기 요청 중...");
    try {
      const res = await fetch(`/api/slides/${deckId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) throw new Error("내보내기 요청 실패");
      const { download_urls } = await res.json();
      const fileUrl: string = download_urls[format];

      setExportMsg("파일 변환 중... (최대 30초)");

      // 파일 준비될 때까지 폴링 (2초 간격, 최대 30회 = 60초)
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        setExportMsg(`변환 중... ${(attempt + 1) * 2}초 경과`);
        try {
          const check = await fetch(fileUrl, { method: "HEAD" });
          if (check.ok) {
            setExportMsg("다운로드 시작!");
            window.open(fileUrl, "_blank");
            return;
          }
        } catch {
          // 아직 파일 없음 — 계속 대기
        }
      }
      setExportMsg("시간 초과 — 다시 시도해주세요");
    } catch (err) {
      setExportMsg("내보내기 실패");
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#08080f] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh",
      background: "#08080f",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 상단 툴바 */}
      <div style={{
        height: 52,
        background: "#0e0e1a",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
      }}>
        <button onClick={() => router.back()}
          style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
          ← 나가기
        </button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)", marginLeft: 20 }}>
          {deckInfo?.deck_id ? `슬라이드 작업물 (Deck ID: ${deckInfo.deck_id.substring(0, 8)})` : "슬라이드 편집"}
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          {currentSlide} / {deckInfo?.slide_count ?? "?"}
        </span>
        {exportMsg && (
          <span style={{ fontSize: 12, color: "#a78bfa" }}>{exportMsg}</span>
        )}
        <button
          onClick={() => handleExport("pptx")}
          disabled={exporting}
          style={{
            height: 34,
            padding: "0 18px",
            background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
            border: "none",
            borderRadius: 7,
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            cursor: exporting ? "not-allowed" : "pointer",
            opacity: exporting ? 0.6 : 1,
            marginLeft: 20,
          }}
        >
          {exporting ? "변환 중..." : "PPTX 다운로드"}
        </button>
        <button
          onClick={() => handleExport("pdf")}
          disabled={exporting}
          style={{
            height: 34,
            padding: "0 18px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 7,
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            cursor: exporting ? "not-allowed" : "pointer",
          }}
        >
          PDF
        </button>
      </div>

      {/* 메인 영역 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 좌측: 슬라이드 번호 목록 */}
        <div style={{
          width: 72,
          background: "#0b0b16",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          padding: "12px 8px",
          gap: 6,
          overflowY: "auto",
        }}>
          {Array.from({ length: deckInfo?.slide_count ?? 0 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setCurrentSlide(n)}
              style={{
                height: 40,
                width: "100%",
                background: currentSlide === n ? "rgba(139,92,246,0.2)" : "transparent",
                border: currentSlide === n ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
                borderRadius: 6,
                color: currentSlide === n ? "#c4b5fd" : "rgba(255,255,255,0.3)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* 가운데: 슬라이드 캔버스 */}
        <div style={{
          flex: 1,
          padding: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080f",
        }}>
          <div style={{ width: "100%", maxWidth: 1000, boxShadow: "0 20px 40px rgba(0,0,0,0.5)"}}>
            <SlideEditor
              deckId={deckId}
              slideIndex={currentSlide}
              onElementSelect={setSelectedBBox}
            />
          </div>
        </div>

        {/* 우측: 수정 패널 */}
        <SlidePanel
          deckId={deckId}
          slideIndex={currentSlide}
          selectedBBox={selectedBBox}
          onClearSelection={() => setSelectedBBox(null)}
        />
      </div>
    </div>
  );
}
