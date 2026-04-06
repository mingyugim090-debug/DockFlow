// DocFlow AI API 클라이언트

import { getSession } from "next-auth/react";
import { DocumentResponse, GenerateRequest } from "./types";

// Next.js rewrites(/api/* → FastAPI)를 활용하여 상대경로 사용
// NEXT_PUBLIC_API_URL은 직접 다운로드 URL 등 절대경로가 필요한 경우에만 사용
const API_BASE = "";

// 인증 헤더 포함 fetch 헬퍼
async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getSession();
  const userId = session?.user?.id;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (userId) {
    headers["X-User-Id"] = userId;
  }

  return fetch(`${API_BASE}${url}`, { ...options, headers });
}

export async function generateDocument(
  request: GenerateRequest
): Promise<DocumentResponse> {
  const res = await authFetch("/api/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `서버 오류 (${res.status})`);
  }

  return res.json();
}

// SSE 스트리밍 생성 — EventSource는 GET만 지원하므로 fetch 스트리밍 사용
export async function generateDocumentStream(
  request: GenerateRequest,
  onProgress: (step: string, message: string) => void,
  onComplete: (files: DocumentResponse["files"]) => void,
  onError: (message: string) => void
): Promise<void> {
  const session = await getSession();
  const userId = session?.user?.id;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (userId) headers["X-User-Id"] = userId;

  const res = await fetch(`${API_BASE}/api/generate/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!res.ok || !res.body) {
    onError(`서버 오류 (${res.status})`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "progress") {
            onProgress(data.step, data.message);
          } else if (data.type === "complete") {
            onComplete(data.files);
          } else if (data.type === "error") {
            onError(data.message);
          }
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    }
  }
}

export function getDownloadUrl(file_id: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${base}/api/files/${file_id}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFormatBadgeColor(format: string): string {
  const map: Record<string, string> = {
    pptx: "#f97316",
    xlsx: "#10b981",
    pdf: "#ef4444",
    contract: "#8b5cf6",
  };
  return map[format] || "#6b7280";
}

export function getFormatLabel(format: string): string {
  const map: Record<string, string> = {
    pptx: "PPT",
    xlsx: "EXCEL",
    pdf: "PDF",
    contract: "계약서",
  };
  return map[format] || format.toUpperCase();
}
