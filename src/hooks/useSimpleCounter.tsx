import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface CounterData {
  used: number;
  limit: number;
  canAdd: boolean;
  resetTime?: Date;
}

export const useSimpleCounter = () => {
  const { user } = useAuth();
  const [counter, setCounter] = useState<CounterData>({ used: 0, limit: 5, canAdd: true });
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const getStorageKey = useCallback(() => {
    if (!user) return null;
    return `receipt_counter_10min_${user.id}`;
  }, [user]);

  const loadCounter = useCallback(() => {
    const key = getStorageKey();
    if (!key) return;

    try {
      const stored = localStorage.getItem(key);
      const now = new Date();
      
      if (stored) {
        const data = JSON.parse(stored);
        const used = Math.max(0, data.used || 0);
        const resetTime = data.resetTime ? new Date(data.resetTime) : null;
        
        console.log('📊 LOADING STORED DATA:', { 
          rawUsed: data.used, 
          finalUsed: used, 
          resetTime: resetTime?.toISOString(),
          currentTime: now.toISOString()
        });
        
        // Check if 10 minutes have passed since reset time
        if (resetTime && now.getTime() >= resetTime.getTime()) {
          console.log('⏰ 10 minutes expired - resetting counter');
          console.log('⏰ Reset details:', { 
            currentTime: now.toISOString(), 
            resetTime: resetTime.toISOString(),
            timeDiff: (now.getTime() - resetTime.getTime()) / 1000 + 's ago'
          });
          
          // Clear localStorage completely to avoid any stale data
          localStorage.removeItem(key);
          
          // Set counter to fresh state
          const resetState = { used: 0, limit: 5, canAdd: true, resetTime: undefined };
          setCounter(resetState);
          setTimeLeft(0);
          
          console.log('⏰ Counter reset complete:', resetState);
        } else {
          const canAdd = used < 5;
          setCounter({ used, limit: 5, canAdd, resetTime });
          
          // Update time left if we have a reset time
          if (resetTime) {
            const secondsLeft = Math.max(0, Math.floor((resetTime.getTime() - now.getTime()) / 1000));
            setTimeLeft(secondsLeft);
          }
          
          console.log('📊 COUNTER LOADED:', { used, limit: 5, canAdd, resetTime });
        }
      } else {
        setCounter({ used: 0, limit: 5, canAdd: true });
        console.log('📊 COUNTER INITIALIZED:', { used: 0, limit: 5, canAdd: true });
      }
    } catch (error) {
      console.error('Error loading counter:', error);
      setCounter({ used: 0, limit: 5, canAdd: true });
    }
  }, [getStorageKey]);

  const increment = useCallback((): boolean => {
    const key = getStorageKey();
    if (!key) return false;

    try {
      const current = counter.used;
      if (current >= 5) {
        console.log('❌ COUNTER: Already at limit');
        return false;
      }

      const newUsed = current + 1;
      const newCanAdd = newUsed < 5;
      
      console.log('📊 INCREMENT:', { 
        currentUsed: current, 
        newUsed, 
        limit: 5, 
        willBeAtLimit: newUsed >= 5 
      });
      
      // Set reset time to 10 minutes from now when limit is reached
      let resetTime = counter.resetTime;
      if (newUsed >= 5 && !resetTime) {
        resetTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const secondsLeft = 10 * 60;
        setTimeLeft(secondsLeft);
        console.log('⏰ LIMIT REACHED - Reset time set to:', resetTime);
      }
      
      localStorage.setItem(key, JSON.stringify({ 
        used: newUsed, 
        resetTime: resetTime ? resetTime.toISOString() : null 
      }));
      setCounter({ used: newUsed, limit: 5, canAdd: newCanAdd, resetTime });
      
      console.log('✅ COUNTER INCREMENTED:', { used: newUsed, limit: 5, canAdd: newCanAdd, resetTime });
      return true;
    } catch (error) {
      console.error('Error incrementing counter:', error);
      return false;
    }
  }, [getStorageKey, counter.used, counter.resetTime]);

  const reset = useCallback(() => {
    const key = getStorageKey();
    if (!key) return;
    
    localStorage.removeItem(key);
    setCounter({ used: 0, limit: 5, canAdd: true });
    setTimeLeft(0);
    console.log('🔄 COUNTER RESET');
  }, [getStorageKey]);

  const formatTimeRemaining = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (user) {
      loadCounter();
    }
  }, [user, loadCounter]);

  // Timer effect - update countdown every second
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up, reload counter to reset
            loadCounter();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, loadCounter]);

  return {
    used: counter.used,
    limit: counter.limit,
    canAdd: counter.canAdd,
    increment,
    reset,
    refresh: loadCounter,
    timeLeft,
    formatTimeRemaining,
    shouldShowTimer: !counter.canAdd && timeLeft > 0
  };
};