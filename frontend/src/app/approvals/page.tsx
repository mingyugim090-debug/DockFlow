'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ExternalLink, Loader2, Download, CheckCircle2, Bell } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  org: string;
  fund: string;
  score: number;
  deadline: string | null;
  source_url: string;
}

interface Approval {
  id: string;
  announcement_id: string;
  status: string;
  analysis_summary: string;
  analysis_file_url: string;
  generated_file_url: string;
  created_at: string;
  reviewed_at: string | null;
  announcements: Announcement;
}

type TabType = '전체' | 'pending' | 'processing' | 'completed' | 'rejected';

const TAB_LABELS: Record<TabType, string> = {
  '전체': '전체',
  pending: '검토 대기',
  processing: '처리 중',
  completed: '완료',
  rejected: '반려',
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: '검토 대기', color: 'text-amber-700 bg-amber-100' },
  processing: { label: '처리 중', color: 'text-blue-700 bg-blue-100' },
  completed: { label: '완료', color: 'text-green-700 bg-green-100' },
  partial: { label: '부분 완료', color: 'text-yellow-700 bg-yellow-100' },
  rejected: { label: '반려', color: 'text-red-700 bg-red-100' },
  failed: { label: '실패', color: 'text-red-700 bg-red-100' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

// ── 토스트 알림 ──
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4">
      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white text-xs">✕</button>
    </div>
  );
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('전체');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 폴링 감지: processing 상태가 완료로 전환됐는지 추적
  const prevStatusMap = useRef<Map<string, string>>(new Map());
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchApprovals = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        const newApprovals: Approval[] = data.approvals || [];

        // processing → completed 전환 감지 → 토스트
        newApprovals.forEach((a) => {
          const prev = prevStatusMap.current.get(a.id);
          if (prev === 'processing' && (a.status === 'completed' || a.status === 'partial')) {
            setToast(`✅ "${a.announcements?.title?.slice(0, 30) || '공고'}" 지원서 생성 완료!`);
          }
          prevStatusMap.current.set(a.id, a.status);
        });

        setApprovals(newApprovals);
      }
    } catch (e) {
      console.error('Fetch approvals failed:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // 최초 로드
  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  // processing 항목이 있으면 5초마다 자동 폴링
  useEffect(() => {
    const hasProcessing = approvals.some((a) => a.status === 'processing');

    if (hasProcessing && !pollTimer.current) {
      pollTimer.current = setInterval(() => fetchApprovals(true), 5000);
    } else if (!hasProcessing && pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }

    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [approvals, fetchApprovals]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, { method: 'PATCH' });
      if (res.ok) {
        setToast('승인되었습니다. AI가 분석 및 지원서 생성을 시작합니다.');
        fetchApprovals();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || '승인 실패');
      }
    } catch { alert('승인 요청 실패'); }
    finally { setActionId(null); }
  };

  const handleReject = async (id: string) => {
    if (!confirm('정말 반려하시겠습니까?')) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/approvals/${id}/reject`, { method: 'PATCH' });
      if (res.ok) { fetchApprovals(); }
      else { const err = await res.json().catch(() => ({})); alert(err.detail || '반려 실패'); }
    } catch { alert('반려 요청 실패'); }
    finally { setActionId(null); }
  };

  const tabs: TabType[] = ['전체', 'pending', 'processing', 'completed', 'rejected'];

  const filtered = approvals.filter(a =>
    activeTab === '전체' ? true : a.status === activeTab
  );

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const processingCount = approvals.filter(a => a.status === 'processing').length;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* 토스트 알림 */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">결재함</h1>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                <Bell size={11} />
                {pendingCount}건 대기
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">AI가 생성한 문서 초안을 검토하고 승인하세요.</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-400" />대기중 {pendingCount}건
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />처리중 {processingCount}건
          {processingCount > 0 && <span className="text-[10px] text-blue-400">(자동 갱신 중)</span>}
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-400" />완료 {approvals.filter(a => a.status === 'completed' || a.status === 'partial').length}건
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm">승인 요청을 불러오는 중...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <div className="text-5xl">📝</div>
          <p className="text-sm font-medium">승인 요청이 없습니다.</p>
          <p className="text-xs">공고 모니터링 페이지에서 "지원서 자동 생성"을 클릭해보세요.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {filtered.map((approval) => {
            const ann = approval.announcements;
            const badge = STATUS_BADGE[approval.status] || STATUS_BADGE.pending;
            const isProcessing = approval.status === 'processing';
            const isPending = approval.status === 'pending';
            const isComplete = approval.status === 'completed' || approval.status === 'partial';
            const isBusy = actionId === approval.id;

            return (
              <div key={approval.id}
                className={`rounded-2xl border p-5 transition-all shadow-sm ${
                  isPending ? 'border-l-4 border-l-amber-400 border-amber-100 bg-amber-50/30'
                    : isProcessing ? 'border-l-4 border-l-blue-400 border-blue-100 bg-blue-50/30'
                    : isComplete ? 'border-l-4 border-l-green-400 border-gray-200 bg-white'
                    : 'border-gray-200 bg-white'
                }`}>

                {/* Top Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                    {isProcessing && <Loader2 size={14} className="animate-spin text-blue-500" />}
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(approval.created_at)}</span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-1.5">{ann?.title || '공고 정보 없음'}</h3>

                {/* Meta */}
                <div className="flex gap-5 text-xs text-gray-400 mb-4">
                  <span>기관: {ann?.org || '-'}</span>
                  {ann?.fund && <span>사업비: {ann.fund}</span>}
                  {ann?.score && <span>AI 적합도: <b className="text-indigo-600">{ann.score}점</b></span>}
                  {ann?.deadline && <span>마감: {ann.deadline}</span>}
                </div>

                {/* AI Analysis Summary */}
                {approval.analysis_summary && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4">
                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">AI 분석 요약</div>
                    <p className="text-xs text-indigo-900 leading-relaxed whitespace-pre-wrap">
                      {approval.analysis_summary.slice(0, 500)}
                      {approval.analysis_summary.length > 500 && '...'}
                    </p>
                  </div>
                )}

                {/* Processing indicator */}
                {isProcessing && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span className="text-xs text-blue-700 font-medium">AI가 공고를 분석하고 지원서를 작성 중입니다... (완료 시 자동 알림)</span>
                  </div>
                )}

                {/* Download Buttons (completed) */}
                {isComplete && (
                  <div className="flex gap-3 mb-4">
                    {approval.generated_file_url ? (
                      <a
                        href={approval.generated_file_url}
                        download
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Download size={14} /> 지원서 다운로드
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 text-xs rounded-lg">
                        지원서 파일 없음
                      </span>
                    )}
                    {approval.analysis_file_url && (
                      <a
                        href={approval.analysis_file_url}
                        download
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download size={14} /> 분석 보고서
                      </a>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex gap-4">
                    {ann?.source_url && (
                      <a href={ann.source_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                        <ExternalLink size={13} /> 공고 원문
                      </a>
                    )}
                  </div>
                  {isPending && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(approval.id)}
                        disabled={isBusy}
                        className="px-5 py-2 border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        반려
                      </button>
                      <button
                        onClick={() => handleApprove(approval.id)}
                        disabled={isBusy}
                        className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isBusy ? '처리 중...' : '승인'}
                      </button>
                    </div>
                  )}
                  {isComplete && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-bold">완료</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
