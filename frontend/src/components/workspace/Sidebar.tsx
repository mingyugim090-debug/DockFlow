'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Plus, 
  Home, 
  Settings,
  HelpCircle,
  FolderOpen,
  GitBranch,
  Bell,
  Calendar,
  FileInput,
  LayoutTemplate,
  CheckSquare
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    {
      group: null,
      items: [
        { name: '홈 대시보드', href: '/', icon: Home },
        { name: '내 문서', href: '/documents', icon: FolderOpen },
      ]
    },
    {
      group: '자동화',
      items: [
        { name: '워크플로우', href: '/workflows', icon: GitBranch },
        { name: '공고 모니터링', href: '/announcements', icon: Bell },
        { name: '결재함', href: '/approvals', icon: CheckSquare },
        { name: '스케줄', href: '/schedule', icon: Calendar },
      ]
    },
    {
      group: '변환 도구',
      items: [
        { name: '파일 변환', href: '/convert', icon: FileInput },
        { name: '템플릿', href: '/templates', icon: LayoutTemplate },
      ]
    }
  ];

  return (
    <>
      <aside className="hidden md:flex w-[240px] h-screen fixed left-0 top-0 bg-white border-r border-gray-200 flex-col py-4 z-50 overflow-y-auto">
        {/* LOGO AREA */}
        <div className="px-5 mb-6 flex flex-col">
          <Link href="/" className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                D
              </div>
              <span className="font-bold text-gray-900 tracking-tight text-lg">DocFlow AI</span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium tracking-wide">올인원 워크스페이스</span>
          </Link>
        </div>

        {/* NEW BUTTON */}
        <div className="px-4 mb-4">
          <button className="w-full h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center gap-2 px-4 hover:bg-black transition-colors shadow-sm font-medium text-sm">
            <Plus size={16} />
            새 작업 시작
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 flex flex-col gap-6 px-3 mt-4">
          {navigation.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              {section.group && (
                <div className="px-3 mb-2 text-xs font-bold text-gray-400 tracking-wider">
                  {section.group}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors group ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 font-semibold' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
                    <span className="text-[13px]">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* BOTTOM AREA */}
        <div className="mt-auto px-3 border-t border-gray-100 pt-4 flex flex-col gap-1">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium group transition-colors">
            <HelpCircle size={18} className="text-gray-400 group-hover:text-gray-600" />
            <span className="text-[13px]">도움말</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium group transition-colors">
            <Settings size={18} className="text-gray-400 group-hover:text-gray-600" />
            <span className="text-[13px]">설정</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION (Simplified for Workspace) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex items-center justify-around py-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {[navigation[0].items[0], navigation[1].items[0], navigation[2].items[0]].map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                 <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
