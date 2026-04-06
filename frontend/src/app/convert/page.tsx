'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, BarChart2, FileText, FileCode, Table, FileSearch, Wand2, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ConversionState = 'upload' | 'analyzing' | 'result';

const formatOptions = [
  { icon: BarChart2, label: 'PPT 프레젠테이션', format: 'ppt', sub: '슬라이드 자동 구성', color: 'text-purple-600', ring: 'ring-purple-200 border-purple-300 bg-purple-50' },
  { icon: FileText, label: 'Word 문서', format: 'word', sub: '서식 있는 문서', color: 'text-blue-600', ring: 'ring-blue-200 border-blue-300 bg-blue-50' },
  { icon: FileCode, label: 'PDF 보고서', format: 'pdf', sub: '인쇄·배포용 (준비중)', color: 'text-amber-600', ring: 'ring-amber-200 border-amber-300 bg-amber-50' },
  { icon: Table, label: 'Excel 정리', format: 'excel', sub: '데이터 표 구성', color: 'text-green-600', ring: 'ring-green-200 border-green-300 bg-green-50' },
  { icon: FileSearch, label: 'AI 분석 보고서', format: 'analysis', sub: '심층 분석 (준비중)', color: 'text-orange-600', ring: 'ring-orange-200 border-orange-300 bg-orange-50' },
];

const history = [
  { file: '매출현황_Q1.xlsx', format: 'PPT', formatColor: 'bg-purple-100 text-purple-700', date: '2026.04.02 14:32', size: '2.3MB' },
  { file: '회의록_03월.docx', format: 'PDF', formatColor: 'bg-amber-100 text-amber-700', date: '2026.04.01 09:15', size: '890KB' },
];

export default function ConvertPage() {
  const [state, setState] = useState<ConversionState>('upload');
  const [selectedFormat, setSelectedFormat] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('요청을 준비 중입니다...');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | null = null;
    if ('dataTransfer' in e) {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        file = e.dataTransfer.files[0];
      }
    } else {
      if (e.target.files && e.target.files.length > 0) {
        file = e.target.files[0];
      }
    }

    if (file) {
      setFileName(file.name);
      // 백엔드 업로드 기능이 아직 없으므로 이름만 저장하고 진행
    }
  };

  const handleConvert = async () => {
    if (!instruction && !fileName) {
      alert("변환할 파일을 업로드하거나 추가 지시사항을 입력해주세요.");
      return;
    }

    const formatStr = formatOptions[selectedFormat].format;
    if (formatStr === 'pdf' || formatStr === 'analysis') {
      alert(`${formatOptions[selectedFormat].label} 형식은 개발 진행 중입니다.`);
      return;
    }

    setState('analyzing');
    setStatusMsg('AI 엔진에 문서 변환을 요청하고 있습니다...');

    try {
      const finalInstruction = instruction || (fileName ? `${fileName} 파일의 내용을 바탕으로 문서를 만들어주세요.` : '최신 트렌드를 반영한 문서를 만들어주세요.');
      const res = await axios.post(`${backendUrl}/api/generate/async`, {
        instruction: finalInstruction,
        format: formatStr,
        context: fileName ? { uploadedFileName: fileName } : {}
      });

      const id = res.data.job_id;
      setJobId(id);

      // Polling 설정
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${backendUrl}/api/jobs/${id}`);
          const { status, progress, error, files } = statusRes.data;

          if (progress) setStatusMsg(progress);

          if (status === 'success') {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setState('result');
            if (files && files.length > 0) {
              setDownloadUrl(`${backendUrl}${files[0].download_url}`);
              setFileSize(files[0].size_bytes);
            }
          } else if (status === 'failed') {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            alert("변환 실패: " + error);
            setState('upload');
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 2000);

    } catch (e) {
      console.error(e);
      alert("변환 시작 오류가 발생했습니다. 백엔드 서버가 켜져 있는지 확인하세요.");
      setState('upload');
    }
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* State 1: UPLOAD */}
      {state === 'upload' && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">파일 → 문서 변환</h1>
            <p className="text-gray-500 text-sm mt-1">어떤 파일이든 올려주세요. AI가 분석해 원하는 문서로 만들어드립니다.</p>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFile}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all mb-4 ${
              dragOver ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 
              fileName ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" />
            
            {fileName ? (
              <>
                <FileText size={36} className="mb-3 text-indigo-500" />
                <p className="text-sm font-bold text-indigo-900">{fileName}</p>
                <p className="text-xs text-indigo-600 mt-1">클릭하여 다른 파일 선택</p>
              </>
            ) : (
              <>
                <UploadCloud size={36} className={`mb-3 transition-colors ${dragOver ? 'text-indigo-500' : 'text-gray-300'}`} />
                <p className="text-sm text-gray-500 font-medium">파일을 드래그하거나 클릭해서 올리세요</p>
                <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint, 이미지, 텍스트 · 최대 50MB</p>
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
              {formatOptions.map((fmt, i) => {
                const Icon = fmt.icon;
                return (
                  <button key={i} onClick={() => setSelectedFormat(i)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${selectedFormat === i ? `ring-2 ${fmt.ring}` : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <Icon size={20} className={selectedFormat === i ? fmt.color : 'text-gray-400'} />
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
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">추가 지시사항 (선택 필수입력)</label>
            <textarea rows={3} 
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="예: 파일의 데이터를 기반으로 임원 보고용 PPT를 만들어줘. 3페이지 이내로 깔끔하게 정리해 줘."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-gray-900 resize-none placeholder-gray-400" />
          </div>

          {/* Convert Button */}
          <button onClick={handleConvert}
            className="w-full h-12 bg-gray-900 text-white flex items-center justify-center gap-2 rounded-xl font-semibold text-base hover:bg-black transition-colors shadow-sm disabled:bg-gray-400">
            <Wand2 size={18} /> AI 문서 변환 시작
          </button>
        </>
      )}

      {/* State 2: ANALYZING */}
      {state === 'analyzing' && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">문서 생성 진행 중...</h1>
          </div>
          <div className="gs-card p-6 max-w-xl mx-auto flex flex-col items-center justify-center py-12">
            <Loader2 size={48} className="text-indigo-500 animate-spin mb-6" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI가 작업을 수행하고 있습니다</h3>
            <p className="text-sm text-gray-500 text-center px-4 mb-8">
              {statusMsg}
            </p>
            {/* Progress bar */}
            <div className="mb-2 w-full max-w-md mx-auto">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 w-[75%] animate-pulse" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* State 3: RESULT */}
      {state === 'result' && (
        <>
          <div className="mb-6 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">✨ 완성된 문서</h1>
            </div>
            <p className="text-gray-500 mt-2">요청하신 AI 문서 생성이 성공적으로 완료되었습니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
            {/* Left: Preview */}
            <div className="gs-card flex flex-col items-center justify-center p-12 bg-gray-50 border-gray-200">
               <FileText size={48} className="text-indigo-500 mb-4" />
               <h3 className="text-xl font-bold text-gray-900 mb-1">{formatOptions[selectedFormat].label} 생성 완료</h3>
               <p className="text-sm text-gray-500 mb-6">파일이 준비되었습니다.</p>
               <a 
                 href={downloadUrl || '#'} 
                 download
                 className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition flex items-center gap-2">
                 <Download size={20} /> 문서 바로 다운로드
               </a>
            </div>
            {/* Right: Actions */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                {[{ label: '형식', value: formatOptions[selectedFormat].label.split(' ')[0] }, { label: '크기', value: formatBytes(fileSize) }].map((m) => (
                  <div key={m.label} className="gs-card p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                    <div className="font-bold text-gray-900 text-sm">{m.value}</div>
                  </div>
                ))}
              </div>
              
              <div className="gs-card p-4">
                <div className="text-xs text-gray-500 mb-2 font-bold uppercase">사용된 지시사항</div>
                <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{instruction || 'AI 자동 생성'}</div>
              </div>

              <button onClick={() => { setState('upload'); setInstruction(''); setFileName(null); }} className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                새로운 작업 시작
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
