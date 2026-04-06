'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function CheckoutFailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const code = searchParams.get('code');

  return (
    <div className="w-full min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center py-12 px-4 sm:px-6 md:pl-20">
      <div className="max-w-md w-full bg-white rounded-3xl gs-shadow-lg p-10 text-center border border-gray-100 flex flex-col items-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">결제 실패</h1>
        <p className="text-gray-500 mb-8 font-medium">{message || "결제 진행 중 오류가 발생했습니다."}</p>

        {code && (
          <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm font-mono mb-8 w-full border border-red-100">
            Error Code: {code}
          </div>
        )}

        <div className="flex w-full gap-3">
          <Link href="/checkout" className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-xl py-3 font-bold hover:bg-gray-50 transition-colors">
            다시 시도
          </Link>
          <Link href="/" className="flex-1 bg-gray-900 text-white rounded-xl py-3 font-bold hover:bg-black transition-colors">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩중...</div>}>
      <CheckoutFailContent />
    </Suspense>
  );
}
