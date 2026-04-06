'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { FileText, ArrowRight, CheckCircle2, Download, Edit3, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// 백엔드 API 인터페이스
interface FileInfo {
  file_id: string;
  filename: string;
  format: string;
  download_url: string;
  size_bytes?: number;
}

interface JobStatusResponse {
  job_id: string;
  status: "processing" | "success" | "failed";
  files: FileInfo[];
  message: string;
  duration_ms?: number;
  error?: string;
  progress?: string;
}

function GenerateContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '문서를 생성하는 중...';
  const jobId = searchParams.get('job_id');
  
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [progressMsg, setProgressMsg] = useState("작업 대기 중...");
  
  // UI Demo step animation (1~4)
  const [step, setStep] = useState(0);
  const steps = ["명령 분석", "구조 설계", "콘텐츠 생성", "파일 조립"];

  // Polling logic
  useEffect(() => {
    if (!jobId) {
      setErrorMessage("유효하지 않은 요청입니다 (job_id 누락)");
      setStatus("failed");
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
        if (!res.ok) throw new Error("작업 상태 조회 실패");
        
        const data: JobStatusResponse = await res.json();
        
        if (data.progress) setProgressMsg(data.progress);
        
        if (data.status === "success") {
          setStatus("success");
          setFiles(data.files || []);
          setStep(4); // completion step
          clearInterval(pollInterval);
        } else if (data.status === "failed") {
          setStatus("failed");
          setErrorMessage(data.error || "생성 중 오류가 발생했습니다.");
          clearInterval(pollInterval);
        } else {
          // If still processing, slowly animate UI steps
          setStep((prev) => (prev < 3 ? prev + 1 : 3));
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Poll every 2 seconds
    pollInterval = setInterval(checkStatus, 2000);
    // Initial check
    checkStatus();

    return () => clearInterval(pollInterval);
  }, [jobId]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const downloadUrl = files.length > 0 ? `${API_URL}/api/files/${files[0].file_id}` : "#";

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] flex flex-col items-center py-20 px-4 relative">
      
      {/* Top Breadcrumb */}
      <div className="absolute top-6 left-8 flex items-center gap-2 text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2 font-medium">
          <ArrowLeft size={16} /> 처음으로
        </Link>
      </div>

      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-3xl p-12 gs-shadow-lg flex flex-col items-center">
        
        {/* Title */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 relative">
            {status === "processing" && <div className="absolute inset-0 bg-indigo-100 rounded-2xl animate-spark-pulse blur-sm"></div>}
            <FileText size={40} className="relative z-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">AI 에이전트 작업 중</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto break-keep">
            "{query}"
          </p>
          <p className="text-sm font-medium text-indigo-500 mt-2">{progressMsg}</p>
        </div>

        {/* Step Progress Container */}
        {status !== "failed" && (
          <div className="w-full max-w-lg mb-16">
            <div className="w-full border-t-2 border-gray-100 mb-8 relative">
              <div 
                className="absolute top-[-2px] left-0 h-0.5 bg-indigo-600 transition-all duration-500" 
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between w-full relative">
              {steps.map((label, idx) => {
                const isPast = idx < step;
                const isCurrent = idx === step;
                const isDone = status === "success";
                return (
                  <div key={idx} className="flex flex-col items-center gap-3 w-1/4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${isPast || isDone ? 'bg-indigo-600 text-white' : isCurrent ? 'bg-indigo-100 text-indigo-600 ring-4 ring-indigo-50' : 'bg-gray-100 text-gray-400'}`}>
                      {isPast || isDone ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span className={`text-[13px] font-semibold whitespace-nowrap ${(isCurrent || isDone) ? 'text-indigo-600' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Result Action Area (Visible when complete or failed) */}
        <div className={`flex flex-col items-center transition-all duration-700 w-full ${status !== "processing" ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none absolute'}`}>
          
          {status === "success" ? (
            <div className="w-full bg-green-50 text-green-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gs-shadow mb-8 border border-green-100">
              <div className="flex items-center gap-4">
                <CheckCircle2 size={32} className="text-green-600" />
                <div>
                  <h3 className="font-bold text-lg">문서 생성이 완료되었습니다</h3>
                  <p className="text-sm text-green-700 opacity-80 mt-1">AI가 모든 내용을 성공적으로 작성했습니다.</p>
                </div>
              </div>
            </div>
          ) : status === "failed" ? (
             <div className="w-full bg-red-50 text-red-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gs-shadow mb-8 border border-red-100">
              <div className="flex items-center gap-4">
                <AlertCircle size={32} className="text-red-600" />
                <div>
                  <h3 className="font-bold text-lg">작업이 실패했습니다</h3>
                  <p className="text-sm text-red-700 opacity-80 mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-4">
            {status === "success" && (
              <a href={downloadUrl} download className="gs-primary-button px-8 flex items-center gap-2 cursor-pointer">
                <Download size={18} /> 파일 다운로드
              </a>
            )}
            
            <button className="bg-white border border-gray-200 text-gray-700 rounded-full px-8 py-2.5 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Edit3 size={18} /> 내용 수정하기
            </button>
            <Link href="/" className="bg-white border border-gray-200 text-gray-700 rounded-full py-2.5 px-6 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
              <ArrowRight size={18} /> 새 작업 시작
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-medium bg-[#fcfcfc] min-h-screen">Loading...</div>}>
      <GenerateContent />
    </Suspense>
  );
}
