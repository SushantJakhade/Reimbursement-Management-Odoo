// ─── APPLICATION CONSTANTS ──────────────────────────────────

export const APP_CONSTANTS = {
  API_PREFIX: '/api/v1',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  EXCHANGE_RATE_CACHE_TTL: 3600000, // 1 hour in ms
  POINTS_THRESHOLD_PERCENT: 80, // Award points if expense < 80% of category max
  POINTS_PER_SAVING: 10,
  DEFAULT_ALERT_THRESHOLD: 90,
  MAX_UPLOAD_FILES: 5,
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Travel', code: 'TRAVEL', icon: '✈️', maxAmount: 5000, requiresReceipt: true },
  { name: 'Meals', code: 'MEALS', icon: '🍽️', maxAmount: 200, requiresReceipt: true },
  { name: 'Office Supplies', code: 'SUPPLIES', icon: '📦', maxAmount: 500, requiresReceipt: false },
  { name: 'Software', code: 'SOFTWARE', icon: '💻', maxAmount: 1000, requiresReceipt: true },
  { name: 'Transportation', code: 'TRANSPORT', icon: '🚗', maxAmount: 300, requiresReceipt: true },
  { name: 'Accommodation', code: 'ACCOMMODATION', icon: '🏨', maxAmount: 3000, requiresReceipt: true },
  { name: 'Communication', code: 'COMMUNICATION', icon: '📱', maxAmount: 200, requiresReceipt: false },
  { name: 'Training', code: 'TRAINING', icon: '📚', maxAmount: 2000, requiresReceipt: true },
  { name: 'Entertainment', code: 'ENTERTAINMENT', icon: '🎭', maxAmount: 500, requiresReceipt: true },
  { name: 'Miscellaneous', code: 'MISC', icon: '📋', maxAmount: 250, requiresReceipt: false },
];

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'SGD',
  'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'ZAR', 'BRL', 'MXN', 'KRW', 'THB',
];
