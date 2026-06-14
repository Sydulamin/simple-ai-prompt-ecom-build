import { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { formatPrice } from '../../utils/formatters.js';

/**
 * Pure-CSS bar chart — no external chart library needed.
 * Shows last 30 days revenue per day.
 */
export default function RevenueChart() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/revenue-chart')
      .then((res) => setData(res.data.chart || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-5 w-40 rounded mb-4" />
        <div className="skeleton h-40 w-full rounded" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-2">Revenue (Last 30 Days)</h2>
        <p className="text-sm text-gray-400 py-10 text-center">No revenue data yet</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => parseFloat(d.revenue)), 1);

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-800 mb-4">Revenue — Last 30 Days</h2>
      <div className="flex items-end gap-1 h-40" role="img" aria-label="Revenue bar chart">
        {data.map((d, i) => {
          const height = Math.max((parseFloat(d.revenue) / maxRevenue) * 100, 2);
          const date   = new Date(d.day).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 group cursor-default"
              title={`${date}: ${formatPrice(d.revenue)} (${d.orders} orders)`}
            >
              <div className="relative w-full">
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1
                                bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                  {date}<br />{formatPrice(d.revenue)}
                </div>
                <div
                  className="w-full bg-brand-500 rounded-t hover:bg-brand-600 transition-colors"
                  style={{ height: `${height}%`, minHeight: '3px' }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{new Date(data[0]?.day).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(data[data.length - 1]?.day).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}
