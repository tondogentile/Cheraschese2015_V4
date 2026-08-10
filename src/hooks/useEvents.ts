import { useEffect, useState, useCallback } from 'react';
import type { TeamEvent } from '@/types';
import { eventService } from '@/services';

export function useEvents() {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.getAll();
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { events, setEvents, loading, error, reload };
}
