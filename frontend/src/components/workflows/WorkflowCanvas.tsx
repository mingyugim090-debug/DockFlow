'use client';

import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './CustomNodes';

const initialNodes: Node[] = [
  { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { label: '공고 RSS 수집', sub: '특정 키워드 모니터링' } },
  { id: '2', type: 'ai_action', position: { x: 350, y: 150 }, data: { label: 'AI 적합성 분석', sub: '지원 요건과 비교' } },
  { id: '3', type: 'document', position: { x: 650, y: 150 }, data: { label: '지원서 초안 생성', sub: '워드/슬라이드 자동 생성' } },
  { id: '4', type: 'notification', position: { x: 950, y: 150 }, data: { label: '컨펌 요청 발송', sub: '슬랙 알림 전송' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
];

export default function WorkflowCanvas({ 
  onSave, 
  onCancel 
}: { 
  onSave: (nodes: Node[], edges: Edge[], name: string, desc: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [workflowName, setWorkflowName] = useState('정부 R&D 지원 자동화');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [saving, setSaving] = useState(false);
  
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds)),
    []
  );

  const handleSave = async () => {
    setSaving(true);
    await onSave(nodes, edges, workflowName, workflowDesc);
    setSaving(false);
  };

  return (
    <div className="flex flex-col w-full bg-slate-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm relative h-[700px]">
      {/* Top Header inside canvas area */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-5 py-3 flex justify-between items-center shadow-sm">
        <div className="flex gap-4 items-center flex-1">
           <input 
             className="text-lg font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors w-full max-w-[400px]"
             value={workflowName}
             onChange={(e) => setWorkflowName(e.target.value)}
             placeholder="워크플로우 이름"
           />
        </div>
        <div className="flex gap-2">
           <button onClick={onCancel} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">취소</button>
           <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
             {saving ? '저장 중...' : '퍼블리시 (Save)'}
           </button>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="mt-14" // Push flow down by header height
      >
        <Background gap={16} />
        <Controls />
        <Panel position="top-left" className="mt-4 ml-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-md border border-gray-200 flex flex-col gap-2 w-48">
          <div className="text-xs font-bold text-gray-500 mb-1">컴포넌트 패널</div>
          <div className="text-xs p-2.5 bg-indigo-50 text-indigo-700 rounded-lg cursor-grab border border-indigo-100 hover:bg-indigo-100 font-semibold shadow-sm transition-colors" draggable>+ Trigger (시작점)</div>
          <div className="text-xs p-2.5 bg-purple-50 text-purple-700 rounded-lg cursor-grab border border-purple-100 hover:bg-purple-100 font-semibold shadow-sm transition-colors" draggable>+ AI Action (분석/추출)</div>
          <div className="text-xs p-2.5 bg-emerald-50 text-emerald-700 rounded-lg cursor-grab border border-emerald-100 hover:bg-emerald-100 font-semibold shadow-sm transition-colors" draggable>+ Document (문서 생성)</div>
          <div className="text-xs p-2.5 bg-amber-50 text-amber-700 rounded-lg cursor-grab border border-amber-100 hover:bg-amber-100 font-semibold shadow-sm transition-colors" draggable>+ Notification (알림)</div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
