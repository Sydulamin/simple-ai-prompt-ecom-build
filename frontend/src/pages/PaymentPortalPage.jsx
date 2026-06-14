
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Smartphone, CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../utils/api.js';

export default function PaymentPortalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const type = searchParams.get('type') || 'bkash';
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const amount = parseFloat(searchParams.get('amount') || 0);

  const [step, setStep] = useState(1); // 1: Enter number, 2: Enter PIN, 3: Confirm, 4: Complete
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleNext = () => {
    if (step === 1 && phoneNumber.length >= 11) {
      setStep(2);
    } else if (step === 2 && pin.length >= 4) {
      handlePayment();
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call backend to confirm payment (mock mode just needs to trigger update)
      if (type === 'bkash') {
        await api.get(`/payment/bkash/callback?paymentID=MOCK_BKASH_${orderId}&status=success`);
      } else {
        await api.post('/payment/sslcommerz/ipn', { tran_id: orderNumber, val_id: 'MOCK_VAL_ID' });
      }

      setSuccess(true);
      setStep(4);

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        navigate(`/payment/success?order=${orderNumber}`);
      }, 2000);
    } catch (err) {
      console.error('Payment failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${type === 'bkash' ? 'bg-gradient-to-r from-pink-500 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
          <div className="flex items-center gap-3">
            {type === 'bkash' ? (
              <Smartphone size={36} className="text-white" />
            ) : (
              <CreditCard size={36} className="text-white" />
            )}
            <div className="text-white">
              <h1 className="text-2xl font-bold">
                {type === 'bkash' ? 'bKash' : 'SSLCommerz'}
              </h1>
              <p className="text-pink-100 text-sm">Secure Payment</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Amount Display (always visible) */}
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm">Payable Amount</p>
            <p className="text-3xl font-bold text-gray-900">
              ৳ {amount.toLocaleString('en-BD')}
            </p>
            <p className="text-xs text-gray-400 mt-1">Order: {orderNumber}</p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {type === 'bkash' ? 'bKash Number' : 'Card Number'}
                </label>
                <div className="relative">
                  {type === 'bkash' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                      +880
                    </span>
                  )}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={type === 'bkash' ? '1XXXXXXXXX' : 'XXXX XXXX XXXX XXXX'}
                    className={`w-full input ${type === 'bkash' ? 'pl-12' : ''}`}
                    maxLength={type === 'bkash' ? 11 : 19}
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={phoneNumber.length < (type === 'bkash' ? 11 : 13)}
                className={`w-full btn-primary justify-center py-3 ${type === 'sslcommerz' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                ← Back
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {type === 'bkash' ? 'PIN' : 'Card PIN / CVV'}
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="****"
                  className="w-full input"
                  maxLength={type === 'bkash' ? 5 : 4}
                />
              </div>

              <button
                onClick={handleNext}
                disabled={pin.length < 4 || processing}
                className={`w-full btn-primary justify-center py-3 ${type === 'sslcommerz' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                {processing ? (
                  <><Loader2 size={18} className="animate-spin mr-2" /> Processing...</>
                ) : (
                  `Pay ৳ ${amount.toLocaleString('en-BD')}`
                )}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              {success ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
                    <p className="text-gray-500 mt-1">Redirecting to confirmation...</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <XCircle size={48} className="text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Failed!</h2>
                    <p className="text-gray-500 mt-1">Please try again</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-400">
            Secured by {type === 'bkash' ? 'bKash' : 'SSLCommerz'} • Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
