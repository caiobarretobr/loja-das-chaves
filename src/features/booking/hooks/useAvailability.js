import { useCallback, useEffect, useState } from 'react';
import { fetchAvailability } from '../services/bookingApi';

export function useAvailability() {
  const [state, setState] = useState({
    dates: [],
    slotsByDate: {},
    loading: true,
    error: '',
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));

    try {
      const data = await fetchAvailability();
      setState({
        dates: data.dates || [],
        slotsByDate: data.slotsByDate || {},
        loading: false,
        error: '',
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
