'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Bell, FileText, MoreHorizontal, Play, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  fetchWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from '@/lib/api';
import { WorkflowListItem, WorkflowStep } from '@/lib/types';

function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '—';
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

function successRate(wf: WorkflowListItem): string {
  if (wf.run_count === 0) return '—';
  return `${Math.round((wf.success_count / wf.run_count) * 100)}%`;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  { label: '공고 RSS 수집', type: 'RSS 수집', color: 'bg-blue-100 text-blue-700' },
  { label: 'AI 적합성 분석', type: 'AI 분석', color: 'bg-purple-100 text-purple-700' },
  { label: '지원서 초안 생성', type: '문서 생성', color: 'bg-orange-100 text-orange-700' },
  { label: '컨펌 요청 발송', type: '알림·컨펌', color: 'bg-green-100 text-green-700' },
];

const PURPOSES = [
  { icon: Bell, label: '공고 모니터링', sub: '공모전·정부사업 자동 수집 분석' },
  { icon: FileText, label: '문서 자동 생성', sub: '반복 문서를 자동으로 만들기' },
  { icon: GitBranch, label: '결재·컨펌 자동화', sub: '검토 요청 및 승인 플로우' },
  { icon: GitBranch, label: '정기 보고서', sub: '주/월간 보고서 자동 발행' },
];

const TRIGGERS = [
  { label: '정해진 시간마다', sub: '매일, 매주 등 반복 실행', emoji: '⏰' },
  { label: '특정 조건 감지 시', sub: '새 공고 등록, 키워드 발견 등', emoji: '🔔' },
  { label: '파일 업로드 시', sub: '파일이 업로드되면 즉시 실행', emoji: '📁' },
  { label: '수동 실행', sub: '버튼 클릭 시에만 실행', emoji: '▶' },
];

function statusColor(status: string): string {
  if (status === 'active') return 'bg-amber-100 text-amber-700';
  if (status === 'paused') return 'bg-gray-100 text-gray-500';
  if (status === 'completed') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-500';
}

function statusLabel(status: string): string {
  if (status === 'active') return '진행중';
  if (status === 'paused') return '일시정지';
  if (status === 'completed') return '완료';
  return status;
}

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPurpose, setSelectedPurpose] = useState<number | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<number | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows()
      .then(setWorkflows)
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(wf: WorkflowListItem) {
    try {
      const updated = await updateWorkflow(wf.id, { enabled: !wf.enabled });
      setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? updated : w)));
    } catch {
      // silent — UI already reflects old state
    }
  }

  async function handleDelete(id: string) {
    await deleteWorkflow(id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  async function handleSave() {
    if (!workflowName.trim()) {
      setSaveError('워크플로우 이름을 입력하세요.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const created = await createWorkflow({
        title: workflowName,
        description: workflowDesc || undefined,
        purpose: selectedPurpose !== null ? PURPOSES[selectedPurpose].label : undefined,
        trigger_type: selectedTrigger !== null ? TRIGGERS[selectedTrigger].label : undefined,
        steps: DEFAULT_STEPS,
      });
      setWorkflows((prev) => [created, ...prev]);
      setActiveTab('list');
      setWizardStep(1);
      setWorkflowName('');
      setWorkflowDesc('');
      setSelectedPurpose(null);
      setSelectedTrigger(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">워크플로우</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Beta</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">공고 수집부터 컨펌까지, 반복 문서 업무를 자동화합니다.</p>
        </div>
        <button onClick={() => { setActiveTab('new'); setWizardStep(1); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors shadow-sm">
          <Plus size={16} /> 새 워크플로우
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {(['list', 'new'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-400 hover:text-gray-700'}`}>
            {tab === 'list' ? '내 워크플로우' : '새 워크플로우'}
          </button>
        ))}
      </div>

      {/* Tab A: Workflow List */}
      {activeTab === 'list' && (
        <>
          {loading ? (
            <div className="text-center text-sm text-gray-400 py-16">불러오는 중...</div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <GitBranch size={36} className="text-gray-300" />
              <p className="text-sm font-medium">아직 생성된 워크플로우가 없습니다</p>
              <button onClick={() => setActiveTab('new')}
                className="mt-2 px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors">
                첫 워크플로우 만들기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((wf) => (
                <div key={wf.id} className="gs-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor(wf.status)}`}>
                      {statusLabel(wf.status)}
                    </span>
                    <button
                      onClick={() => handleToggle(wf)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${wf.enabled ? 'bg-indigo-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${wf.enabled ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{wf.title}</h3>
                  {wf.description && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">{wf.description}</p>
                  )}
                  {/* Pipeline preview */}
                  {wf.steps.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-4">
                      {wf.steps.map((step, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${step.color}`}>{step.label}</span>
                          {i < wf.steps.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Stats */}
                  <div className="flex gap-4 border-t border-gray-100 pt-3 mb-3">
                    <span className="text-[11px] text-gray-400">실행 {wf.run_count}회</span>
                    <span className="text-[11px] text-gray-400">성공 {successRate(wf)}</span>
                    <span className="text-[11px] text-gray-400">{formatRelativeTime(wf.last_run_at || wf.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{wf.trigger_type ?? '트리거 미설정'}</span>
                    <div className="flex gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-green-600 transition-colors">
                        <Play size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(wf.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab B: New Workflow Wizard */}
      {activeTab === 'new' && (
        <div>
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {['기본 설정', '단계 구성', '트리거 설정'].map((label, i) => {
              const step = i + 1;
              const isDone = wizardStep > step;
              const isActive = wizardStep === step;
              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isDone ? 'bg-green-500 text-white' : isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? '✓' : step}
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < 2 && <div className={`w-24 h-px mx-3 mb-5 ${wizardStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>

          {/* Step 1: 기본 설정 */}
          {wizardStep === 1 && (
            <div className="max-w-xl mx-auto flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">이름</label>
                <input
                  type="text"
                  placeholder="예: 정부 R&D 공모전 지원서 자동화"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">이 워크플로우의 목적은?</label>
                <div className="grid grid-cols-2 gap-3">
                  {PURPOSES.map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <button key={i} onClick={() => setSelectedPurpose(i)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${selectedPurpose === i ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <Icon size={18} className={selectedPurpose === i ? 'text-indigo-600 shrink-0 mt-0.5' : 'text-gray-400 shrink-0 mt-0.5'} />
                        <div>
                          <div className="text-sm font-bold text-gray-900">{p.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{p.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">설명 (선택)</label>
                <textarea
                  rows={3}
                  placeholder="이 워크플로우가 어떤 일을 하는지 간단히 설명하세요"
                  value={workflowDesc}
                  onChange={(e) => setWorkflowDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all text-gray-900 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button onClick={() => setWizardStep(2)}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors">다음 단계 →</button>
              </div>
            </div>
          )}

          {/* Step 2: 단계 구성 */}
          {wizardStep === 2 && (
            <div className="max-w-xl mx-auto">
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-700">자동화 단계를 구성하세요</p>
                <p className="text-xs text-gray-500 mt-1">+ 버튼으로 단계를 추가합니다.</p>
              </div>
              <div className="flex flex-col gap-2 mb-6">
                {DEFAULT_STEPS.map((step, i) => (
                  <div key={i}>
                    <div className="gs-card p-4 flex items-center gap-3">
                      <span className="text-gray-300 text-lg cursor-grab">⠿</span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${step.color}`}>{i + 1}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{step.label}</div>
                        <div className="text-xs text-gray-400">{step.type}</div>
                      </div>
                      <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal size={16} /></button>
                    </div>
                    {i < DEFAULT_STEPS.length - 1 && (
                      <div className="flex justify-center my-1">
                        <span className="text-gray-300 text-xs">↓</span>
                      </div>
                    )}
                  </div>
                ))}
                <button className="mt-2 w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 font-medium transition-colors flex items-center justify-center gap-2">
                  <Plus size={14} /> 단계 추가
                </button>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setWizardStep(1)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">← 이전</button>
                <button onClick={() => setWizardStep(3)} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors">다음 단계 →</button>
              </div>
            </div>
          )}

          {/* Step 3: 트리거 설정 */}
          {wizardStep === 3 && (
            <div className="max-w-xl mx-auto">
              <p className="text-sm font-bold text-gray-700 mb-4">언제 실행할까요?</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {TRIGGERS.map((t, i) => (
                  <button key={i} onClick={() => setSelectedTrigger(i)}
                    className={`flex flex-col gap-1.5 p-4 rounded-xl border text-left transition-all ${selectedTrigger === i ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <span className="text-xl">{t.emoji}</span>
                    <div className="text-sm font-bold text-gray-900">{t.label}</div>
                    <div className="text-xs text-gray-500">{t.sub}</div>
                  </button>
                ))}
              </div>
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">완료 알림 받기</label>
                <div className="flex gap-2 flex-wrap">
                  {['이메일', '슬랙', '카카오톡'].map((ch) => (
                    <button key={ch} className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">{ch}</button>
                  ))}
                </div>
              </div>
              {saveError && (
                <p className="text-xs text-red-500 mb-3">{saveError}</p>
              )}
              <div className="flex justify-between">
                <button onClick={() => setWizardStep(2)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">← 이전</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-60"
                >
                  {saving ? '저장 중...' : '워크플로우 저장 ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
