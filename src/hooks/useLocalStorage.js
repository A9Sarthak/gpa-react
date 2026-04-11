import { useState, useEffect } from 'react';

/**
 * A custom hook to sync state with localStorage.
 * Handles parsing/stringifying JSON gracefully.
 */
export function useLocalStorage(key, initialValue) {
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Keep localStorage sync'd
  useEffect(() => {
    try {
      if (storedValue === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
