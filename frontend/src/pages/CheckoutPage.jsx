import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, CreditCard, Banknote, Smartphone, Gift, X } from 'lucide-react';
import { selectCartItems, selectCartTotal, clearCart } from '../store/cartSlice.js';
import { selectUser } from '../store/authSlice.js';
import api from '../utils/api.js';
import { formatPrice } from '../utils/formatters.js';

const PAYMENT_METHODS = [
  { id: 'cod',        icon: Banknote,    label: 'Cash on Delivery', desc: 'Pay when you receive' },
  { id: 'bkash',      icon: Smartphone,  label: 'bKash',            desc: 'bKash mobile payment' },
  { id: 'sslcommerz', icon: CreditCard,  label: 'Card / SSLCommerz', desc: 'Visa, Mastercard, Net Banking' },
];

const SHIPPING_THRESHOLD = 3000;

export default function CheckoutPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector(selectUser);
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [validating, setValidating] = useState(false);
  const [couponError, setCouponError] = useState('');

  const shipping  = cartTotal >= SHIPPING_THRESHOLD ? 0 : 60;
  const grandTotal = cartTotal + shipping - discount;

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [priceError,    setPriceError]    = useState('');

  const [form, setForm] = useState({
    name:    user?.name  || '',
    phone:   user?.phone || '',
    address: '',
    city:    '',
    zip:     '',
  });

  const applyCoupon = async () => {
    if (!couponCode) return;
    setValidating(true);
    setCouponError('');

    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode,
        subtotal: cartTotal
      });

      if (res.data.valid) {
        setAppliedCoupon(res.data.coupon);
        setDiscount(res.data.discount);
      } else {
        setCouponError(res.data.error);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPriceError('');
    setSubmitting(true);

    try {
      // Step 1: Server-side price verification (anti-tampering)
      const verifyRes = await api.post('/products/verify-cart', {
        items: cartItems.map((i) => ({
          product_id: i.id,
          quantity:   i.quantity,
          unit_price: i.price,
        })),
      });

      if (verifyRes.data.tampered) {
        setPriceError('Some prices changed. The cart has been updated with correct prices. Please review and try again.');
        setSubmitting(false);
        return;
      }

      const verifiedItems = verifyRes.data.items;
      const outOfStock    = verifiedItems.filter((i) => !i.in_stock);
      if (outOfStock.length > 0) {
        setError(`Out of stock: ${outOfStock.map((i) => i.name).join(', ')}`);
        setSubmitting(false);
        return;
      }

      // Step 2: Create order
      const orderRes = await api.post('/orders', {
        items: verifiedItems.map((i) => ({
          product_id: i.product_id,
          quantity:   i.quantity,
          unit_price: i.unit_price,
        })),
        shippingData: form,
        paymentMethod,
        subtotal:      cartTotal,
        shippingCharge: shipping,
        discount:      discount,
        couponId:      appliedCoupon?.id,
        total:         grandTotal,
      });

      const order = orderRes.data.order;

      // Step 3: Handle payment gateway redirect
      if (paymentMethod === 'bkash') {
        const bkRes = await api.post('/payment/bkash/create', { orderId: order.id });
        window.location.href = bkRes.data.bkashURL;
        return;
      }

      if (paymentMethod === 'sslcommerz') {
        const sslRes = await api.post('/payment/sslcommerz/init', { orderId: order.id });
        window.location.href = sslRes.data.gatewayURL;
        return;
      }

      // COD — order placed, clear cart and redirect
      dispatch(clearCart());
      navigate(`/payment/success?order=${order.order_number}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Shipping & Payment ────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Shipping form */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-4">Shipping Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input id="name" name="name" required value={form.name} onChange={handleChange} className="input" placeholder="Your full name" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input id="phone" name="phone" required value={form.phone} onChange={handleChange} className="input" placeholder="01700000000" />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input id="city" name="city" required value={form.city} onChange={handleChange} className="input" placeholder="Dhaka" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                  <textarea id="address" name="address" required rows={2} value={form.address} onChange={handleChange} className="input resize-none" placeholder="House, Road, Area" />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
                  <input id="zip" name="zip" value={form.zip} onChange={handleChange} className="input" placeholder="1200" />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(({ id, icon: Icon, label, desc }) => (
                  <label
                    key={id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors
                                ${paymentMethod === id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={id}
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                    ${paymentMethod === id ? 'bg-brand-100' : 'bg-gray-100'}`}>
                      <Icon size={18} className={paymentMethod === id ? 'text-brand-600' : 'text-gray-500'} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    {paymentMethod === id && (
                      <div className="ml-auto w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Errors */}
            {(error || priceError) && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error || priceError}
              </div>
            )}
          </div>

          {/* ── Order Summary ─────────────────────────────── */}
          <div>
            <div className="card p-5 sticky top-20">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>

              <ul className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex gap-2.5 text-sm">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.thumbnail && (
                        <img src={item.thumbnail} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium line-clamp-1">{item.name}</p>
                      <p className="text-gray-500 text-xs">× {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900 flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Coupon Input */}
              {!appliedCoupon ? (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Gift size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Have a coupon?"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full input pl-9"
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={validating || !couponCode}
                      className="btn-primary px-4"
                    >
                      {validating ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600 mt-2">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift size={18} className="text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">{formatPrice(discount)} off</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="p-1 text-green-600 hover:text-green-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center py-3 mt-4"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing…</>
                ) : (
                  <><ShieldCheck size={16} /> Place Order</>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Your order is protected by 256-bit SSL encryption
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
