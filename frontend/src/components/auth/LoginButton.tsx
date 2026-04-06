'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-100 animate-pulse flex items-center justify-center" />
    );
  }

  if (session && session.user) {
    return (
      <button 
        onClick={() => signOut()}
        className="group relative w-12 h-12 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center hover:ring-2 hover:ring-indigo-400 overflow-hidden transition-all"
        title="로그아웃"
      >
        {session.user.image ? (
          <Image 
            src={session.user.image} 
            alt={session.user.name || "사용자 프로필"} 
            width={48} 
            height={48} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-gray-700">
            {session.user.name ? session.user.name[0] : 'U'}
          </span>
        )}
        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-[10px] font-bold">
          로그아웃
        </div>
      </button>
    );
  }

  return (
    <button 
      onClick={() => signIn('kakao')}
      className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-[#FEE500] hover:bg-[#FEE500]/80 flex items-center justify-center transition-colors group relative"
      title="카카오 로그인"
    >
      <svg 
        viewBox="0 0 24 24" 
        className="w-6 h-6 text-[#000000]"
        fill="currentColor"
      >
        <path d="M12 3C6.477 3 2 6.545 2 10.92c0 2.808 1.83 5.253 4.606 6.536l-1.002 3.652c-.066.244.205.429.412.302l4.234-2.846c.563.084 1.147.128 1.75.128 5.523 0 10-3.545 10-7.92S17.523 3 12 3z"/>
      </svg>
      <div className="absolute left-14 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        카카오로 시작하기
      </div>
    </button>
  );
}
