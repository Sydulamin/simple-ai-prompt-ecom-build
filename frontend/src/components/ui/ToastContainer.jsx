import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToastProvider } from '../../hooks/useToast.js';

const ICONS = {
  success: <CheckCircle size={16} className="text-green-500 flex-shrink-0" />,
  error:   <XCircle    size={16} className="text-red-500   flex-shrink-0" />,
  info:    <Info       size={16} className="text-blue-500  flex-shrink-0" />,
};

function Toast({ id, type, msg, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 3500);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <div
      className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl
                 shadow-lg px-4 py-3 min-w-[260px] max-w-sm animate-slide-up"
      role="alert"
    >
      {ICONS[type]}
      <p className="text-sm text-gray-800 font-medium flex-1">{msg}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToastProvider();

  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
