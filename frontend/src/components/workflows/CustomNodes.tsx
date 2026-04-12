import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play, Sparkles, FileText, Bell } from 'lucide-react';

export function TriggerNode({ data }: NodeProps) {
  const label = (data.label as string) || '';
  const sub = data.sub as string | undefined;
  return (
    <div className="bg-white border-2 border-indigo-500 rounded-xl shadow-md min-w-[220px] overflow-hidden">
      <div className="bg-indigo-50 px-3 py-2 flex items-center gap-2 border-b border-indigo-100">
        <Play size={16} className="text-indigo-600" />
        <span className="text-xs font-bold text-indigo-700">TRIGGER</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900">{label}</div>
        {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
    </div>
  );
}

export function AIActionNode({ data }: NodeProps) {
  const label = (data.label as string) || '';
  const sub = data.sub as string | undefined;
  return (
    <div className="bg-white border-2 border-purple-400 rounded-xl shadow-md min-w-[220px] overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-400 border-2 border-white" />
      <div className="bg-purple-50 px-3 py-2 flex items-center gap-2 border-b border-purple-100">
        <Sparkles size={16} className="text-purple-600" />
        <span className="text-xs font-bold text-purple-700">AI AGENT</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900">{label}</div>
        {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-400 border-2 border-white" />
    </div>
  );
}

export function DocumentNode({ data }: NodeProps) {
  const label = (data.label as string) || '';
  const sub = data.sub as string | undefined;
  return (
    <div className="bg-white border-2 border-emerald-500 rounded-xl shadow-md min-w-[220px] overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
      <div className="bg-emerald-50 px-3 py-2 flex items-center gap-2 border-b border-emerald-100">
        <FileText size={16} className="text-emerald-700" />
        <span className="text-xs font-bold text-emerald-800">GENERATE</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900">{label}</div>
        {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
    </div>
  );
}

export function NotificationNode({ data }: NodeProps) {
  const label = (data.label as string) || '';
  return (
    <div className="bg-white border-2 border-amber-400 rounded-xl shadow-md min-w-[220px] overflow-hidden">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-400 border-2 border-white" />
      <div className="bg-amber-50 px-3 py-2 flex items-center gap-2 border-b border-amber-100">
        <Bell size={16} className="text-amber-600" />
        <span className="text-xs font-bold text-amber-700">NOTIFY</span>
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900">{label}</div>
      </div>
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  ai_action: AIActionNode,
  document: DocumentNode,
  notification: NotificationNode,
};
