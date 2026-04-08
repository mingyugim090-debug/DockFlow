'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  GitBranch,
  FileInput,
  FileText,
  CheckCircle,
  Clock,
  ChevronRight,
  Download,
  MoreHorizontal,
  Presentation,
} from 'lucide-react';
import GenerateModal from '@/components/slides/GenerateModal';
import { fetchDocuments, getDownloadUrl, getFormatBadgeColor, getFormatLabel } from '@/lib/api';
import { DocumentListItem } from '@/lib/types';

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day === 1) return '어제';
  return `${day}일 전`;
}

export default function Home() {
  const { data: session } = useSession();
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [recentDocs, setRecentDocs] = useState<DocumentListItem[]>([]);
  const [docCount, setDocCount] = useState<number | null>(null);

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  useEffect(() => {
    fetchDocuments(50).then((docs) => {
      setDocCount(docs.length);
      setRecentDocs(docs.slice(0, 3));
    });
  }, []);

  const stats = [
    { icon: FileText, label: '생성 문서', value: docCount !== null ? `${docCount}개` : '—', change: '', positive: true },
    { icon: GitBranch, label: '활성 워크플로우', value: '준비 중', change: '', positive: true },
    { icon: CheckCircle, label: '완료 작업', value: '준비 중', change: '', positive: true },
    { icon: Clock, label: '평균 생성시간', value: '준비 중', change: '', positive: true },
  ];

  const workflows = [
    { name: '정부 R&D 공고 모니터링', meta: '5분 전 실행 · 자동', status: '진행중', statusColor: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400 animate-pulse' },
    { name: '중기부 공모전 지원서 자동 작성', meta: '2시간 전 · 수동', status: '검토중', statusColor: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
    { name: '주간 매출 보고서 자동 생성', meta: '오늘 09:00', status: '완료', statusColor: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto relative">
      {showSlideModal && <GenerateModal onClose={() => setShowSlideModal(false)} />}
      
      {/* Welcome Section */}
      <div className="mb-8">
        {session?.user ? (
          <div className="flex items-center gap-3 mb-2">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || '프로필'}
                width={44}
                height={44}
                className="rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                {session.user.name?.[0] ?? 'U'}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                안녕하세요, {session.user.name ?? '사용자'}님 👋
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">{session.user.email}</p>
            </div>
          </div>
        ) : (
          <h2 className="text-2xl font-bold text-gray-900 mb-2">안녕하세요 👋</h2>
        )}
        <p className="text-gray-500 mt-1 text-sm">오늘도 문서 업무를 AI에게 맡겨보세요.</p>
        <p className="text-gray-400 text-xs mt-0.5">{today}</p>
      </div>

      {/* Quick Action Cards */}
      <section className="mb-10">
        <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3">빠른 시작</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowSlideModal(true)}
            className="group text-left p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '1px solid #c7d2fe', borderRadius: 14 }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mt-4 -mr-4"></div>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Presentation size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">AI 프레젠테이션</h3>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">아이디어 한 줄로 반응형 덱 생성 및 비주얼 편집기 동작</p>
            </div>
            <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all mt-1">에디터 열기 <ChevronRight size={14} /></span>
          </button>

          <Link href="/convert" className="group gs-card p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileInput size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">파일 → 문서 변환</h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">사진, 엑셀, 메모 등 어떤 파일이든 PPT·Word·PDF로</p>
            </div>
            <span className="text-blue-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">변환 시작 <ChevronRight size={14} /></span>
          </Link>
          
          <Link href="/workflows" className="group gs-card p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <GitBranch size={20} className="text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">자동화 워크플로우</h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">공고 모니터링부터 문서 생성, 컨펌까지 묶음 자동화</p>
            </div>
            <span className="text-slate-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">시작하기 <ChevronRight size={14} /></span>
          </Link>
        </div>
      </section>

      {/* Stats Row */}
      <section className="mb-10">
        <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3">이번 달 현황</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="gs-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className={`text-xs mt-1 font-medium ${stat.positive ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.change} 지난달 대비
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Workflows */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">진행중인 워크플로우</div>
          <Link href="/workflows" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">전체보기 <ChevronRight size={12} /></Link>
        </div>
        <div className="flex flex-col gap-2">
          {workflows.map((wf) => (
            <div key={wf.name} className="gs-card p-4 flex items-center gap-4 hover:shadow-sm transition-all cursor-pointer">
              <span className={`w-2 h-2 rounded-full shrink-0 ${wf.dot}`} />
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <GitBranch size={16} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm truncate">{wf.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{wf.meta}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${wf.statusColor}`}>{wf.status}</span>
              <button className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                <MoreHorizontal size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Documents */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">최근 생성 문서</div>
          <Link href="/documents" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">전체보기 <ChevronRight size={12} /></Link>
        </div>
        {recentDocs.length === 0 ? (
          <div className="gs-card p-8 flex flex-col items-center justify-center gap-2 text-gray-400">
            <FileText size={28} className="text-gray-300" />
            <p className="text-sm font-medium">아직 생성된 문서가 없습니다</p>
            <p className="text-xs">위 버튼으로 첫 번째 문서를 만들어보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="gs-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className="flex justify-between items-center mb-3">
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-bold text-white"
                    style={{ backgroundColor: getFormatBadgeColor(doc.format) }}
                  >
                    {getFormatLabel(doc.format)}
                  </span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(doc.created_at)}</span>
                </div>
                <div className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 mb-3">{doc.filename}</div>
                <a
                  href={getDownloadUrl(doc.file_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
                >
                  <Download size={13} /> 다운로드
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
