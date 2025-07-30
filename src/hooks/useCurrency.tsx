import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
  position: 'before' | 'after';
}

const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  usd: { symbol: '$', code: 'USD', name: 'US Dollar', position: 'before' },
  eur: { symbol: '€', code: 'EUR', name: 'Euro', position: 'after' },
  gbp: { symbol: '£', code: 'GBP', name: 'British Pound', position: 'before' },
  cad: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar', position: 'before' }
};

export function useCurrency() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCY_MAP.usd);

  useEffect(() => {
    if (user?.id) {
      // Load currency preference from localStorage
      const stored = localStorage.getItem(`preferences_${user.id}`);
      if (stored) {
        try {
          const prefs = JSON.parse(stored);
          const currencyCode = prefs.currency || 'usd';
          setCurrency(CURRENCY_MAP[currencyCode] || CURRENCY_MAP.usd);
        } catch (error) {
          console.error('Error loading currency preference:', error);
        }
      }
    }
  }, [user?.id]);

  const formatAmount = (amount: number): string => {
    const formattedNumber = amount.toFixed(2);
    
    if (currency.position === 'before') {
      return `${currency.symbol}${formattedNumber}`;
    } else {
      return `${formattedNumber}${currency.symbol}`;
    }
  };

  const formatAmountWithCode = (amount: number): string => {
    const formattedNumber = amount.toFixed(2);
    return `${formattedNumber} ${currency.code}`;
  };

  return {
    currency,
    formatAmount,
    formatAmountWithCode
  };
}