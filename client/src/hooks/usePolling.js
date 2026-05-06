import { useEffect, useRef } from 'react';
import { POLLING_INTERVAL } from '../utils/constants';

function usePolling(callback, dependencies = []) {
  const intervalRef = useRef(null);

  useEffect(() => {
    // Start polling
    intervalRef.current = setInterval(callback, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, dependencies);

  // Return function untuk stop polling manually
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { stopPolling };
}

export default usePolling;