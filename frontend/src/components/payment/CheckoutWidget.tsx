'use client';

import { useEffect, useRef, useState } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { useSession } from 'next-auth/react';

// For test purposes, using Toss's default test client key
const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

export default function CheckoutWidget({ 
  amount = 15000, 
  orderName = 'DocFlow AI Pro 플랜' 
}: { 
  amount?: number, 
  orderName?: string 
}) {
  const [paymentWidget, setPaymentWidget] = useState<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance['renderPaymentMethods']> | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    (async () => {
      // Use logged in user's email as customer key, or default if logged out (not recommended for production but fine for demo)
      const customerKey = session?.user?.email?.replace(/[^a-zA-Z0-9]/g, '') || `customer_${Math.random().toString(36).substring(2, 10)}`;
      
      const widget = await loadPaymentWidget(clientKey, customerKey);
      setPaymentWidget(widget);
    })();
  }, [session]);

  useEffect(() => {
    if (paymentWidget == null) return;
    
    // Render the payment methods box
    const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
      '#payment-widget',
      { value: amount },
      { variantKey: 'DEFAULT' }
    );
    // Render the agreement UI
    paymentWidget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' });
    
    paymentMethodsWidgetRef.current = paymentMethodsWidget;
  }, [paymentWidget, amount]);

  const handlePayment = async () => {
    try {
      if (!paymentWidget) return;
      
      await paymentWidget.requestPayment({
        orderId: `ORDER_${new Date().getTime()}`,
        orderName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: session?.user?.email || 'customer@docflow.ai',
        customerName: session?.user?.name || 'DocFlow User',
      });
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div id="payment-widget" className="w-full min-h-[300px]" />
      <div id="agreement" className="w-full mt-4" />
      <button 
        onClick={handlePayment} 
        disabled={!paymentWidget}
        className="mt-6 w-full bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {amount.toLocaleString()}원 결제하기
      </button>
    </div>
  );
}
