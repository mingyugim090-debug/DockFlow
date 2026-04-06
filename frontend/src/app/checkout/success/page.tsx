'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  return (
    <div className="w-full min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center py-12 px-4 sm:px-6 md:pl-20">
      <div className="max-w-md w-full bg-white rounded-3xl gs-shadow-lg p-10 text-center border border-gray-100 flex flex-col items-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">결제가 완료되었습니다</h1>
        <p className="text-gray-500 mb-8">이제 DocFlow AI의 모든 프리미엄 기능을 사용할 수 있습니다.</p>

        <div className="bg-gray-50 rounded-xl p-6 w-full text-left mb-8 border border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">결제 금액</span>
            <span className="font-bold text-gray-900">{Number(amount).toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">주문 번호</span>
            <span className="font-medium text-gray-700">{orderId}</span>
          </div>
        </div>

        <Link href="/" className="w-full bg-gray-900 text-white rounded-xl py-3 font-bold hover:bg-black transition-colors">
          워크스페이스로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩중...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
