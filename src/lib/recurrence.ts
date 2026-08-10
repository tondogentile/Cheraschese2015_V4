import type { TeamEvent, RecurrenceRule, EventType, TimeOfDay, EventStatus } from '@/types';

export const DAY_LABELS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const DAY_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function inferTimeOfDay(timeStart: string | null): TimeOfDay {
  if (!timeStart) return 'da_definire';
  const hour = parseInt(timeStart.slice(0, 2));
  if (hour < 12) return 'mattino';
  if (hour < 18) return 'pomeriggio';
  return 'sera';
}

export function generateRecurringEvents(
  rule: RecurrenceRule,
  seriesId: string,
  eventType: EventType = 'allenamento',
): TeamEvent[] {
  const events: TeamEvent[] = [];
  const start = new Date(rule.start_date + 'T00:00:00');
  const end = new Date(rule.end_date + 'T00:00:00');
  const cursor = new Date(start);

  while (cursor <= end) {
    const dow = cursor.getDay();
    if (rule.days_of_week.includes(dow)) {
      const dateStr = cursor.toISOString().slice(0, 10);
      events.push({
        id: `${seriesId}_${dateStr}`,
        title: rule.title,
        event_type: eventType,
        date: dateStr,
        meeting_time: rule.meeting_time,
        time_start: rule.time_start,
        time_end: rule.time_end,
        time_of_day: inferTimeOfDay(rule.time_start),
        location: rule.location,
        description: rule.description,
        opponent: null,
        status: 'programmato',
        created_at: new Date().toISOString(),
        series_id: seriesId,
        original_date: dateStr,
        is_exception: false,
        exception_type: null,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return events;
}

export function countRecurringEvents(rule: RecurrenceRule): number {
  let count = 0;
  const start = new Date(rule.start_date + 'T00:00:00');
  const end = new Date(rule.end_date + 'T00:00:00');
  const cursor = new Date(start);
  while (cursor <= end) {
    if (rule.days_of_week.includes(cursor.getDay())) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
