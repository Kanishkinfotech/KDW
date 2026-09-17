interface CurrencyConfig {
  currency?: string;
  symbol?: string;
  symbolPosition?: 'BEFORE' | 'AFTER';
  decimalPlaces?: number;
}

let activeCurrencyConfig: CurrencyConfig = {
  currency: 'INR',
  symbol: '₹',
  symbolPosition: 'BEFORE',
  decimalPlaces: 0
};

export const setGlobalCurrencyConfig = (config: Partial<CurrencyConfig>) => {
  activeCurrencyConfig = { ...activeCurrencyConfig, ...config };
};

export const formatCurrency = (amount: number, config?: CurrencyConfig): string => {
  const effectiveConfig = config || activeCurrencyConfig;
  const num = Number(amount) || 0;
  
  try {
    const formattedNum = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: effectiveConfig.decimalPlaces ?? 0,
      maximumFractionDigits: effectiveConfig.decimalPlaces !== undefined ? Math.max(effectiveConfig.decimalPlaces, 2) : 2,
    }).format(num);

    const symbol = effectiveConfig.symbol || '₹';
    if (effectiveConfig.symbolPosition === 'AFTER') {
      return `${formattedNum} ${symbol}`;
    }
    return `${symbol}${formattedNum}`;
  } catch {
    return `₹${num.toFixed(effectiveConfig.decimalPlaces ?? 0)}`;
  }
};
