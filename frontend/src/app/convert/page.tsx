'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, BarChart2, FileText, FileCode, Table, FileSearch, Wand2, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type ConversionState = 'upload' | 'uploading' | 'analyzing' | 'result' | 'error';

interface UploadResult {
  upload_id: string;
  filename: string;
  size_bytes: number;
  extracted_text: string;
}

const FORMAT_OPTIONS = [
  { icon: BarChart2, label: 'PPT 프레젠테이션', format: 'ppt',      sub: '슬라이드 자동 구성',      color: 'text-purple-600', ring: 'ring-purple-200 border-purple-300 bg-purple-50' },
  { icon: FileText,  label: 'Word 문서',        format: 'word',     sub: '서식 있는 문서',          color: 'text-blue-600',   ring: 'ring-blue-200 border-blue-300 bg-blue-50' },
  { icon: Table,     label: 'Excel 정리',       format: 'excel',    sub: '데이터 표 구성',          color: 'text-green-600',  ring: 'ring-green-200 border-green-300 bg-green-50' },
  { icon: FileCode,  label: 'PDF 보고서',       format: 'pdf',      sub: '준비중',                  color: 'text-amber-600',  ring: 'ring-amber-200 border-amber-300 bg-amber-50' },
  { icon: FileSearch,label: 'AI 분석 보고서',   format: 'analysis', sub: '준비중',                  color: 'text-orange-600', ring: 'ring-orange-200 border-orange-300 bg-orange-50' },
];

const UNAVAILABLE = new Set(['pdf', 'analysis']);

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ConvertPage() {
  const [state, setState] = useState<ConversionState>('upload');
  const [selectedFormat, setSelectedFormat] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resultFileSize, setResultFileSize] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 파일 선택 시 즉시 업로드
  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setUploadResult(null);
    setState('uploading');
    setStatusMsg('파일 업로드 중...');

    try {
      const formData = new FormData();
      formData.append('file', selected);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`업로드 실패 (${res.status})`);

      const data: UploadResult = await res.json();
      setUploadResult(data);
      setState('upload');
      setStatusMsg('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '업로드 오류';
      setErrorMsg(msg);
      setState('error');
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  };

  const handleConvert = async () => {
    const fmt = FORMAT_OPTIONS[selectedFormat];
    if (UNAVAILABLE.has(fmt.format)) {
      alert(`${fmt.label} 형식은 개발 진행 중입니다.`);
      return;
    }
    if (!instruction.trim() && !uploadResult) {
      alert('파일을 업로드하거나 지시사항을 입력해주세요.');
      return;
    }

    setState('analyzing');
    setStatusMsg('AI 엔진에 문서 변환을 요청하고 있습니다...');

    const baseInstruction = instruction.trim()
      || (uploadResult ? `${uploadResult.filename} 파일의 내용을 바탕으로 문서를 만들어주세요.` : '문서를 만들어주세요.');

    const context: Record<string, string> = {};
    if (uploadResult?.extracted_text) {
      context.extracted_text = uploadResult.extracted_text;
      context.source_filename = uploadResult.filename;
    }

    try {
      const res = await fetch('/api/generate/async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: baseInstruction, format: fmt.format, context }),
      });
      if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
      const { job_id } = await res.json();

      // 2초 간격 폴링
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/jobs/${job_id}`);
          if (!statusRes.ok) return;
          const { status, progress, error, files } = await statusRes.json();

          if (progress) setStatusMsg(progress);

          if (status === 'success') {
            clearInterval(pollingRef.current!);
            setState('result');
            if (files?.length > 0) {
              setDownloadUrl(files[0].download_url);
              setResultFileSize(files[0].size_bytes ?? 0);
            }
          } else if (status === 'failed') {
            clearInterval(pollingRef.current!);
            setErrorMsg(error || '변환 실패');
            setState('error');
          }
        } catch {
          // 네트워크 일시 오류 — 계속 폴링
        }
      }, 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '오류 발생';
      setErrorMsg(msg);
      setState('error');
    }
  };

  const handleReset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setState('upload');
    setFile(null);
    setUploadResult(null);
    setInstruction('');
    setDownloadUrl(null);
    setResultFileSize(0);
    setErrorMsg('');
    setStatusMsg('');
  };

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const isLoading = state === 'uploading' || state === 'analyzing';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">

      {/* ── UPLOAD / FORM ── */}
      {(state === 'upload' || state === 'uploading') && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">파일 → 문서 변환</h1>
            <p className="text-gray-500 text-sm mt-1">어떤 파일이든 올려주세요. AI가 분석해 원하는 문서로 만들어드립니다.</p>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all mb-4 ${
              dragOver             ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' :
              state === 'uploading'? 'border-indigo-300 bg-indigo-50 cursor-wait' :
              uploadResult         ? 'border-green-300 bg-green-50' :
                                     'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv,.md,.png,.jpg,.jpeg"
            />

            {state === 'uploading' ? (
              <>
                <Loader2 size={36} className="mb-3 text-indigo-400 animate-spin" />
                <p className="text-sm font-medium text-indigo-700">파일 업로드 및 분석 중...</p>
                <p className="text-xs text-indigo-500 mt-1">{file?.name}</p>
              </>
            ) : uploadResult ? (
              <>
                <CheckCircle2 size={36} className="mb-3 text-green-500" />
                <p className="text-sm font-bold text-green-900">{uploadResult.filename}</p>
                <p className="text-xs text-green-600 mt-1">
                  {formatBytes(uploadResult.size_bytes)} · 텍스트 추출 완료
                </p>
                <p className="text-xs text-gray-400 mt-2">클릭하여 다른 파일 선택</p>
              </>
            ) : (
              <>
                <UploadCloud size={36} className={`mb-3 transition-colors ${dragOver ? 'text-indigo-500' : 'text-gray-300'}`} />
                <p className="text-sm text-gray-500 font-medium">파일을 드래그하거나 클릭해서 올리세요</p>
                <p className="text-xs text-gray-400 mt-1">PDF · Word · Excel · PPT · 이미지 · 텍스트 · 최대 50MB</p>
              </>
            )}
          </div>

          <div className="flex gap-2 flex-wrap mb-6">
            {['PDF', 'Word', 'Excel', 'PPT', '이미지', '텍스트', 'CSV'].map((f) => (
              <span key={f} className="px-3 py-1 border border-gray-200 rounded-full text-xs text-gray-500">{f}</span>
            ))}
          </div>

          {/* Output Format */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">변환할 문서 형식</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FORMAT_OPTIONS.map((fmt, i) => {
                const Icon = fmt.icon;
                const disabled = UNAVAILABLE.has(fmt.format);
                return (
                  <button
                    key={i}
                    onClick={() => !disabled && setSelectedFormat(i)}
                    disabled={disabled}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      disabled
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : selectedFormat === i
                          ? `ring-2 ${fmt.ring}`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} className={selectedFormat === i && !disabled ? fmt.color : 'text-gray-400'} />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{fmt.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{fmt.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              추가 지시사항 {!uploadResult && <span className="text-red-400">(파일 없을 시 필수)</span>}
            </label>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="예: 임원 보고용 PPT로 만들어줘. 3페이지 이내로 핵심만 정리해줘."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-gray-900 resize-none placeholder-gray-400"
            />
          </div>

          <button
            onClick={handleConvert}
            disabled={isLoading || (!instruction.trim() && !uploadResult)}
            className="w-full h-12 bg-gray-900 text-white flex items-center justify-center gap-2 rounded-xl font-semibold text-base hover:bg-black transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Wand2 size={18} /> AI 문서 변환 시작
          </button>
        </>
      )}

      {/* ── ANALYZING ── */}
      {state === 'analyzing' && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">문서 생성 진행 중...</h1>
          </div>
          <div className="gs-card p-6 max-w-xl mx-auto flex flex-col items-center justify-center py-16">
            <Loader2 size={48} className="text-indigo-500 animate-spin mb-6" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI가 작업을 수행하고 있습니다</h3>
            <p className="text-sm text-gray-500 text-center px-4 mb-8">{statusMsg}</p>
            <div className="w-full max-w-md">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 w-[60%] animate-pulse" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── RESULT ── */}
      {state === 'result' && (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">✨ 완성된 문서</h1>
            <p className="text-gray-500 mt-2">AI 문서 생성이 완료되었습니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
            <div className="gs-card flex flex-col items-center justify-center p-12 bg-gray-50 border-gray-200">
              <FileText size={48} className="text-indigo-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-1">{FORMAT_OPTIONS[selectedFormat].label} 생성 완료</h3>
              <p className="text-sm text-gray-500 mb-6">파일이 준비되었습니다.</p>
              <a
                href={downloadUrl || '#'}
                download
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Download size={20} /> 문서 바로 다운로드
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '형식', value: FORMAT_OPTIONS[selectedFormat].label.split(' ')[0] },
                  { label: '크기', value: resultFileSize ? formatBytes(resultFileSize) : '-' },
                ].map((m) => (
                  <div key={m.label} className="gs-card p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                    <div className="font-bold text-gray-900 text-sm">{m.value}</div>
                  </div>
                ))}
              </div>
              {uploadResult && (
                <div className="gs-card p-4">
                  <div className="text-xs text-gray-500 mb-2 font-bold uppercase">원본 파일</div>
                  <div className="text-sm text-gray-800">{uploadResult.filename}</div>
                </div>
              )}
              <div className="gs-card p-4">
                <div className="text-xs text-gray-500 mb-2 font-bold uppercase">사용된 지시사항</div>
                <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {instruction || 'AI 자동 생성'}
                </div>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                새로운 작업 시작
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── ERROR ── */}
      {state === 'error' && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <XCircle size={48} className="text-red-400" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-sm text-gray-500">{errorMsg}</p>
          </div>
          <button
            onClick={handleReset}
            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
