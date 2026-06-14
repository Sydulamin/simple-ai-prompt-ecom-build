import { Link } from 'react-router-dom';
import { XCircle, RotateCcw } from 'lucide-react';

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle size={36} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 text-sm mb-6">
          Something went wrong with your payment. Your cart is still intact — please try again.
        </p>
        <div className="flex flex-col gap-2">
          <Link to="/checkout" className="btn-primary justify-center">
            <RotateCcw size={16} /> Try Again
          </Link>
          <Link to="/" className="btn-outline justify-center">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
