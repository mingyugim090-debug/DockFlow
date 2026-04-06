'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

type TabType = '전체' | '검토 대기' | '승인됨' | '반려됨';

const cards = [
  {
    urgent: true,
    status: '검토 대기', deadline: 'D-1',
    workflow: 'AI 워크플로우 자동 생성',
    title: '2026 창업진흥원 초기창업패키지 지원서 (3차)',
    org: '창업진흥원', fund: '최대 1억원', score: 91,
    docs: ['사업계획서 8p', '팀소개 2p', '재무계획 3p'],
    summary: '사업 적합성 점수 91점. \'AI 기반 자동화\'가 핵심 선정 키워드와 일치. 재무계획 보완 권고.',
    requestedAt: '2시간 전',
  },
  {
    urgent: false,
    status: '검토 대기', deadline: 'D-5',
    workflow: '정부 R&D 공고 모니터링',
    title: '과학기술정보통신부 R&D 사업화 지원 신청서',
    org: '과기부', fund: '최대 5억원', score: 84,
    docs: ['기술개발계획서 10p', '사업화전략 5p', '예산계획 4p'],
    summary: '기술 독창성 항목 우수. 사업화 전략 구체성 추가 보완 필요. 전반적 완성도 높음.',
    requestedAt: '5시간 전',
  },
  {
    urgent: false,
    status: '검토중', deadline: 'D-12',
    workflow: '중소기업 지원사업 모니터링',
    title: '중소기업 스마트공장 구축 지원사업 신청서',
    org: '중기부', fund: '최대 3억원', score: 72,
    docs: ['신청서 12p', '사업계획 6p'],
    summary: '기술 부분 추가 정보 필요. 전반적인 구성은 완성도가 있으나 세부 조율이 필요합니다.',
    requestedAt: '어제',
  },
];

const completed = [
  { title: '2025 혁신창업 패키지 사업계획서', result: '승인됨', resultColor: 'text-green-600 bg-green-50', date: '2026.03.25' },
  { title: '과기부 AI 기반 제조혁신 R&D 신청서', result: '승인됨', resultColor: 'text-green-600 bg-green-50', date: '2026.03.20' },
  { title: '중기부 수출 역량 강화 사업 신청서', result: '반려됨', resultColor: 'text-red-600 bg-red-50', date: '2026.03.15' },
  { title: '2025 스마트시티 실증사업 신청서', result: '승인됨', resultColor: 'text-green-600 bg-green-50', date: '2026.03.10' },
  { title: '창업진흥원 글로벌 도약 패키지', result: '승인됨', resultColor: 'text-green-600 bg-green-50', date: '2026.03.02' },
];

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('전체');
  const [showCompleted, setShowCompleted] = useState(false);

  const tabs: TabType[] = ['전체', '검토 대기', '승인됨', '반려됨'];

  const filtered = cards.filter(c => {
    if (activeTab === '전체') return true;
    return c.status === activeTab;
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">컨펌 요청함</h1>
          <p className="text-gray-500 text-sm mt-1">AI가 생성한 문서 초안을 검토하고 승인하세요.</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-400" />대기중 3건
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-400" />오늘 마감 1건
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-400" />이번 주 완료 5건
        </div>
      </div>

      {/* Review Cards */}
      <div className="flex flex-col gap-4 mb-6">
        {filtered.map((card) => (
          <div key={card.title}
            className={`rounded-2xl border p-5 transition-all ${
              card.urgent
                ? 'border-l-4 border-l-red-400 bg-red-50/40 border-red-100'
                : 'border-gray-200 bg-white'
            } shadow-sm`}>
            {/* Top Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {card.urgent && <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">⚡ 긴급 · 오늘 마감</span>}
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">{card.status}</span>
                <span className="text-xs text-gray-400">{card.workflow}</span>
              </div>
              <span className={`text-xs font-bold ${parseInt(card.deadline.replace('D-', '')) <= 7 ? 'text-amber-600 bg-amber-50' : 'text-gray-400 bg-gray-100'} px-2.5 py-1 rounded-full`}>
                마감 {card.deadline}
              </span>
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1.5">{card.title}</h3>
            
            {/* Meta */}
            <div className="flex gap-5 text-xs text-gray-400 mb-4">
              <span>기관: {card.org}</span>
              <span>사업비: {card.fund}</span>
              <span>AI 적합도: <b className="text-indigo-600">{card.score}점</b></span>
            </div>

            {/* Doc Preview Strip */}
            <div className="flex gap-3 mb-4">
              {card.docs.map((doc) => (
                <div key={doc} className="flex items-center justify-center bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500 font-medium shadow-sm min-w-[100px]">
                  {doc}
                </div>
              ))}
            </div>

            {/* AI Summary Box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4">
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">AI 분석 요약</div>
              <p className="text-xs text-indigo-900 leading-relaxed">{card.summary}</p>
            </div>

            {/* Request Info */}
            <div className="text-xs text-gray-400 mb-4">요청자: AI 자동화 시스템 · 요청 시각: {card.requestedAt}</div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex gap-4">
                <button className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                  <ExternalLink size={13} /> 문서 검토
                </button>
                <button className="text-xs text-gray-400 font-medium hover:text-gray-600">상세 보기</button>
              </div>
              <div className="flex gap-2">
                <button className="px-5 py-2 border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors">
                  반려
                </button>
                <button className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                  승인
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completed Section (Collapsible) */}
      <button onClick={() => setShowCompleted(!showCompleted)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
        <span>완료된 컨펌 ({completed.length}건)</span>
        {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showCompleted && (
        <div className="border border-gray-200 border-t-0 rounded-b-xl overflow-hidden">
          {completed.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`text-sm ${c.result === '승인됨' ? '✓' : '✕'}`}>{c.result === '승인됨' ? '✅' : '❌'}</span>
                <span className="text-sm text-gray-700 font-medium">{c.title}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${c.resultColor}`}>{c.result}</span>
                <span className="text-xs text-gray-400">{c.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
