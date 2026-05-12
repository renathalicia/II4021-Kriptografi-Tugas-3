import { useEffect, useRef } from 'react';
import { POLLING_INTERVAL } from '../utils/constants';

function usePolling(callback, dependencies = []) {
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(callback, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, dependencies);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { stopPolling };
}

export default usePolling;