import { useEffect, useRef, useState } from 'react';
import api from '../services/api.js';

export default function useServerWarmup() {
  const [isReady, setIsReady] = useState(false);
  const [isPinging, setIsPinging] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Pinging production backend & ML servers...');
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const pingServers = async () => {
    if (!isMountedRef.current) return;
    setIsPinging(true);

    try {
      const response = await api.get('/health', { timeout: 10000 });
      if (!isMountedRef.current) return;

      if (response.data && (response.data.status === 'ok' || response.status === 200)) {
        setIsReady(true);
        setIsPinging(false);
        setStatusMessage('Production servers online and ready');
        return;
      }
    } catch {
      if (!isMountedRef.current) return;
      setIsReady(false);
      setIsPinging(true);
      setStatusMessage('Waking up production backend & AI servers...');
      
      // Retry in 2 seconds
      timeoutRef.current = setTimeout(pingServers, 2000);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    pingServers();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isReady,
    isPinging,
    statusMessage,
    checkServers: pingServers,
  };
}
