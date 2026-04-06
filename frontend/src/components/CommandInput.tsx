'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, ArrowUp, Plus, Wrench, AudioLines } from 'lucide-react';

export default function CommandInput() {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/generate/async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: query,
          format: "pptx"
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API 요청 실패 (${response.status})`);
      }
      
      const data = await response.json();
      router.push(`/generate?job_id=${data.job_id}&q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error(error);
      alert('생성 요청 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인하세요.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form 
        onSubmit={handleSubmit}
        className="w-full bg-white rounded-[2rem] border border-gray-200 p-6 transition-all duration-300 hover:border-gray-300 gs-shadow-lg flex flex-col gap-4 relative"
      >
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsTyping(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="무엇이든 물어보고 만들어보세요"
          className="w-full min-h-[64px] max-h-[160px] bg-transparent text-gray-900 placeholder:text-gray-400 font-medium text-xl resize-none outline-none focus:ring-0 whitespace-pre-wrap leading-relaxed px-2 overflow-y-auto"
          rows={1}
        />

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-transparent">
          {/* Left Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
            >
              <Plus size={20} />
            </button>
            <button
              type="button"
              className="h-10 px-4 rounded-full border border-gray-200 flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <div className="w-5 h-5 bg-black rounded text-white flex items-center justify-center font-bold text-xs">N</div>
              <Wrench size={16} />
            </button>
            <button
              type="button"
              className="h-10 px-4 flex items-center gap-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16v0Z"/>
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4v0Z"/>
                <path d="M12 2v2"/>
                <path d="M12 20v2"/>
                <path d="m4.93 4.93 1.41 1.41"/>
                <path d="m17.66 17.66 1.41 1.41"/>
                <path d="M2 12h2"/>
                <path d="M20 12h2"/>
                <path d="m6.34 17.66-1.41 1.41"/>
                <path d="m19.07 4.93-1.41 1.41"/>
              </svg>
              Ultra
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Mic size={24} />
            </button>
            
            {isTyping ? (
              <button
                type="submit"
                className="gs-primary-button w-auto px-5 h-10 shadow-md"
              >
                <ArrowUp size={20} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                className="gs-primary-button w-auto px-5 h-10 shadow-md flex items-center gap-2"
              >
                <AudioLines size={18} strokeWidth={2.5} className="text-white" />
                <span className="text-white font-medium">대화</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
