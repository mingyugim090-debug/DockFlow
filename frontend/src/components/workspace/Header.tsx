'use client';

import { usePathname } from 'next/navigation';
import LoginButton from '../auth/LoginButton';
import { Search, Bell } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const pathname = usePathname();

  // Simple mapping for current page title
  const getPageTitle = () => {
    switch (pathname) {
      case '/': return '홈 대시보드';
      case '/documents': return '내 문서';
      case '/workflows': return '워크플로우';
      case '/announcements': return '공고 모니터링';
      case '/schedule': return '스케줄';
      case '/convert': return '파일 변환';
      case '/templates': return '템플릿';
      case '/approvals': return '결재함';
      case '/checkout': return '결제';
      default: return 'DocFlow AI';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-[60px] bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 md:px-8">
      {/* Left Area: Breadcrumbs / Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="검색..." 
            className="w-48 lg:w-64 h-9 bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Upgrade Button */}
        <Link 
          href="/checkout"
          className="hidden md:flex px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-full text-sm transition-colors"
        >
          업그레이드
        </Link>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={20} />
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Profile / Auth */}
        <div className="scale-90 origin-right">
            <LoginButton />
        </div>
      </div>
    </header>
  );
}
