import { useState, useEffect, useCallback } from 'react';
import { privacyService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import type { Player, PrivacySettings } from '@/types';

// Frontend-only mock privacy simulation for future Supabase/auth integration.
// Not real security — server-side enforcement will be added in a later phase.

export function usePrivacy() {
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = await privacyService.get();
    setPrivacy(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { privacy, loading, reload: load };
}

export function useParentRosterFilter(allPlayers: Player[]): {
  visiblePlayers: Player[];
  isParentMode: boolean;
  privacy: PrivacySettings | null;
} {
  const { role, user } = useAuth();
  const { privacy } = usePrivacy();
  const isParentMode = role === 'parent';

  if (!isParentMode) {
    return { visiblePlayers: allPlayers, isParentMode: false, privacy: null };
  }

  const childIds = user.player_ids || [];
  const visible = allPlayers.filter((p) => childIds.includes(p.id));
  return { visiblePlayers: visible, isParentMode: true, privacy };
}
