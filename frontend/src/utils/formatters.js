export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (dateStr) =>
  new Intl.DateTimeFormat('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(dateStr));

export const truncate = (str, len = 80) =>
  str?.length > len ? `${str.slice(0, len)}…` : str;

export const discountPercent = (price, comparePrice) => {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
};
