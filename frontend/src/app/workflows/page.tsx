'use client';

import { useState, useEffect } from 'react';
import { GitBranch, MoreHorizontal, Play, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  fetchWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from '@/lib/api';
import { WorkflowListItem } from '@/lib/types';
import WorkflowCanvas from '@/components/workflows/WorkflowCanvas';
import { Node, Edge } from '@xyflow/react';

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
    if (!confirm('워크플로우를 삭제하시겠습니까?')) return;
    await deleteWorkflow(id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  async function handleSaveCanvas(nodes: Node[], edges: Edge[], name: string, desc: string) {
    try {
      // Map React Flow nodes back to Backend steps structure
      const steps = nodes.map(n => {
        let color = 'bg-gray-100 text-gray-700';
        if (n.type === 'trigger') color = 'bg-indigo-100 text-indigo-700';
        else if (n.type === 'ai_action') color = 'bg-purple-100 text-purple-700';
        else if (n.type === 'document') color = 'bg-emerald-100 text-emerald-700';
        else if (n.type === 'notification') color = 'bg-amber-100 text-amber-700';
        
        return {
          label: (n.data?.label as string) || n.type || '',
          type: (n.data?.sub as string) || 'Action',
          color: color
        };
      });

      const triggerNode = nodes.find(n => n.type === 'trigger');

      const created = await createWorkflow({
        title: name,
        description: desc || undefined,
        trigger_type: triggerNode ? triggerNode.data.label as string : undefined,
        steps: steps,
      });
      setWorkflows((prev) => [created, ...prev]);
      setActiveTab('list');
    } catch (e) {
      alert(e instanceof Error ? e.message : '저장에 실패했습니다.');
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">워크플로우</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Beta</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">공고 수집부터 컨펌까지, 반복 문서 업무를 자동화합니다.</p>
        </div>
        <button onClick={() => setActiveTab('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors shadow-sm">
          <Plus size={16} /> 새 워크플로우
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 shrink-0">
        {(['list', 'new'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-400 hover:text-gray-700'}`}>
            {tab === 'list' ? '내 워크플로우' : '새 워크플로우 (Canvas)'}
          </button>
        ))}
      </div>

      {/* Tab A: Workflow List */}
      {activeTab === 'list' && (
        <div className="flex-1 overflow-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <div key={wf.id} className="gs-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-full bg-white">
                  <div>
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
                  </div>
                  {/* Footer Stats & Actions */}
                  <div>
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
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab B: Canvas-based Workflow Builder */}
      {activeTab === 'new' && (
        <div className="flex-1 w-full relative">
          <WorkflowCanvas 
            onSave={handleSaveCanvas} 
            onCancel={() => setActiveTab('list')} 
          />
        </div>
      )}
    </div>
  );
}
