'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Plus, 
  Home, 
  Sparkles, 
  GitBranch, 
  Users, 
  FolderOpen, 
  MoreHorizontal,
  Gift
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: '홈', href: '/', icon: Home },
    { name: 'Claw', href: '#', icon: Sparkles },
    { name: '워크플로우', href: '#', icon: GitBranch },
    { name: '팀즈', href: '#', icon: Users },
    { name: '드라이브', href: '/dashboard', icon: FolderOpen },
    { name: '더보기', href: '#', icon: MoreHorizontal },
  ];

  return (
    <>
      <aside className="hidden md:flex w-20 h-screen fixed left-0 top-0 bg-white border-r border-gray-100 flex-col items-center py-4 z-50">
        {/* Top action */}
        <button className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors mb-6 text-gray-700">
          <Sparkles size={24} className="text-gray-900" />
        </button>

        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex flex-col items-center gap-1 group cursor-pointer text-gray-500 hover:text-gray-900">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              <Plus size={24} className="opacity-80" />
            </div>
            <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">New</span>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex flex-col gap-3 w-full px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="group flex flex-col items-center gap-1 w-full relative"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] whitespace-nowrap font-bold ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Bottom Nav */}
        <div className="flex flex-col gap-4 items-center">
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors">
            <Gift size={20} />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex items-center justify-around py-3 z-50 gs-shadow">
        {[navItems[0], navItems[4], { name: '새 문서', href: '/dashboard/templates', icon: Plus }, navItems[3], navItems[5]].map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-indigo-50' : 'bg-transparent'}`}>
                 <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
