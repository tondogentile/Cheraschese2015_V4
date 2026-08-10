import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, CalendarDays, List, LayoutGrid, Star, Filter, Repeat } from 'lucide-react';
import type { TeamEvent, EventType, TimeOfDay } from '@/types';
import { eventService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { EVENT_TYPE_META, TIME_OF_DAY_META, MONTHS, MONTHS_SHORT, DAYS_SHORT, formatDateLong, formatTime } from '@/lib/constants';
import { DAY_LABELS_SHORT, countRecurringEvents } from '@/lib/recurrence';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import Modal from '@/components/Modal';

type ViewMode = 'list' | 'grid';

export default function Calendar() {
  const navigate = useNavigate();

  const { permissions } = useAuth();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set(['partita', 'torneo', 'ritiro']));
  const filteredEvents = useMemo(() => events.filter((e) => typeFilters.has(e.event_type)), [events, typeFilters]);

  const toggleFilter = (type: string) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const reload = async () => {
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
  };

  useEffect(() => { reload(); }, []);

  // Group events by month for list view
  const eventsByMonth = useMemo(() => {
    const map: Record<string, TeamEvent[]> = {};
    for (const e of filteredEvents) {
      const d = new Date(e.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [filteredEvents]);

  const sortedMonthKeys = useMemo(() => {
    return Object.keys(eventsByMonth).sort((a, b) => {
      const [ya, ma] = a.split('-').map(Number);
      const [yb, mb] = b.split('-').map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });
  }, [eventsByMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, TeamEvent[]> = {};
    for (const e of filteredEvents) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [filteredEvents]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const days: ({ date: string; day: number; isCurrent: boolean })[] = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrent: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d).toISOString().slice(0, 10);
      days.push({ date, day: d, isCurrent: true });
    }
    while (days.length < 42) {
      const last = new Date(days[days.length - 1].date);
      last.setDate(last.getDate() + 1);
      days.push({ date: last.toISOString().slice(0, 10), day: last.getDate(), isCurrent: false });
    }
    return days;
  }, [currentMonth]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const selectedEvents = useMemo(() => selectedDate ? (eventsByDate[selectedDate] || []) : [], [selectedDate, eventsByDate]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      {/* Title + view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl gold-text tracking-wide">CALENDARIO ATTIVITÀ</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Star className="w-2.5 h-2.5 text-gold fill-gold" />
            <span className="text-[10px] text-gold/70 font-bebas tracking-widest">STAGIONE 2025/26</span>
            <Star className="w-2.5 h-2.5 text-gold fill-gold" />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/80 border border-gold/20 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gold/20 text-gold' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Vista lista"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gold/20 text-gold' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Vista mensile"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Event type filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <Filter className="w-3.5 h-3.5 text-gold/60 shrink-0" />
        {Object.entries(EVENT_TYPE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const active = typeFilters.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bebas tracking-wider whitespace-nowrap border transition-colors ${
                active ? `${meta.bg} ${meta.color} ${meta.border}` : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {meta.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-gold/40 overflow-hidden bg-black">
          {/* Column header */}
          <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1.5fr_auto] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 bg-gold/5 border-b border-gold/30">
            <div className="flex items-center gap-1.5 w-11">
              <CalendarDays className="w-3.5 h-3.5 text-gold" />
              <span className="font-bebas text-xs text-gold tracking-wider hidden sm:inline">DATA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold" />
              <span className="font-bebas text-xs text-gold tracking-wider hidden sm:inline">LUOGO</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="font-bebas text-xs text-gold tracking-wider">EVENTO</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold" />
              <span className="font-bebas text-xs text-gold tracking-wider hidden sm:inline">ORARIO</span>
            </div>
          </div>

          {sortedMonthKeys.length === 0 ? (
            <div className="py-12">
              <EmptyState icon={CalendarDays} title="Nessun evento in programma" subtitle="Aggiungi il primo evento dal pulsante in basso" />
            </div>
          ) : (
            sortedMonthKeys.map((monthKey) => {
              const [year, month] = monthKey.split('-').map(Number);
              const monthEvents = eventsByMonth[monthKey];
              return (
                <div key={monthKey}>
                  {/* Month section header */}
                  <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 bg-gold/8 border-b border-gold/20">
                    <h2 className="font-bebas text-lg text-gold tracking-wider whitespace-nowrap">
                      {MONTHS[month].toUpperCase()} {year}
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-gold/50 to-transparent" />
                  </div>
                  {/* Event rows */}
                  {monthEvents.map((event) => (
                    <EventListRow key={event.id} event={event} onClick={() => navigate(`/eventi/${event.id}`)} />
                  ))}
                </div>
              );
            })
          )}

          {/* Legend footer */}
          <div className="border-t border-gold/30 bg-gold/5 px-3 sm:px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {Object.entries(EVENT_TYPE_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-gold" />
                    <span className="font-bebas text-[10px] text-zinc-400 tracking-wider">{meta.label.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 pt-1.5 border-t border-gold/10">
              {Object.entries(TIME_OF_DAY_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-gold/70" />
                    <span className="font-bebas text-[10px] text-zinc-500 tracking-wider">{meta.label.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-xl text-gold tracking-wider">
              {MONTHS[currentMonth.getMonth()].toUpperCase()} {currentMonth.getFullYear()}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 rounded-lg text-zinc-400 hover:text-gold hover:bg-zinc-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setCurrentMonth(new Date()); setSelectedDate(todayStr); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gold hover:bg-zinc-900 transition-colors font-bebas tracking-wider"
              >
                OGGI
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 rounded-lg text-zinc-400 hover:text-gold hover:bg-zinc-900 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="rounded-2xl border border-gold/40 bg-black overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gold/30">
              {DAYS_SHORT.map((d) => (
                <div key={d} className="text-center py-2 font-bebas text-xs text-gold/70 tracking-wider">
                  {d.toUpperCase()}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dayEvents = eventsByDate[day.date] || [];
                const isToday = day.date === todayStr;
                const isSelected = day.date === selectedDate;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day.date)}
                    className={`relative min-h-[64px] sm:min-h-[80px] p-1.5 border-b border-r border-gold/10 flex flex-col items-start transition-colors ${
                      isSelected ? 'bg-gold/10' : 'hover:bg-zinc-900/50'
                    } ${!day.isCurrent ? 'opacity-40' : ''}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'w-5 h-5 rounded-full gold-gradient text-black flex items-center justify-center font-bold' : 'text-zinc-300'}`}>
                      {day.day}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-1 w-full">
                      {dayEvents.slice(0, 3).map((e) => {
                        const meta = EVENT_TYPE_META[e.event_type];
                        return (
                          <div key={e.id} className={`text-[9px] sm:text-[10px] truncate px-1 py-0.5 rounded ${meta.bg} ${meta.color} font-medium`}>
                            {e.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-zinc-500 px-1">+{dayEvents.length - 3} altri</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day events */}
          {selectedDate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bebas text-base text-gold tracking-wider capitalize">{formatDateLong(selectedDate)}</h3>
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold/80 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Aggiungi
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <div className="rounded-xl border border-gold/20 bg-zinc-900/30 p-6 text-center">
                  <p className="text-sm text-zinc-500">Nessun evento in questo giorno</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((event) => {
                    const meta = EVENT_TYPE_META[event.event_type];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={event.id}
                        onClick={() => navigate(`/eventi/${event.id}`)}
                        className={`w-full text-left rounded-xl border ${meta.border} ${meta.bg} p-3 hover:scale-[1.01] transition-transform`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bebas uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                              {event.opponent && <span className="text-[10px] text-zinc-500">vs {event.opponent}</span>}
                            </div>
                            <p className="text-sm font-medium text-white mt-0.5">{event.title}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                              {event.time_start && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(event.time_start)}{event.time_end && ` - ${formatTime(event.time_end)}`}
                                </span>
                              )}
                              <span className="text-zinc-600">·</span>
                              <span>{TIME_OF_DAY_META[event.time_of_day].label}</span>
                            </div>
                            {event.location && (
                              <span className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add FAB */}
      {permissions.canManageEvents && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full gold-gradient text-black flex items-center justify-center shadow-lg shadow-gold/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Add modal */}
      {showAdd && (
        <EventForm
          date={selectedDate || todayStr}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); reload(); }}
        />
      )}
    </div>
  );
}

// ─── LIST VIEW ROW ───
function EventListRow({ event, onClick }: { event: TeamEvent; onClick: () => void }) {
  const date = new Date(event.date + 'T00:00:00');
  const day = date.getDate();
  const monthShort = MONTHS_SHORT[date.getMonth()];
  const meta = EVENT_TYPE_META[event.event_type];
  const TypeIcon = meta.icon;
  const timeMeta = TIME_OF_DAY_META[event.time_of_day];
  const TimeIcon = timeMeta.icon;

  const timeDisplay = event.time_start
    ? `${formatTime(event.time_start)}${event.time_end ? ` - ${formatTime(event.time_end)}` : ''}`
    : timeMeta.label;

  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1.5fr_auto] gap-2 sm:gap-4 items-center px-3 sm:px-4 py-2.5 border-b border-gold/10 hover:bg-gold/5 transition-colors text-left"
    >
      {/* Date box */}
      <div className="w-11 h-12 gold-gradient rounded-md flex flex-col items-center justify-center shrink-0">
        <span className="font-bebas text-2xl text-black leading-none">{day}</span>
        <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">{monthShort}</span>
      </div>

      {/* Location (mobile: shown under title) */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <TypeIcon className="w-3.5 h-3.5 text-gold shrink-0 sm:hidden" />
          <span className="text-sm font-medium text-white uppercase truncate">{event.title}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-gold/60 shrink-0" />
          <span className="text-[11px] text-zinc-400 uppercase truncate">{event.location || 'Da definire'}</span>
        </div>
      </div>

      {/* Event type - desktop only */}
      <div className="hidden sm:flex items-center gap-2 min-w-0">
        <div className={`w-7 h-7 rounded-md ${meta.bg} border ${meta.border} flex items-center justify-center shrink-0`}>
          <TypeIcon className={`w-3.5 h-3.5 ${meta.color}`} />
        </div>
        <span className={`text-sm font-medium uppercase truncate ${meta.color}`}>{meta.label}</span>
        {event.opponent && <span className="text-xs text-zinc-500 truncate">vs {event.opponent}</span>}
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 shrink-0">
        <TimeIcon className="w-3.5 h-3.5 text-gold/70" />
        <span className="text-xs text-white uppercase font-medium whitespace-nowrap">{timeDisplay}</span>
      </div>
    </button>
  );
}

// ─── EVENT FORM ───
function EventForm({ date, onClose, onSaved }: { date: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: '',
    event_type: 'allenamento' as EventType,
    date: date,
    meeting_time: '',
    time_start: '',
    time_end: '',
    time_of_day: 'da_definire' as TimeOfDay,
    location: '',
    description: '',
    opponent: '',
  });
  const [recurring, setRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState({
    days_of_week: [1] as number[],
    start_date: date,
    end_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleDay = (day: number) => {
    setRecurrence((prev) => {
      const days = prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort();
      return { ...prev, days_of_week: days };
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('Inserisci un titolo'); return; }
    if (recurring) {
      if (recurrence.days_of_week.length === 0) { setErr('Seleziona almeno un giorno della settimana'); return; }
      if (!recurrence.end_date) { setErr('Inserisci la data di fine'); return; }
      if (!form.time_start || !form.time_end) { setErr('Inserisci orario di inizio e fine'); return; }
      if (recurrence.end_date < recurrence.start_date) { setErr('La data di fine deve essere successiva alla data di inizio'); return; }
    }
    setSaving(true);
    setErr(null);
    try {
      if (recurring) {
        await eventService.createRecurring({
          days_of_week: recurrence.days_of_week,
          time_start: form.time_start,
          time_end: form.time_end,
          start_date: recurrence.start_date,
          end_date: recurrence.end_date,
          meeting_time: form.meeting_time || null,
          location: form.location || null,
          title: form.title.trim(),
          description: form.description || null,
        });
      } else {
        await eventService.create({
          ...form,
          meeting_time: form.meeting_time || null,
          time_start: form.time_start || null,
          time_end: form.time_end || null,
          opponent: form.opponent || null,
          location: form.location || null,
          description: form.description || null,
          status: 'programmato',
        });
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  const recurrenceCount = recurring && recurrence.end_date
    ? countRecurringEvents({
        days_of_week: recurrence.days_of_week,
        time_start: form.time_start,
        time_end: form.time_end,
        start_date: recurrence.start_date,
        end_date: recurrence.end_date,
        meeting_time: form.meeting_time || null,
        location: form.location || null,
        title: form.title,
        description: form.description || null,
      })
    : 0;

  return (
    <Modal open onClose={onClose} title="NUOVO EVENTO">
      <div className="space-y-4">
        <Field label="Titolo">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="es. Allenamento settimanale" className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value as EventType })} className="input">
              {Object.entries(EVENT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Fascia">
            <select value={form.time_of_day} onChange={(e) => setForm({ ...form, time_of_day: e.target.value as TimeOfDay })} className="input">
              {Object.entries(TIME_OF_DAY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
        </div>

        {form.event_type === 'allenamento' && (
          <button
            type="button"
            onClick={() => setRecurring(!recurring)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors text-left ${
              recurring
                ? 'border-gold/50 bg-gold/10'
                : 'border-gold/25 bg-gold/5 hover:bg-gold/10'
            }`}
          >
            <div className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-colors shrink-0 ${
              recurring ? 'gold-gradient' : 'bg-zinc-700'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                recurring ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Repeat className={`w-4 h-4 ${recurring ? 'text-gold' : 'text-gold/60'}`} />
              <div>
                <span className={`text-sm font-bold block ${recurring ? 'text-gold' : 'text-gold/80'}`}>Allenamento ricorrente</span>
                <span className="text-[10px] text-zinc-500">Ripeti automaticamente nei giorni selezionati</span>
              </div>
            </div>
          </button>
        )}

        {recurring ? (
          <div className="space-y-4 p-3 rounded-xl border border-gold/20 bg-zinc-900/50">
            <Field label="Giorni della settimana">
              <div className="flex gap-1.5 flex-wrap">
                {DAY_LABELS_SHORT.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`w-10 h-10 rounded-lg text-xs font-bebas tracking-wide border transition-colors ${
                      recurrence.days_of_week.includes(idx)
                        ? 'gold-gradient text-black border-transparent'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}
                  >
                    {label.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dal">
                <input type="date" value={recurrence.start_date} onChange={(e) => setRecurrence({ ...recurrence, start_date: e.target.value })} className="input" />
              </Field>
              <Field label="Al">
                <input type="date" value={recurrence.end_date} onChange={(e) => setRecurrence({ ...recurrence, end_date: e.target.value })} className="input" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inizio">
                <input type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} className="input" />
              </Field>
              <Field label="Fine">
                <input type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} className="input" />
              </Field>
            </div>
            <Field label="Ritrovo (opzionale)">
              <input type="time" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} className="input" />
            </Field>
            <Field label="Luogo">
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="es. Campo Sportivo Cheraschese, Cherasco" className="input" />
            </Field>
            <Field label="Descrizione">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Note aggiuntive..." rows={2} className="input resize-none" />
            </Field>
            {recurrenceCount > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gold/10 border border-gold/20">
                <CalendarDays className="w-4 h-4 text-gold shrink-0" />
                <span className="text-xs text-gold">Verranno creati <span className="font-bebas text-base">{recurrenceCount}</span> eventi di allenamento</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <Field label="Data">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
            </Field>
            <Field label="Ritrovo">
              <input type="time" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inizio">
                <input type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} className="input" />
              </Field>
              <Field label="Fine">
                <input type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} className="input" />
              </Field>
            </div>
            <Field label="Luogo">
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="es. Campo Sportivo Cheraschese, Cherasco" className="input" />
            </Field>
            {form.event_type === 'partita' && (
              <Field label="Avversario">
                <input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="es. ASD Ciriè" className="input" />
              </Field>
            )}
            <Field label="Descrizione">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Note aggiuntive..." rows={2} className="input resize-none" />
            </Field>
          </>
        )}
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">Annulla</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl gold-gradient text-black text-sm font-bold disabled:opacity-50">
            {saving ? 'Salvataggio...' : recurring ? 'Crea serie' : 'Salva evento'}
          </button>
        </div>
      </div>
      <style>{`.input { width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; color: #fafafa; outline: none; }
      .input:focus { border-color: rgba(212,175,55,0.5); }`}</style>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-400 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
