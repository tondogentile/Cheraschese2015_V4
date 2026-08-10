export type Player = {
  id: string;
  name: string;
  surname: string;
  number: number | null;
  birth_date: string | null;
  role: string;
  parent1_name: string | null;
  parent1_phone: string | null;
  parent1_email: string | null;
  parent2_name: string | null;
  parent2_phone: string | null;
  parent2_email: string | null;
  notes: string | null;
  avatar_url: string | null;
  active: boolean;
  medical_certificate_date: string | null;
  medical_certificate_notes: string | null;
  created_at: string;
};

export type CertificateStatus = 'valid' | 'expiring_soon' | 'expired' | 'missing';

export type AdminSettings = {
  expiring_soon_threshold: number;
  email_reminder_enabled: boolean;
  whatsapp_reminder_enabled: boolean;
};

export type EventType = 'allenamento' | 'partita' | 'torneo' | 'ritiro' | 'altro';
export type TimeOfDay = 'mattino' | 'pomeriggio' | 'sera' | 'full_day' | 'da_definire';
export type EventStatus = 'programmato' | 'in_corso' | 'completato' | 'annullato';

export type TeamEvent = {
  id: string;
  title: string;
  event_type: EventType;
  date: string;
  meeting_time: string | null;
  time_start: string | null;
  time_end: string | null;
  time_of_day: TimeOfDay;
  location: string | null;
  description: string | null;
  opponent: string | null;
  status: EventStatus;
  created_at: string;
  series_id: string | null;
  original_date: string | null;
  is_exception: boolean;
  exception_type: ExceptionType | null;
};

export type ExceptionType = 'holiday' | 'cancellation' | 'different_schedule' | 'special_training';

export type RecurrenceRule = {
  days_of_week: number[];
  time_start: string;
  time_end: string;
  start_date: string;
  end_date: string;
  meeting_time: string | null;
  location: string | null;
  title: string;
  description: string | null;
};

export type RecurringCreateInput = {
  rule: RecurrenceRule;
};

export type EditScope = 'single' | 'future' | 'series';

export type DeleteScope = 'single' | 'future' | 'series';

export type ConvocazioneStatus = 'convocato' | 'non_convocato' | 'in_dubbio';
export type ConvocazioneResponse = 'confermato' | 'declinato' | 'in_attesa';

export type Convocazione = {
  id: string;
  event_id: string;
  player_id: string;
  status: ConvocazioneStatus;
  response: ConvocazioneResponse;
  notes: string | null;
  created_at: string;
};

export type ConvocazioneWithPlayer = Convocazione & { player: Player };

export type Communication = {
  id: string;
  title: string;
  body: string;
  priority: 'normale' | 'importante' | 'urgente';
  pinned: boolean;
  created_at: string;
};

export type UserRole = 'coach' | 'manager' | 'parent';

export type MockUser = {
  id: string;
  name: string;
  role: UserRole;
  player_ids?: string[];
};

export type AttendanceStats = {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  rate: number;
};

export type ConvocationSummary = {
  invited: number;
  confirmed: number;
  declined: number;
  pending: number;
  inDubbio: number;
  confirmedPct: number;
  declinedPct: number;
  pendingPct: number;
};

export type PlayerAttendanceDetail = {
  playerId: string;
  total: number;
  present: number;
  absent: number;
  pending: number;
  rate: number;
  training: { total: number; present: number; rate: number };
  match: { total: number; present: number; rate: number };
  tournament: { total: number; present: number; rate: number };
  recentAttended: { eventId: string; eventTitle: string; date: string; eventType: EventType }[];
};

export type TeamAttendanceStats = {
  averageRate: number;
  totalPresent: number;
  totalAbsent: number;
  totalPending: number;
  mostPresent: { player: Player; rate: number; present: number }[];
  pendingConfirmations: { player: Player; count: number }[];
  monthlyTrend: { month: string; label: string; rate: number; present: number; absent: number }[];
};

export type AttendanceByEvent = {
  event: TeamEvent;
  summary: ConvocationSummary;
  records: ConvocazioneWithPlayer[];
};

export type AttendanceByPlayer = {
  player: Player;
  detail: PlayerAttendanceDetail;
};

export type CoachAttendanceAlerts = {
  missingConfirmations: { player: Player; eventName: string; eventId: string; eventDate: string }[];
  frequentAbsences: { player: Player; absentCount: number; totalEvents: number; rate: number }[];
  unavailableNext: { player: Player; eventName: string; eventId: string }[];
};

export type AbsenceReason = 'vacanza' | 'infortunio' | 'scuola' | 'altro';

export type PlannedAbsence = {
  id: string;
  player_id: string;
  start_date: string;
  end_date: string;
  reason: AbsenceReason;
  notes: string | null;
  created_at: string;
};

export type PlannedAbsenceWithPlayer = PlannedAbsence & { player: Player };

export type TrainingAttendanceSummary = {
  total: number;
  present: number;
  absent: number;
};

export type AvailabilityStatus = 'disponibile' | 'non_disponibile';

export type Availability = {
  id: string;
  event_id: string;
  player_id: string;
  status: AvailabilityStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilityWithPlayer = Availability & { player: Player };

export type AvailabilitySummary = {
  available: number;
  unavailable: number;
  total: number;
};

export type EventAvailabilityDetail = {
  event: TeamEvent;
  summary: AvailabilitySummary;
  records: AvailabilityWithPlayer[];
};

export type AvailabilityByEventItem = {
  event: TeamEvent;
  summary: AvailabilitySummary;
};
