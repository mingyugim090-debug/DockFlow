export default function SchedulePage() {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const events = [
    { day: 3, title: 'R&D 공고 수집', time: '09:00', color: 'bg-blue-100 text-blue-700' },
    { day: 5, title: '중기부 보고서 발송', time: '14:00', color: 'bg-purple-100 text-purple-700' },
    { day: 7, title: '주간 보고서 자동 생성', time: '09:00', color: 'bg-green-100 text-green-700' },
    { day: 10, title: '창업패키지 마감 준비', time: '18:00', color: 'bg-red-100 text-red-700' },
    { day: 15, title: '지원서 컨펌 요청', time: '10:00', color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">스케줄</h1>
        <p className="text-gray-500 text-sm mt-1">자동화 작업 실행 일정을 확인하고 관리하세요.</p>
      </div>
      <div className="gs-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">2026년 4월</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">◀</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">▶</button>
          </div>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {days.map((d, i) => (
            <div key={d} className={`text-center text-xs font-bold py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Empty prefix cells */}
          {[...Array(2)].map((_, i) => <div key={`empty-${i}`} className="h-16 rounded-lg" />)}
          {[...Array(30)].map((_, i) => {
            const day = i + 1;
            const event = events.find(e => e.day === day);
            return (
              <div key={day} className={`h-16 rounded-lg p-1.5 border transition-colors cursor-pointer ${day === 2 ? 'bg-blue-600 border-blue-600' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                <div className={`text-xs font-bold mb-1 ${day === 2 ? 'text-white' : 'text-gray-700'}`}>{day}</div>
                {event && <div className={`text-[10px] font-medium px-1 py-0.5 rounded truncate ${event.color}`}>{event.title}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-6">
        <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3">이번 달 예정 작업</div>
        <div className="flex flex-col gap-2">
          {events.map((e, i) => (
            <div key={i} className="gs-card p-4 flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${e.color}`}>4월 {e.day}일</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{e.title}</div>
                <div className="text-xs text-gray-400">{e.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
