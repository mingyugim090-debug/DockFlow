import CheckoutWidget from '@/components/payment/CheckoutWidget';
import Link from 'next/link';

export default function CheckoutPage() {
  return (
    <div className="w-full min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center py-12 px-4 sm:px-6 md:pl-20">
      
      <div className="max-w-2xl w-full bg-white rounded-3xl gs-shadow-lg overflow-hidden border border-gray-100 flex flex-col p-8 md:p-12 mb-10">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">DocFlow AI 결제</h1>
          <p className="text-gray-500 font-medium text-lg">안전하고 간편한 토스페이먼츠로 결제를 진행하세요.</p>
        </div>
        
        {/* Recipt Preview */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-10 border border-gray-200">
           <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 border-dashed">
             <span className="text-gray-500 font-medium text-base">선택한 상품</span>
             <span className="text-gray-900 font-bold text-lg">Pro 플랜 (1개월) + 5,000 보너스</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-gray-500 font-medium text-base">총 결제 금액</span>
             <span className="text-3xl text-indigo-600 font-extrabold tracking-tight">15,000<span className="text-xl ml-1">원</span></span>
           </div>
        </div>

        {/* Toss Payments Widget Injection */}
        <CheckoutWidget amount={15000} orderName="DocFlow AI Pro 플랜 (1개월 세일)" />

      </div>

      <Link href="/" className="text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors hover:underline">
        돌아가기
      </Link>
    </div>
  );
}
