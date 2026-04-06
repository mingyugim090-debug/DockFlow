'use client';

import { useState } from 'react';
import { Search, Filter, Settings, Plus } from 'lucide-react';

const announcements = [
  {
    score: 92,
    category: 'R&D',
    categoryColor: 'bg-blue-100 text-blue-700',
    org: '과학기술정보통신부',
    title: '2026년 중소기업 AI·디지털 전환 기술개발 지원사업',
    summary: 'AI 기반 제조공정 혁신 기술 개발에 최대 5억원 지원. 3년간 연구비 지원.',
    deadline: '2026.04.30', dDay: 'D-12', dDayColor: 'text-red-500 bg-red-50',
    fund: '최대 5억원',
    keywords: ['AI', '제조혁신', '중소기업'],
    isNew: false,
  },
  {
    score: 88,
    category: 'R&D',
    categoryColor: 'bg-blue-100 text-blue-700',
    org: '과학기술정보통신부',
    title: '클라우드·SaaS 기반 소프트웨어 개발 지원사업 공고',
    summary: 'SaaS 제품 개발 및 글로벌 진출을 위한 기술개발비 최대 2억 지원.',
    deadline: '2026.05.15', dDay: 'D-30', dDayColor: 'text-gray-500 bg-gray-100',
    fund: '최대 2억원',
    keywords: ['SaaS', '클라우드', '소프트웨어'],
    isNew: true,
  },
  {
    score: 78,
    category: '창업지원',
    categoryColor: 'bg-purple-100 text-purple-700',
    org: '중소벤처기업부',
    title: '2026 초기창업패키지 3차 모집 공고',
    summary: '창업 3년 이내 기업 대상, 최대 1억원 사업화 자금 지원.',
    deadline: '2026.04.20', dDay: 'D-5', dDayColor: 'text-red-500 bg-red-50',
    fund: '최대 1억원',
    keywords: ['창업', '초기', '사업화'],
    isNew: false,
  },
  {
    score: 65,
    category: '수출지원',
    categoryColor: 'bg-green-100 text-green-700',
    org: '산업통상자원부',
    title: '글로벌 강소기업 1000+ 수출바우처 지원사업',
    summary: '수출 유망 중소기업 대상 글로벌 마케팅·통번역·특허 서비스 지원.',
    deadline: '2026.05.05', dDay: 'D-21', dDayColor: 'text-amber-600 bg-amber-50',
    fund: '3천만원',
    keywords: ['수출', '글로벌', '마케팅'],
    isNew: false,
  },
  {
    score: 45,
    category: '제조혁신',
    categoryColor: 'bg-orange-100 text-orange-700',
    org: '산업통상자원부',
    title: '뿌리산업 스마트화 지원사업',
    summary: '주조·단조·용접 등 뿌리기술 기반 제조업 스마트공장 구축 지원.',
    deadline: '2026.05.30', dDay: 'D-45', dDayColor: 'text-gray-500 bg-gray-100',
    fund: '최대 4억원',
    keywords: ['제조', '스마트공장'],
    isNew: false,
  },
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-indigo-500' : score >= 60 ? 'bg-amber-400' : 'bg-gray-300';
  const textColor = score >= 80 ? 'text-indigo-600' : score >= 60 ? 'text-amber-500' : 'text-gray-400';
  return (
    <div className="text-right">
      <div className="flex items-end justify-end gap-1 mb-1">
        <span className={`text-3xl font-extrabold ${textColor}`}>{score}</span>
        <span className="text-sm text-gray-400 mb-1">점</span>
      </div>
      <div className="text-[11px] text-gray-400 mb-2">AI 적합도</div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [search, setSearch] = useState('');

  const stats = [
    { label: '오늘 수집', value: '23건', color: 'text-gray-700' },
    { label: '분석 완료', value: '21건', color: 'text-gray-700' },
    { label: '높은 적합도', value: '5건', color: 'text-indigo-600', ring: 'ring-indigo-200 bg-indigo-50' },
    { label: '마감 임박', value: '3건', color: 'text-amber-600', ring: 'ring-amber-200 bg-amber-50' },
  ];

  const filtered = announcements.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.org.includes(search)
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공고 모니터링</h1>
          <p className="text-gray-500 text-sm mt-1">AI가 공모전·정부사업 공고를 자동 수집하고 적합성을 분석합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={15} /> 필터
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings size={15} /> 소스 설정
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors shadow-sm">
            <Plus size={15} /> 수집 소스 추가
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="flex gap-3 flex-wrap mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold bg-white ring-2 ring-transparent ${s.ring || ''}`}>
            <span className="text-xs text-gray-500">{s.label}:</span>
            <span className={s.color}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 items-center flex-wrap mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="공고명, 기관 검색..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-4 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all w-56 text-gray-900 placeholder-gray-400" />
        </div>
        {['전체 카테고리', '전체 기관', '최신순', '전체 점수'].map((sel) => (
          <select key={sel} className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 focus:outline-none cursor-pointer">
            <option>{sel}</option>
          </select>
        ))}
      </div>

      {/* Announcement Cards */}
      <div className="flex flex-col gap-4">
        {filtered.map((a) => (
          <div key={a.title} className={`gs-card p-5 hover:shadow-md transition-all duration-200 ${a.score >= 80 ? 'border-l-4 border-l-indigo-500' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-5">
              {/* Left */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.categoryColor}`}>{a.category}</span>
                  <span className="text-xs text-gray-400">{a.org}</span>
                  {a.isNew && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 animate-pulse">NEW</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 hover:text-indigo-600 cursor-pointer leading-snug mb-2">{a.title}</h3>
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 shrink-0">AI 요약</span>
                  <p className="text-xs text-gray-500 leading-relaxed">{a.summary}</p>
                </div>
                <div className="flex gap-5 text-xs text-gray-400 mb-3">
                  <span>마감: {a.deadline}</span>
                  <span>지원금: {a.fund}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${a.dDayColor}`}>{a.dDay}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {a.keywords.map((kw) => (
                    <span key={kw} className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">{kw}</span>
                  ))}
                </div>
              </div>
              {/* Right */}
              <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5">
                <ScoreBar score={a.score} />
                <div className="flex flex-col gap-2 mt-4">
                  <button className="w-full px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    지원서 자동 생성
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    상세 분석 보기
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-8">
        {[1, 2, 3, '...', 12].map((p, i) => (
          <button key={i} className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${p === 1 ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
        ))}
      </div>
    </div>
  );
}
