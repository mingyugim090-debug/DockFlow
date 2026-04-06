// DocFlow AI 타입 정의

export type DocFormat = "pptx" | "xlsx" | "pdf" | "contract";

export interface GenerateRequest {
  instruction: string;
  format: DocFormat;
  context?: Record<string, unknown>;
  session_id?: string;
}

export interface DocumentResponse {
  file_id: string;
  filename: string;
  format: string;
  download_url: string;
  created_at: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface FileInfo {
  file_id: string;
  filename: string;
  format: string;
  download_url: string;
  size_bytes?: number;
  expires_at?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: "processing" | "success" | "failed";
  files: FileInfo[];
  message: string;
  duration_ms?: number;
  error?: string;
  progress?: string;
}

export interface RecentDocument {
  file_id: string;
  filename: string;
  format: string;
  created_at: string;
  size_bytes: number;
}

export interface DocumentListItem {
  id: string;
  file_id: string;
  filename: string;
  format: string;
  instruction?: string;
  size_bytes: number;
  created_at: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  format: DocFormat;
  prompt: string;
  badge: string;
}
