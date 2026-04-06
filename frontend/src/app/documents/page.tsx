import { FolderOpen, Clock, Search, Filter } from 'lucide-react';

const documents = [
  { type: 'PPT', typeColor: 'bg-purple-100 text-purple-700', title: '2026 중소기업 디지털 전환 지원사업 지원서', date: '2026.04.02', size: '3.2MB' },
  { type: 'WORD', typeColor: 'bg-blue-100 text-blue-700', title: '스마트팩토리 구축 제안서', date: '2026.04.01', size: '890KB' },
  { type: '분석', typeColor: 'bg-orange-100 text-orange-700', title: '과기부 R&D 공고 적합성 분석 보고서', date: '2026.03.30', size: '1.1MB' },
  { type: 'PDF', typeColor: 'bg-amber-100 text-amber-700', title: '2025 창업진흥원 사업계획서', date: '2026.03.25', size: '4.5MB' },
  { type: 'PPT', typeColor: 'bg-purple-100 text-purple-700', title: '주간 실적 보고서 (3월 4주차)', date: '2026.03.22', size: '2.1MB' },
  { type: 'WORD', typeColor: 'bg-blue-100 text-blue-700', title: '중기부 지원사업 신청서 패키지', date: '2026.03.18', size: '1.8MB' },
];

export default function DocumentsPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 문서</h1>
          <p className="text-gray-500 text-sm mt-1">AI가 생성한 모든 문서를 관리하세요.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={15} /> 필터
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="문서 검색..."
            className="h-9 pl-9 pr-4 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all w-60 text-gray-900 placeholder-gray-400" />
        </div>
        {['전체', 'PPT', 'WORD', 'PDF', '분석'].map((f) => (
          <button key={f} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${f === '전체' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f}</button>
        ))}
      </div>

      <div className="gs-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              <th className="text-left p-4">문서명</th>
              <th className="text-left p-4">형식</th>
              <th className="text-left p-4">생성일</th>
              <th className="text-left p-4">크기</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FolderOpen size={16} className="text-gray-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{doc.title}</span>
                  </div>
                </td>
                <td className="p-4"><span className={`text-[11px] font-bold px-2 py-0.5 rounded ${doc.typeColor}`}>{doc.type}</span></td>
                <td className="p-4">
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{doc.date}</span>
                </td>
                <td className="p-4 text-xs text-gray-400">{doc.size}</td>
                <td className="p-4">
                  <button className="text-xs font-semibold text-blue-600 hover:underline">다운로드</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
