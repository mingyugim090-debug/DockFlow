'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Loader2, ExternalLink, X, ChevronRight } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  org: string;
  category: string;
  summary: string;
  deadline: string | null;
  fund: string;
  keywords: string[];
  score: number;
  source_url: string;
  raw_content: string;
  is_new: boolean;
  status: string;
  created_at: string;
}

interface Stats {
  total: number;
  new_today: number;
  high_score: number;
  deadline_soon: number;
}

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

function getDDay(deadline: string | null): { text: string; color: string } {
  if (!deadline) return { text: '-', color: 'text-gray-400 bg-gray-100' };
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: '마감', color: 'text-gray-400 bg-gray-100' };
  if (diff <= 7) return { text: `D-${diff}`, color: 'text-red-500 bg-red-50' };
  if (diff <= 30) return { text: `D-${diff}`, color: 'text-amber-600 bg-amber-50' };
  return { text: `D-${diff}`, color: 'text-gray-500 bg-gray-100' };
}

const CATEGORY_COLORS: Record<string, string> = {
  'R&D': 'bg-blue-100 text-blue-700',
  '창업지원': 'bg-purple-100 text-purple-700',
  '수출지원': 'bg-green-100 text-green-700',
  '제조혁신': 'bg-orange-100 text-orange-700',
  '금융지원': 'bg-cyan-100 text-cyan-700',
};

// ── 공고 상세 모달 ──
function DetailModal({ ann, onClose, onRequestApproval }: {
  ann: Announcement;
  onClose: () => void;
  onRequestApproval: (id: string) => void;
}) {
  const dDay = getDDay(ann.deadline);
  const catColor = CATEGORY_COLORS[ann.category] || 'bg-gray-100 text-gray-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColor}`}>{ann.category || '기타'}</span>
              <span className="text-xs text-gray-400">{ann.org}</span>
              {ann.is_new && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">NEW</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{ann.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 주요 정보 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-[11px] text-gray-400 mb-1">마감일</div>
              <div className="text-sm font-bold text-gray-800">{ann.deadline || '-'}</div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${dDay.color}`}>{dDay.text}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-[11px] text-gray-400 mb-1">지원금</div>
              <div className="text-sm font-bold text-gray-800">{ann.fund || '-'}</div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3">
              <div className="text-[11px] text-indigo-400 mb-1">AI 적합도</div>
              <div className="text-2xl font-extrabold text-indigo-600">
                {ann.score}<span className="text-sm font-normal ml-0.5">점</span>
              </div>
            </div>
          </div>

          {/* AI 요약 */}
          {ann.summary && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">AI 요약</div>
              <p className="text-sm text-gray-600 leading-relaxed bg-indigo-50/50 rounded-xl p-3">{ann.summary}</p>
            </div>
          )}

          {/* 키워드 */}
          {ann.keywords && ann.keywords.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">키워드</div>
              <div className="flex gap-1.5 flex-wrap">
                {ann.keywords.map((kw) => (
                  <span key={kw} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* 공고 원문 */}
          {ann.raw_content && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">공고 원문</div>
              <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {ann.raw_content}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          {ann.source_url && (
            <a
              href={ann.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ExternalLink size={14} />
              원문 보기
            </a>
          )}
          <button
            onClick={() => { onRequestApproval(ann.id); onClose(); }}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <ChevronRight size={15} />
            지원서 자동 생성 요청
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new_today: 0, high_score: 0, deadline_soon: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [annRes, statsRes] = await Promise.all([
        fetch('/api/announcements'),
        fetch('/api/announcements/stats'),
      ]);
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCollect = async () => {
    setCollecting(true);
    try {
      const res = await fetch('/api/announcements/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 30 }),
      });
      if (res.ok) {
        // 5초 후 새로고침 (수집 완료 대기)
        setTimeout(() => { fetchData(); setCollecting(false); }, 5000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || '수집 실패');
        setCollecting(false);
      }
    } catch {
      alert('수집 요청 실패 — 네트워크 오류');
      setCollecting(false);
    }
  };

  const handleRequestApproval = async (id: string) => {
    setRequestingId(id);
    try {
      const res = await fetch(`/api/announcements/${id}/request-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        alert('지원서 작성 요청이 생성되었습니다. 결재함에서 승인해주세요.');
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || '요청 실패');
      }
    } catch {
      alert('요청 실패');
    } finally {
      setRequestingId(null);
    }
  };

  const filtered = announcements.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.org.includes(search)
  );

  const statItems = [
    { label: '전체 공고', value: `${stats.total}건`, color: 'text-gray-700' },
    { label: '오늘 수집', value: `${stats.new_today}건`, color: 'text-gray-700' },
    { label: '높은 적합도', value: `${stats.high_score}건`, color: 'text-indigo-600', ring: 'ring-indigo-200 bg-indigo-50' },
    { label: '마감 임박', value: `${stats.deadline_soon}건`, color: 'text-amber-600', ring: 'ring-amber-200 bg-amber-50' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* 상세 모달 */}
      {selectedAnn && (
        <DetailModal
          ann={selectedAnn}
          onClose={() => setSelectedAnn(null)}
          onRequestApproval={handleRequestApproval}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공고 모니터링</h1>
          <p className="text-gray-500 text-sm mt-1">AI가 공모전·정부사업 공고를 자동 수집하고 적합성을 분석합니다.</p>
        </div>
        <button
          onClick={handleCollect}
          disabled={collecting}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors shadow-sm disabled:bg-gray-400"
        >
          {collecting ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {collecting ? '수집 중...' : '공고 수집'}
        </button>
      </div>

      {/* Stats Strip */}
      <div className="flex gap-3 flex-wrap mb-6">
        {statItems.map((s) => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold bg-white ring-2 ring-transparent ${s.ring || ''}`}>
            <span className="text-xs text-gray-500">{s.label}:</span>
            <span className={s.color}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="공고명, 기관 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full pl-9 pr-4 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm">공고 데이터를 불러오는 중...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <div className="text-5xl">📋</div>
          <p className="text-sm font-medium">수집된 공고가 없습니다.</p>
          <p className="text-xs">"공고 수집" 버튼을 눌러 기업마당에서 최신 공고를 가져오세요.</p>
        </div>
      )}

      {/* Announcement Cards */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {filtered.map((a) => {
            const dDay = getDDay(a.deadline);
            const catColor = CATEGORY_COLORS[a.category] || 'bg-gray-100 text-gray-600';
            return (
              <div
                key={a.id}
                className={`gs-card p-5 hover:shadow-md transition-all duration-200 cursor-pointer ${a.score >= 80 ? 'border-l-4 border-l-indigo-500' : ''}`}
                onClick={() => setSelectedAnn(a)}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-5">
                  {/* Left */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColor}`}>{a.category || '기타'}</span>
                      <span className="text-xs text-gray-400">{a.org}</span>
                      {a.is_new && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 animate-pulse">NEW</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug mb-2">{a.title}</h3>
                    {a.summary && (
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 shrink-0">AI 요약</span>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{a.summary}</p>
                      </div>
                    )}
                    <div className="flex gap-5 text-xs text-gray-400 mb-3">
                      <span>마감: {a.deadline || '-'}</span>
                      {a.fund && <span>지원금: {a.fund}</span>}
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${dDay.color}`}>{dDay.text}</span>
                    </div>
                    {a.keywords && a.keywords.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {a.keywords.map((kw) => (
                          <span key={kw} className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Right — 클릭 이벤트 버블링 차단 */}
                  <div
                    className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ScoreBar score={a.score} />
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={() => handleRequestApproval(a.id)}
                        disabled={requestingId === a.id}
                        className="w-full px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:bg-indigo-300"
                      >
                        {requestingId === a.id ? '요청 중...' : '지원서 자동 생성'}
                      </button>
                      {a.source_url && (
                        <a
                          href={a.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-center"
                        >
                          원문 보기
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
