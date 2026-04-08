'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const MOCK_EVENTS: Record<string, { title: string; color: string }[]> = {
  '3': [{ title: 'R&D 공고 수집', color: 'bg-blue-100 text-blue-700' }],
  '5': [{ title: '중기부 보고서 발송', color: 'bg-purple-100 text-purple-700' }],
  '7': [{ title: '주간 보고서 자동 생성', color: 'bg-green-100 text-green-700' }],
  '10': [{ title: '창업패키지 마감 준비', color: 'bg-red-100 text-red-700' }],
  '15': [{ title: '지원서 컨펌 요청', color: 'bg-amber-100 text-amber-700' }],
};

export default function SchedulePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  const monthLabel = new Date(year, month).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  const upcomingEvents = Object.entries(MOCK_EVENTS)
    .map(([day, evts]) => ({ day: parseInt(day), ...evts[0] }))
    .sort((a, b) => a.day - b.day);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">스케줄</h1>
        <p className="text-gray-500 text-sm mt-1">자동화 작업 실행 일정을 확인하고 관리하세요.</p>
      </div>

      <div className="gs-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">{monthLabel}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              오늘
            </button>
            <button onClick={nextMonth} className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d, i) => (
            <div key={d} className={`text-center text-xs font-bold py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty prefix cells */}
          {[...Array(firstDayOfWeek)].map((_, i) => (
            <div key={`empty-${i}`} className="h-16 rounded-lg" />
          ))}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const events = MOCK_EVENTS[String(day)];
            const isToday = day === todayDay;
            return (
              <div
                key={day}
                className={`h-16 rounded-lg p-1.5 border transition-colors cursor-pointer ${
                  isToday
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`text-xs font-bold mb-1 ${isToday ? 'text-white' : 'text-gray-700'}`}>{day}</div>
                {events?.map((ev, idx) => (
                  <div key={idx} className={`text-[10px] font-medium px-1 py-0.5 rounded truncate ${ev.color}`}>
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div className="mt-6">
        <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3">이번 달 예정 작업</div>
        {upcomingEvents.length === 0 ? (
          <div className="gs-card p-6 text-center text-sm text-gray-400">예정된 작업이 없습니다.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingEvents.map((e, i) => (
              <div key={i} className="gs-card p-4 flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${e.color}`}>
                  {month + 1}월 {e.day}일
                </div>
                <div className="text-sm font-semibold text-gray-900">{e.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
