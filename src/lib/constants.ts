import { Zap, Trophy, Award, Tent, HelpCircle, Sunrise, Sun, Sunset, CalendarDays, Clock, MapPin, Users, Flag, ClipboardList, Shield, Palmtree, HeartPulse, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EventType, TimeOfDay, ConvocazioneStatus, ConvocazioneResponse, EventStatus, UserRole, AbsenceReason, AvailabilityStatus, CertificateStatus } from '@/types';

export const EVENT_TYPE_META: Record<EventType, { label: string; color: string; bg: string; border: string; dot: string; icon: LucideIcon }> = {
  allenamento: { label: 'Allenamento', color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400', icon: Zap },
  partita: { label: 'Partita', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400', icon: Trophy },
  torneo: { label: 'Torneo', color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30', dot: 'bg-rose-400', icon: Award },
  ritiro: { label: 'Ritiro', color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/30', dot: 'bg-sky-400', icon: Tent },
  altro: { label: 'Altro', color: 'text-zinc-300', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', dot: 'bg-zinc-400', icon: HelpCircle },
};

export const EVENT_STATUS_META: Record<EventStatus, { label: string; color: string; bg: string; border: string }> = {
  programmato: { label: 'Programmato', color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  in_corso: { label: 'In corso', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  completato: { label: 'Completato', color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  annullato: { label: 'Annullato', color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
};

export const TIME_OF_DAY_META: Record<TimeOfDay, { label: string; icon: LucideIcon }> = {
  mattino: { label: 'Mattino', icon: Sunrise },
  pomeriggio: { label: 'Pomeriggio', icon: Sun },
  sera: { label: 'Sera', icon: Sunset },
  full_day: { label: 'Tutto il giorno', icon: CalendarDays },
  da_definire: { label: 'Da definire', icon: HelpCircle },
};

export const CONVOCATO_STATUS_META: Record<ConvocazioneStatus, { label: string; color: string; bg: string }> = {
  convocato: { label: 'Convocato', color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  non_convocato: { label: 'Non convocato', color: 'text-zinc-400', bg: 'bg-zinc-500/15' },
  in_dubbio: { label: 'In dubbio', color: 'text-amber-300', bg: 'bg-amber-500/15' },
};

export const RESPONSE_META: Record<ConvocazioneResponse, { label: string; color: string; bg: string }> = {
  confermato: { label: 'Confermato', color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  declinato: { label: 'Non disponibile', color: 'text-rose-300', bg: 'bg-rose-500/15' },
  in_attesa: { label: 'In attesa', color: 'text-zinc-400', bg: 'bg-zinc-500/15' },
};

export const PRIORITY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  normale: { label: 'Normale', color: 'text-zinc-300', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' },
  importante: { label: 'Importante', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  urgente: { label: 'Urgente', color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
};

export const ABSENCE_REASON_META: Record<AbsenceReason, { label: string; color: string; bg: string; border: string; icon: LucideIcon }> = {
  vacanza: { label: 'Vacanza', color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/30', icon: Palmtree },
  infortunio: { label: 'Infortunio', color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: HeartPulse },
  scuola: { label: 'Scuola', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: GraduationCap },
  altro: { label: 'Altro', color: 'text-zinc-300', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', icon: HelpCircle },
};

export const ROLES = ['portiere', 'difensore', 'centrocampista', 'attaccante'];

export const AVAILABILITY_META: Record<AvailabilityStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  disponibile: { label: 'Disponibile', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: 'text-emerald-400' },
  non_disponibile: { label: 'Non disponibile', color: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-500/30', icon: 'text-rose-400' },
};

export const ROLE_LABELS: Record<string, string> = {
  portiere: 'Portiere',
  difensore: 'Difensore',
  centrocampista: 'Centrocampista',
  attaccante: 'Attaccante',
};

export const ROLE_COLORS: Record<string, string> = {
  portiere: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  difensore: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
  centrocampista: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  attaccante: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
};

export const ROLE_ICONS: Record<string, LucideIcon> = {
  portiere: Shield,
  difensore: Shield,
  centrocampista: Users,
  attaccante: Flag,
};

export const USER_ROLE_META: Record<UserRole, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  coach: { label: 'Allenatore', color: 'text-emerald-300', bg: 'bg-emerald-500/10', icon: ClipboardList },
  manager: { label: 'Dirigente', color: 'text-amber-300', bg: 'bg-amber-500/10', icon: Users },
  parent: { label: 'Genitore', color: 'text-sky-300', bg: 'bg-sky-500/10', icon: Users },
};

export const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
export const MONTHS_SHORT = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];
export const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

export function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
}

export function getInitials(name: string, surname: string): string {
  return ((name[0] || '') + (surname[0] || '')).toUpperCase();
}

export function formatBirthDate(dateStr: string | null): string {
  if (!dateStr) return 'N/D';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getAge(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function getDaysUntilBirthday(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const md = dateStr.slice(5);
  const now = new Date();
  const year = now.getFullYear();
  let next = new Date(year + '-' + md + 'T00:00:00');
  if (next < now) next = new Date(year + 1 + '-' + md + 'T00:00:00');
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isBirthdayToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.slice(5) === new Date().toISOString().slice(5, 10);
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function formatCommunicationForWhatsApp(title: string, body: string, priority?: string): string {
  const header = priority ? `*${priority.toUpperCase()}* - ` : '';
  return `${header}*${title}*\n\n${body}\n\n— Cheraschese 2015 Esordienti`;
}

export const CERTIFICATE_STATUS_META: Record<CertificateStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  valid: { label: 'Valido', color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  expiring_soon: { label: 'In scadenza', color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  expired: { label: 'Scaduto', color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  missing: { label: 'Mancante', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', dot: 'bg-zinc-400' },
};

export const DEFAULT_EXPIRING_SOON_THRESHOLD = 30;

export function getCertificateStatus(certificateDate: string | null, thresholdDays: number = DEFAULT_EXPIRING_SOON_THRESHOLD): CertificateStatus {
  if (!certificateDate) return 'missing';
  const now = new Date();
  const certDate = new Date(certificateDate + 'T00:00:00');
  const expiryDate = new Date(certDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= thresholdDays) return 'expiring_soon';
  return 'valid';
}

export function getCertificateExpiryDate(certificateDate: string | null): string | null {
  if (!certificateDate) return null;
  const certDate = new Date(certificateDate + 'T00:00:00');
  certDate.setFullYear(certDate.getFullYear() + 1);
  return certDate.toISOString().slice(0, 10);
}

export function getDaysUntilCertificateExpiry(certificateDate: string | null): number | null {
  if (!certificateDate) return null;
  const expiry = getCertificateExpiryDate(certificateDate);
  if (!expiry) return null;
  const now = new Date();
  const expDate = new Date(expiry + 'T00:00:00');
  const diffMs = expDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
