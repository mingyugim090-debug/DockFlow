export type FileFormat = "pptx" | "xlsx" | "pdf" | "contract";

export interface GenerateRequest {
  instruction: string;
  format?: FileFormat;
  context?: Record<string, any>;
  session_id?: string;
}

export interface FileInfo {
  file_id: string;
  filename: string;
  format: string;
  download_url: string;
  size_bytes?: number;
}

export interface JobResponse {
  job_id: string;
  status: "processing" | "success" | "failed";
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
