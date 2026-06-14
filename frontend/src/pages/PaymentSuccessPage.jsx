import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { CheckCircle, Package } from 'lucide-react';
import { clearCart } from '../store/cartSlice.js';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const orderNum = params.get('order');

  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={36} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        {orderNum && (
          <p className="text-sm text-gray-500 mb-1">
            Order <span className="font-semibold text-gray-800">{orderNum}</span>
          </p>
        )}
        <p className="text-gray-600 text-sm mb-6">
          Thank you for your purchase. You'll receive a confirmation shortly.
        </p>
        <div className="flex flex-col gap-2">
          <Link to="/orders" className="btn-primary justify-center">
            <Package size={16} /> View My Orders
          </Link>
          <Link to="/" className="btn-outline justify-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
