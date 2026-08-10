import { getInitials, ROLE_COLORS, ROLE_LABELS } from '@/lib/constants';
import type { Player } from '@/types';

export default function PlayerAvatar({ player, size = 'md' }: { player: Player; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
  };
  const initials = getInitials(player.name, player.surname);
  return (
    <div className={`${sizes[size]} rounded-full bg-card border border-primary-app/30 flex items-center justify-center font-bebas text-primary-app shrink-0`}>
      {initials}
    </div>
  );
}

export function PlayerRoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${ROLE_COLORS[role] || ROLE_COLORS.centrocampista}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}
