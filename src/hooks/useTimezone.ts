import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface TimezonePreferences {
  timezone: string;
  manual_timezone: boolean;
  currency: string;
}

export function useTimezone() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<TimezonePreferences>({
    timezone: 'UTC',
    manual_timezone: false,
    currency: 'usd'
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load timezone preferences from localStorage
  useEffect(() => {
    if (user?.id) {
      const storedPreferences = localStorage.getItem(`preferences_${user.id}`);
      if (storedPreferences) {
        const prefs = JSON.parse(storedPreferences);
        setPreferences({
          timezone: prefs.timezone || 'UTC',
          manual_timezone: prefs.manual_timezone || false,
          currency: prefs.currency || 'usd'
        });
        setIsInitialized(true);
      } else {
        // Auto-detect timezone if no preferences stored
        try {
          const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setPreferences(prev => ({ ...prev, timezone: detectedTimezone }));
        } catch (error) {
          console.error('Failed to detect timezone:', error);
        }
        setIsInitialized(true);
      }
    } else {
      // Set initialized to true when no user (so functions don't hang)
      setIsInitialized(true);
    }
  }, [user?.id]);

  // Format date in user's timezone
  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Use safe timezone fallback
      const timezone = preferences.timezone || 'UTC';
      
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
        ...options
      };

      return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error);
      return typeof date === 'string' ? date : date.toISOString();
    }
  };

  // Format date for expense display (date only) - separate implementation to avoid time defaults
  const formatExpenseDate = (date: string | Date): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Use safe timezone fallback
      const timezone = preferences.timezone || 'UTC';
      
      // Define date-only options explicitly (no hour/minute defaults)
      const dateOnlyOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        timeZone: timezone
      };

      return new Intl.DateTimeFormat('en-US', dateOnlyOptions).format(dateObj);
    } catch (error) {
      console.error('Error formatting expense date:', error);
      return typeof date === 'string' ? date : date.toISOString();
    }
  };

  // Format datetime for timestamps
  const formatDateTime = (date: string | Date): string => {
    return formatDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current date in user's timezone (for new entries)
  const getCurrentDate = (): string => {
    try {
      const now = new Date();
      // Use a safe timezone fallback
      const timezone = preferences.timezone || 'UTC';
      
      // Convert to user's timezone and format as YYYY-MM-DD for date inputs
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(now);
    } catch (error) {
      console.error('Error getting current date:', error);
      // Safe fallback to ISO date
      return new Date().toISOString().split('T')[0];
    }
  };

  // Get timezone offset display
  const getTimezoneDisplay = (): string => {
    try {
      const timezone = preferences.timezone || 'UTC';
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';
      return `${timezone} (${timeZoneName})`;
    } catch (error) {
      return preferences.timezone || 'UTC';
    }
  };

  return {
    timezone: preferences.timezone,
    formatDate,
    formatExpenseDate,
    formatDateTime,
    getCurrentDate,
    getTimezoneDisplay,
    isManualTimezone: preferences.manual_timezone,
    isInitialized
  };
}