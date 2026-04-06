"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
  elementPath: string;
  outerHTML: string;
  tagName: string;
  textContent: string;
}

interface SlideEditorProps {
  deckId: string;
  slideIndex: number;
  onElementSelect: (bbox: BBox | null) => void;
}

export default function SlideEditor({
  deckId,
  slideIndex,
  onElementSelect,
}: SlideEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBBox, setSelectedBBox] = useState<BBox | null>(null);
  const [iframeScale, setIframeScale] = useState(1);

  // iframe 크기에 따른 스케일 계산 (1280x720을 컨테이너에 맞춤)
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const scaleX = width / 1280;
      const scaleY = height / 720;
      setIframeScale(Math.min(scaleX, scaleY));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // iframe postMessage 수신
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === "ELEMENT_SELECTED") {
        const bbox: BBox = {
          ...e.data.bbox,
          // 스케일 보정
          x: e.data.bbox.x * iframeScale,
          y: e.data.bbox.y * iframeScale,
          width:  e.data.bbox.width  * iframeScale,
          height: e.data.bbox.height * iframeScale,
        };
        setSelectedBBox(bbox);
        onElementSelect(bbox);
      }
      if (e.data.type === "UPDATE_DONE") {
        setSelectedBBox(null);
        onElementSelect(null);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [iframeScale, onElementSelect]);

  // 외부에서 요소 업데이트 요청
  const updateElement = useCallback((path: string, html: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "UPDATE_ELEMENT", path, html },
      "*"
    );
  }, []);

  // ref를 통해 외부로 노출
  useEffect(() => {
    (window as any).__slideEditorUpdate = updateElement;
  }, [updateElement]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#000",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* 슬라이드 iframe */}
      <iframe
        ref={iframeRef}
        // Next.js config의 backend rewrite를 타도록 상대 경로 사용 (또는 NEXT_PUBLIC_API_URL 절대 경로 사용)
        src={`/api/slides/${deckId}/slides/${slideIndex}/html`}
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: 1280,
          height: 720,
          border: "none",
          transformOrigin: "top left",
          transform: `scale(${iframeScale})`,
        }}
        title={`Slide ${slideIndex}`}
      />

      {/* 선택 영역 bbox 오버레이 */}
      {selectedBBox && (
        <div
          style={{
            position: "absolute",
            left:   selectedBBox.x,
            top:    selectedBBox.y,
            width:  selectedBBox.width,
            height: selectedBBox.height,
            border: "2px solid #8b5cf6",
            background: "rgba(139,92,246,0.1)",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{
            position: "absolute",
            top: -22,
            left: 0,
            background: "#8b5cf6",
            color: "#fff",
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: "3px 3px 0 0",
            letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}>
            {selectedBBox.tagName} · {selectedBBox.textContent.substring(0, 20)}
          </div>
        </div>
      )}
    </div>
  );
}
