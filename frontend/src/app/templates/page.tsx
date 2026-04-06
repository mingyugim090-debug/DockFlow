import { LayoutTemplate, ArrowRight } from 'lucide-react';

const templates = [
  { title: '정부 R&D 사업 지원서', category: '공모전', color: 'bg-blue-50', icon: '🏛️', pages: 12 },
  { title: '스타트업 사업계획서', category: '창업지원', color: 'bg-purple-50', icon: '🚀', pages: 8 },
  { title: '분기별 실적 보고서 (PPT)', category: '보고서', color: 'bg-green-50', icon: '📊', pages: 10 },
  { title: '기술개발 과제 신청서', category: 'R&D', color: 'bg-amber-50', icon: '🔬', pages: 15 },
  { title: '투자 유치 IR 자료', category: '투자', color: 'bg-red-50', icon: '💰', pages: 20 },
  { title: '주간 업무 보고서', category: '보고서', color: 'bg-teal-50', icon: '📝', pages: 3 },
];

export default function TemplatesPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">템플릿</h1>
        <p className="text-gray-500 text-sm mt-1">자주 쓰는 문서 형식을 템플릿으로 바로 사용하세요.</p>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['전체', '공모전', '보고서', '창업지원', 'R&D', '투자'].map((c) => (
          <button key={c} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${c === '전체' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{c}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map((t, i) => (
          <div key={i} className="gs-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
            <div className={`w-12 h-12 rounded-xl ${t.color} flex items-center justify-center text-2xl mb-4`}>{t.icon}</div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.category}</span>
            <h3 className="text-sm font-bold text-gray-900 mt-1 mb-2">{t.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 flex items-center gap-1"><LayoutTemplate size={12} /> {t.pages}페이지</span>
              <button className="flex items-center gap-1 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                사용하기 <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
