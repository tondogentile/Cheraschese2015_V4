import { useEffect, useState, useCallback } from 'react';
import type { Communication } from '@/types';
import { communicationService } from '@/services';

export function useCommunications() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communicationService.getAll();
      setCommunications(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { communications, setCommunications, loading, error, reload };
}
