/**
 * Format currency in KSh
 */
export const formatCurrency = (amount) => {
  if (!amount) return 'KSh 0';
  return `KSh ${parseFloat(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Get time remaining (kept for future use, but not displayed to buyers)
 */
export const getTimeRemaining = (endTime) => {
  const total = Date.parse(endTime) - Date.now();
  
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds, expired: false };
};

/**
 * Check if auction is active
 * CRITICAL: For auctions, ONLY checks status (manual admin control)
 * Timing is IGNORED for auction-type products
 */
export const isAuctionActive = (startTime, endTime, status, productType) => {
  // For auctions: ONLY check status (ignore timing completely)
  if (productType === 'auction' || productType === 'both') {
    return status === 'active';
  }
  
  // For buy_now products: also only check status
  return status === 'active';
};
