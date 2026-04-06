import { Search, Plus, CloudDownload, MoreHorizontal, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const suggestedPrompts = [
    "저작권이 없는 이미지 웹사이트에서 사진 다운로드",
    "LinkedIn 링크에 언급된 논문 다운로드",
    "Genspark의 한국 틱톡에서 비디오 다운로드"
  ];

  return (
    <div className="w-full min-h-screen bg-white px-10 py-10 md:pl-20">
      
      {/* Top Header Row */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between mb-12">
        <div className="relative w-full max-w-3xl bg-gray-50 border border-gray-200 rounded-xl flex items-center px-5 py-3 hover:bg-gray-100 transition-colors focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400">
          <Search size={20} className="text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="파일 및 폴더 검색" 
            className="w-full bg-transparent text-base outline-none placeholder:text-gray-400 text-gray-900 font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <span>0.0 MB / 1.0 GB</span>
            <Link href="/checkout" className="text-indigo-600 hover:underline">업그레이드</Link>
          </div>
          <button className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
            <Plus size={16} /> 신규
          </button>
          <button className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <CloudDownload size={16} /> 다운로드하기
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">모든 파일</h1>
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
            <button className="p-1.5 text-gray-400 hover:text-gray-600"><Search size={16} /></button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600"><Search size={16} /></button>
          </div>
        </div>

        <div className="mb-10 flex items-center justify-between">
          <button className="text-sm font-bold text-gray-900 flex items-center gap-1 hover:text-indigo-600">
            최근 파일 <Search size={14} className="rotate-90" />
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 mb-12">
          <p className="text-gray-400 font-medium mb-12">아직 최근 파일이 없습니다</p>
          
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900">한 줄의 프롬프트로 파일 다운로드하기</h3>
            <div className="flex flex-col gap-3 w-full">
              {suggestedPrompts.map((prompt, i) => (
                <button 
                  key={i} 
                  className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-all text-sm font-medium text-gray-600 flex items-center justify-center gap-2 group"
                >
                  <span className="text-gray-300 font-serif leading-none italic opacity-50 text-lg">"</span>
                  {prompt}
                  <span className="text-gray-300 font-serif leading-none italic opacity-50 text-lg">"</span>
                </button>
              ))}
            </div>

            <div className="flex items-center w-full max-w-md my-8">
              <div className="flex-1 border-t border-dashed border-gray-200"></div>
              <span className="px-4 text-xs font-medium text-gray-400 bg-white">또는</span>
              <div className="flex-1 border-t border-dashed border-gray-200"></div>
            </div>

            <button className="text-sm text-gray-500 hover:text-gray-900 font-medium pb-1 border-b border-gray-300 hover:border-gray-900 transition-colors">
              시작하기 <span className="underline">다운로드하기</span>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
