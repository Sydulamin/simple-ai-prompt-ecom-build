import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import {
  selectCartItems, selectCartTotal, selectCartIsOpen,
  closeCart, removeFromCart, updateQuantity,
} from '../../store/cartSlice.js';
import { formatPrice } from '../../utils/formatters.js';

export default function CartDrawer() {
  const dispatch = useDispatch();
  const items    = useSelector(selectCartItems);
  const total    = useSelector(selectCartTotal);
  const isOpen   = useSelector(selectCartIsOpen);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => dispatch(closeCart())}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50
                    flex flex-col transform transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-gray-700" />
            <h2 className="font-semibold text-gray-900">
              Cart <span className="text-gray-400 font-normal text-sm">({items.length})</span>
            </h2>
          </div>
          <button
            onClick={() => dispatch(closeCart())}
            className="btn-ghost p-1.5"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
              <button
                onClick={() => dispatch(closeCart())}
                className="btn-primary mt-4"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4" aria-label="Cart items">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart size={20} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-brand-600 mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                        className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center
                                   hover:bg-gray-50 text-gray-600 transition-colors"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                        disabled={item.quantity >= item.stock}
                        className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center
                                   hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="ml-auto text-red-400 hover:text-red-600 p-1 transition-colors"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Shipping calculated at checkout</p>
            <Link
              to="/checkout"
              onClick={() => dispatch(closeCart())}
              className="btn-primary w-full justify-center py-3"
            >
              Proceed to Checkout
            </Link>
            <Link
              to="/cart"
              onClick={() => dispatch(closeCart())}
              className="btn-outline w-full justify-center mt-2"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
