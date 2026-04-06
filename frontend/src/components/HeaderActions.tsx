'use client';

import Link from 'next/link';
import LoginButton from './auth/LoginButton';

export default function HeaderActions() {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
      <Link 
        href="/checkout" 
        className="bg-indigo-600 text-white rounded-full px-5 py-2.5 text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors"
      >
        업그레이드
      </Link>
      <div className="w-[1px] h-6 bg-gray-200"></div>
      <LoginButton />
    </div>
  );
}
