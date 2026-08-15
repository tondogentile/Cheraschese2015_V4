import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, TrendingUp, AlertTriangle, UserX, Clock, Check, X, ChevronRight, BarChart3, ClipboardList, Filter, CalendarOff, ChevronRight as CR } from 'lucide-react';
import type { TeamAttendanceStats, AttendanceByEvent, AttendanceByPlayer, CoachAttendanceAlerts, PlannedAbsenceWithPlayer, TeamEvent, ConvocazioneWithPlayer } from '@/types';
import { attendanceService, eventService, absenceService, convocazioneService, playerService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { EVENT_TYPE_META, formatDateLong, getInitials, ROLE_LABELS, MONTHS_SHORT, MONTHS, ABSENCE_REASON_META } from '@/lib/constants';
import { Loading, ErrorState, EmptyState } from '@/components/States';

type Tab = 'event' | 'player' | 'team' | 'coach' | 'absences';

export default function Attendance() {
  const navigate = useNavigate();
  const { role, user, permissions } = useAuth();
  const isParent = role === 'parent';

  // Parent state
  const [parentEvents, setParentEvents] = useState<TeamEvent[]>([]);
  const [parentPlayerId, setParentPlayerId] = useState<string | null>(null);
  const [parentConvs, setParentConvs] = useState<Record<string, ConvocazioneWithPlayer | null>>({});
  const [parentLoading, setParentLoading] = useState(true);

  // Coach/manager state
  const [tab, setTab] = useState<Tab>('event');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamStats, setTeamStats] = useState<TeamAttendanceStats | null>(null);
  const [byEvent, setByEvent] = useState<AttendanceByEvent[]>([]);
  const [byPlayer, setByPlayer] = useState<AttendanceByPlayer[]>([]);
  const [coachAlerts, setCoachAlerts] = useState<CoachAttendanceAlerts | null>(null);
  const [absences, setAbsences] = useState<PlannedAbsenceWithPlayer[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (isParent) {
      (async () => {
        try {
          const playerId = user.player_ids?.[0] || null;
          setParentPlayerId(playerId);
          const events = await eventService.getUpcoming();
          setParentEvents(events);
          if (playerId && events.length > 0) {
            const convMaps = await convocazioneService.getByEventIds(events.map((e) => e.id));
            const convMap: Record<string, ConvocazioneWithPlayer | null> = {};
            for (const ev of events) {
              const convs = convMaps[ev.id] || [];
              convMap[ev.id] = convs.find((c) => c.player_id === playerId) || null;
            }
            setParentConvs(convMap);
          }
        } catch (e: any) {
          setError(e.message);
        } finally {
          setParentLoading(false);
        }
      })();
    } else {
      (async () => {
        try {
          const events = await eventService.getAll();
          const months = [...new Set(events.map((e) => e.date.slice(0, 7)))].sort();
          setAvailableMonths(months);
          const [team, eventView, playerView, alerts, activeAbsences] = await Promise.all([
            attendanceService.getTeamStats(),
            attendanceService.getAttendanceByEvent(undefined, undefined, undefined),
            attendanceService.getAttendanceByPlayer(undefined, undefined),
            attendanceService.getCoachAlerts(),
            absenceService.getActive(),
          ]);
          setTeamStats(team);
          setByEvent(eventView);
          setByPlayer(playerView);
          setCoachAlerts(alerts);
          setAbsences(activeAbsences);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  const applyFilters = async () => {
    const m = monthFilter === 'all' ? undefined : monthFilter;
    const t = typeFilter === 'all' ? undefined : typeFilter;
    const [eventView, playerView] = await Promise.all([
      attendanceService.getAttendanceByEvent(undefined, m, t),
      attendanceService.getAttendanceByPlayer(m, t),
    ]);
    setByEvent(eventView);
    setByPlayer(playerView);
  };

  useEffect(() => { if (!isParent) applyFilters(); }, [monthFilter, typeFilter]);

  const handleParentResponse = async (eventId: string, response: 'confermato' | 'declinato') => {
    if (!parentPlayerId) return;
    const conv = parentConvs[eventId];
    if (conv) {
      await convocazioneService.setResponse(conv.id, response);
    } else {
      await convocazioneService.setPlayerResponseForEvent(eventId, parentPlayerId, response);
    }
    // Update local state
    setParentConvs((prev) => ({
      ...prev,
      [eventId]: prev[eventId] ? { ...prev[eventId]!, response } : null,
    }));
  };

  if (isParent) {
    if (parentLoading) return <Loading />;
    if (error) return <ErrorState message={error} />;
    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-bebas text-3xl gold-text tracking-wide">PRESENZE</h1>
          <p className="text-[10px] text-gold/60 font-bebas tracking-widest mt-0.5">LE TUE PRESENZE</p>
        </div>
        {!parentPlayerId ? (
          <EmptyState icon={Users} title="Nessun giocatore associato" subtitle="Contatta il dirigente per associare il tuo profilo" />
        ) : parentEvents.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nessun evento futuro" />
        ) : (
          <div className="space-y-3">
            {parentEvents.map((event) => {
              const meta = EVENT_TYPE_META[event.event_type];
              const Icon = meta.icon;
              const date = new Date(event.date + 'T00:00:00');
              const day = date.getDate();
              const monthShort = MONTHS_SHORT[date.getMonth()];
              const conv = parentConvs[event.id];
              const currentResponse = conv?.response || 'confermato';
              return (
                <div key={event.id} className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>
                  <button onClick={() => navigate(`/eventi/${event.id}`)} className="w-full text-left p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-12 gold-gradient rounded-md flex flex-col items-center justify-center shrink-0">
                        <span className="font-bebas text-2xl text-black leading-none">{day}</span>
                        <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">{monthShort}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                          <span className={`text-[10px] font-bebas uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                        </div>
                        <p className="text-sm font-medium text-white mt-0.5">{event.title}</p>
                        <p className="text-xs text-zinc-400 capitalize mt-0.5">{formatDateLong(event.date)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                    </div>
                  </button>
                  <div className="border-t border-gold/15 px-3 py-2.5">
                    <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider font-bebas">
                      La tua risposta:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleParentResponse(event.id, 'confermato')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bebas tracking-wider flex items-center justify-center gap-1 transition-colors ${
                          currentResponse === 'confermato' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> PRESENTE
                      </button>
                      <button
                        onClick={() => handleParentResponse(event.id, 'declinato')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bebas tracking-wider flex items-center justify-center gap-1 transition-colors ${
                          currentResponse === 'declinato' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-zinc-800 text-zinc-400 border border-transparent'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> ASSENTE
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Coach / Manager view
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'event', label: 'Per Evento', icon: CalendarDays },
    { key: 'player', label: 'Per Giocatore', icon: Users },
    { key: 'team', label: 'Squadra', icon: BarChart3 },
    { key: 'absences', label: 'Assenze', icon: CalendarOff },
  ];
  if (role === 'coach' || role === 'manager') {
    tabs.push({ key: 'coach', label: 'Allerte', icon: AlertTriangle });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bebas text-3xl gold-text tracking-wide">PRESENZE</h1>
        <p className="text-[10px] text-gold/60 font-bebas tracking-widest mt-0.5">GESTIONE PARTECIPAZIONE</p>
      </div>

      <div className="flex gap-1 bg-zinc-900/80 border border-gold/20 rounded-xl p-1 overflow-x-auto no-scrollbar">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bebas tracking-wider whitespace-nowrap transition-colors ${
              tab === key ? 'bg-gold/15 text-gold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label.toUpperCase()}
          </button>
        ))}
      </div>

      {(tab === 'event' || tab === 'player') && (
        <div className="flex gap-2 items-center">
          <Filter className="w-3.5 h-3.5 text-gold/60 shrink-0" />
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="bg-zinc-900 border border-gold/20 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50">
            <option value="all">Tutti i mesi</option>
            {availableMonths.map((m) => { const [y, mo] = m.split('-'); return <option key={m} value={m}>{MONTHS[parseInt(mo) - 1]} {y}</option>; })}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-zinc-900 border border-gold/20 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-gold/50">
            <option value="all">Tutti i tipi</option>
            {Object.entries(EVENT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}

      {tab === 'event' && <EventView data={byEvent} onEventClick={(id) => navigate(`/eventi/${id}`)} />}
      {tab === 'player' && <PlayerView data={byPlayer} onPlayerClick={(id) => navigate(`/rosa/${id}`)} />}
      {tab === 'team' && teamStats && <TeamView stats={teamStats} />}
      {tab === 'absences' && <AbsencesView absences={absences} onPlayerClick={(id) => navigate(`/rosa/${id}`)} />}
      {tab === 'coach' && coachAlerts && <CoachView alerts={coachAlerts} onEventClick={(id) => navigate(`/eventi/${id}`)} onPlayerClick={(id) => navigate(`/rosa/${id}`)} />}
    </div>
  );
}

function EventView({ data, onEventClick }: { data: AttendanceByEvent[]; onEventClick: (id: string) => void }) {
  if (data.length === 0) return <EmptyState icon={CalendarDays} title="Nessun evento trovato" subtitle="Prova a cambiare i filtri" />;
  return (
    <div className="space-y-3">
      {data.map(({ event, summary, records }) => {
        const meta = EVENT_TYPE_META[event.event_type];
        const Icon = meta.icon;
        const date = new Date(event.date + 'T00:00:00');
        const day = date.getDate();
        const monthShort = MONTHS_SHORT[date.getMonth()];
        const isTraining = event.event_type === 'allenamento';
        return (
          <div key={event.id} className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>
            <button onClick={() => onEventClick(event.id)} className="w-full text-left p-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-12 gold-gradient rounded-md flex flex-col items-center justify-center shrink-0">
                  <span className="font-bebas text-2xl text-black leading-none">{day}</span>
                  <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">{monthShort}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                    <span className={`text-[10px] font-bebas uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                  </div>
                  <p className="text-sm font-medium text-white mt-0.5">{event.title}</p>
                  <p className="text-xs text-zinc-400 capitalize mt-0.5">{formatDateLong(event.date)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
              </div>
            </button>
            <div className="border-t border-gold/15 px-3 py-2">
              {isTraining ? (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <MiniStat label="Totali" value={summary.invited} color="text-white" />
                  <MiniStat label="Presenti" value={summary.confirmed} color="text-emerald-400" pct={summary.confirmedPct} />
                  <MiniStat label="Assenti" value={summary.declined} color="text-rose-400" pct={summary.declinedPct} />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <MiniStat label="Invitati" value={summary.invited} color="text-white" />
                  <MiniStat label="Conf." value={summary.confirmed} color="text-emerald-400" pct={summary.confirmedPct} />
                  <MiniStat label="Decl." value={summary.declined} color="text-rose-400" pct={summary.declinedPct} />
                </div>
              )}
              {summary.invited > 0 && (
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden flex">
                  <div className="h-full bg-emerald-500/60" style={{ width: `${summary.confirmedPct}%` }} />
                  <div className="h-full bg-rose-500/60" style={{ width: `${summary.declinedPct}%` }} />
                </div>
              )}
            </div>
            {records.length > 0 && (
              <div className="border-t border-gold/10 divide-y divide-gold/5">
                {records.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-gold/20 flex items-center justify-center text-[9px] font-bebas text-gold shrink-0">
                      {getInitials(c.player.name, c.player.surname)}
                    </div>
                    <span className="text-xs text-zinc-300 flex-1 truncate">{c.player.name} {c.player.surname}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 ${
                      c.response === 'confermato' ? 'bg-emerald-500/15 text-emerald-300' :
                      'bg-rose-500/15 text-rose-300'
                    }`}>
                      {c.response === 'confermato' && <Check className="w-2.5 h-2.5" />}
                      {c.response === 'declinato' && <X className="w-2.5 h-2.5" />}
                    </span>
                  </div>
                ))}
                {records.length > 6 && <div className="px-3 py-1.5 text-[10px] text-zinc-500 text-center">+{records.length - 6} altri</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlayerView({ data, onPlayerClick }: { data: AttendanceByPlayer[]; onPlayerClick: (id: string) => void }) {
  if (data.length === 0) return <EmptyState icon={Users} title="Nessun giocatore trovato" />;
  return (
    <div className="space-y-2">
      {data.map(({ player, detail }) => (
        <button key={player.id} onClick={() => onPlayerClick(player.id)} className="w-full text-left rounded-xl border border-gold/20 bg-zinc-900/50 p-3 hover:border-gold/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center font-bebas text-sm text-gold shrink-0">
              {getInitials(player.name, player.surname)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{player.name} {player.surname}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{ROLE_LABELS[player.role] || player.role}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-bebas text-xl ${detail.rate >= 75 ? 'text-emerald-400' : detail.rate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{detail.rate}%</span>
              <div className="flex gap-1.5 mt-0.5">
                <span className="text-[9px] text-emerald-400">{detail.present}P</span>
                <span className="text-[9px] text-rose-400">{detail.absent}A</span>
              </div>
            </div>
          </div>
          {detail.total > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden flex">
              <div className="h-full bg-emerald-500/60" style={{ width: `${(detail.present / detail.total) * 100}%` }} />
              <div className="h-full bg-rose-500/60" style={{ width: `${(detail.absent / detail.total) * 100}%` }} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function TeamView({ stats }: { stats: TeamAttendanceStats }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
        <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
          <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> MEDIA SQUADRA</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Tasso presenze medio</span>
            <span className="font-bebas text-3xl gold-text">{stats.averageRate}%</span>
          </div>
          <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full gold-gradient rounded-full transition-all duration-700" style={{ width: `${stats.averageRate}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <MiniStat label="Presenti" value={stats.totalPresent} color="text-emerald-400" />
            <MiniStat label="Assenti" value={stats.totalAbsent} color="text-rose-400" />
          </div>
        </div>
      </div>
      {stats.monthlyTrend.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> TREND MENSILE</h2>
          </div>
          <div className="p-4">
            <div className="flex items-end justify-between gap-2 h-32">
              {stats.monthlyTrend.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-zinc-500 font-bebas">{m.rate}%</span>
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t gold-gradient transition-all duration-700" style={{ height: `${Math.max(m.rate, 2)}%`, minHeight: '4px' }} />
                  </div>
                  <span className="text-[9px] text-zinc-400 font-bebas tracking-wider">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {stats.mostPresent.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> PIU' PRESENTI</h2>
          </div>
          <div className="divide-y divide-gold/10">
            {stats.mostPresent.map(({ player, rate, present }, idx) => (
              <div key={player.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="font-bebas text-lg text-gold/60 w-5">{idx + 1}</span>
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center text-[10px] font-bebas text-gold shrink-0">{getInitials(player.name, player.surname)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{player.name} {player.surname}</p><p className="text-[10px] text-zinc-500">{present} presenze</p></div>
                <span className="font-bebas text-lg text-emerald-400">{rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AbsencesView({ absences, onPlayerClick }: { absences: PlannedAbsenceWithPlayer[]; onPlayerClick: (id: string) => void }) {
  if (absences.length === 0) return <EmptyState icon={CalendarOff} title="Nessuna assenza programmata" subtitle="Tutti i giocatori sono disponibili" />;
  return (
    <div className="space-y-2">
      {absences.map((a) => {
        const meta = ABSENCE_REASON_META[a.reason];
        const Icon = meta.icon;
        const isRange = a.start_date !== a.end_date;
        return (
          <button key={a.id} onClick={() => onPlayerClick(a.player_id)} className="w-full text-left rounded-xl border border-gold/20 bg-zinc-900/50 p-3 hover:border-gold/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center font-bebas text-sm text-gold shrink-0">{getInitials(a.player.name, a.player.surname)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{a.player.name} {a.player.surname}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} flex items-center gap-0.5`}><Icon className="w-2.5 h-2.5" /> {meta.label.toUpperCase()}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-zinc-400">{isRange ? 'Dal' : 'Il'} {formatDateLong(a.start_date)}</p>
                {isRange && <p className="text-[10px] text-zinc-500">al {formatDateLong(a.end_date)}</p>}
              </div>
            </div>
            {a.notes && <p className="text-[10px] text-zinc-500 mt-2 pl-13">{a.notes}</p>}
          </button>
        );
      })}
    </div>
  );
}

function CoachView({ alerts, onEventClick, onPlayerClick }: { alerts: CoachAttendanceAlerts; onEventClick: (id: string) => void; onPlayerClick: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
        <div className="border-b border-amber-500/20 px-4 py-2.5 bg-amber-500/10"><h2 className="font-bebas text-sm text-amber-300 tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> CONFERME MANCANTI</h2></div>
        {alerts.missingConfirmations.length === 0 ? <div className="px-4 py-6 text-center"><p className="text-sm text-zinc-500">Nessuna conferma in attesa</p></div> : (
          <div className="divide-y divide-amber-500/10">
            {alerts.missingConfirmations.slice(0, 10).map((mc, idx) => (
              <button key={idx} onClick={() => onEventClick(mc.eventId)} className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-amber-500/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-amber-500/30 flex items-center justify-center text-[10px] font-bebas text-amber-300 shrink-0">{getInitials(mc.player.name, mc.player.surname)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{mc.player.name} {mc.player.surname}</p><p className="text-[10px] text-zinc-500 truncate">{mc.eventName} - {formatDateLong(mc.eventDate)}</p></div>
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </button>
            ))}
            {alerts.missingConfirmations.length > 10 && <div className="px-4 py-2 text-[10px] text-zinc-500 text-center">+{alerts.missingConfirmations.length - 10} altri</div>}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 overflow-hidden">
        <div className="border-b border-rose-500/20 px-4 py-2.5 bg-rose-500/10"><h2 className="font-bebas text-sm text-rose-300 tracking-wider flex items-center gap-1.5"><UserX className="w-3.5 h-3.5" /> ASSENZE FREQUENTI</h2></div>
        {alerts.frequentAbsences.length === 0 ? <div className="px-4 py-6 text-center"><p className="text-sm text-zinc-500">Nessuna assenza frequente</p></div> : (
          <div className="divide-y divide-rose-500/10">
            {alerts.frequentAbsences.map(({ player, absentCount, totalEvents, rate }) => (
              <button key={player.id} onClick={() => onPlayerClick(player.id)} className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-rose-500/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-rose-500/30 flex items-center justify-center text-[10px] font-bebas text-rose-300 shrink-0">{getInitials(player.name, player.surname)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{player.name} {player.surname}</p><p className="text-[10px] text-zinc-500">{absentCount} assenze su {totalEvents} eventi</p></div>
                <span className="font-bebas text-lg text-rose-400">{rate}%</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 overflow-hidden">
        <div className="border-b border-sky-500/20 px-4 py-2.5 bg-sky-500/10"><h2 className="font-bebas text-sm text-sky-300 tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> INDISPONIBILI PROSSIMI EVENTI</h2></div>
        {alerts.unavailableNext.length === 0 ? <div className="px-4 py-6 text-center"><p className="text-sm text-zinc-500">Nessun giocatore indisponibile</p></div> : (
          <div className="divide-y divide-sky-500/10">
            {alerts.unavailableNext.map((u, idx) => (
              <button key={idx} onClick={() => onEventClick(u.eventId)} className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-sky-500/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-sky-500/30 flex items-center justify-center text-[10px] font-bebas text-sky-300 shrink-0">{getInitials(u.player.name, u.player.surname)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{u.player.name} {u.player.surname}</p><p className="text-[10px] text-zinc-500 truncate">{u.eventName}</p></div>
                <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, pct }: { label: string; value: number; color: string; pct?: number }) {
  return (
    <div className="text-center">
      <span className={`font-bebas text-lg ${color} leading-none block`}>{value}</span>
      <span className="text-[8px] text-zinc-500 uppercase tracking-wider">{label}</span>
      {pct != null && <span className="text-[8px] text-zinc-600 block">{pct}%</span>}
    </div>
  );
}
