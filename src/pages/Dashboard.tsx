import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Megaphone, Users, ClipboardList, MapPin, Clock, ChevronRight, Pin, Star, Cake, Check, X, Clock as ClockIcon, ClipboardList as CLIcon, AlertTriangle, XCircle, UserX, CheckCircle, HeartPulse, ShieldCheck, HelpCircle } from 'lucide-react';
import type { TeamEvent, Communication, Player, ConvocazioneWithPlayer, ConvocationSummary, TeamAttendanceStats, AvailabilityByEventItem, AvailabilityWithPlayer, AdminSettings } from '@/types';
import { eventService, communicationService, playerService, convocazioneService, attendanceService, availabilityService, certificateService, settingsService } from '@/services';
import { EVENT_TYPE_META, PRIORITY_META, formatDateLong, formatDayMonth, formatTime, getInitials, ROLE_LABELS, MONTHS_SHORT, isBirthdayToday, getDaysUntilBirthday, CERTIFICATE_STATUS_META, getCertificateStatus, getDaysUntilCertificateExpiry } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useBranding } from '@/hooks/useBranding';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import CherascheseBadge from '@/components/CherascheseBadge';

export default function Dashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { branding } = useBranding();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextEvent, setNextEvent] = useState<TeamEvent | null>(null);
  const [nextEventSummary, setNextEventSummary] = useState<ConvocationSummary | null>(null);
  const [latestComm, setLatestComm] = useState<Communication | null>(null);
  const [birthdays, setBirthdays] = useState<Player[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [teamStats, setTeamStats] = useState<TeamAttendanceStats | null>(null);
  const [upcomingSummaries, setUpcomingSummaries] = useState<{ event: TeamEvent; summary: ConvocationSummary }[]>([]);
  const [availabilityItems, setAvailabilityItems] = useState<AvailabilityByEventItem[]>([]);
  const [availByEvent, setAvailByEvent] = useState<Record<string, AvailabilityWithPlayer[]>>({});
  const [convByEventAlerts, setConvByEventAlerts] = useState<Record<string, ConvocazioneWithPlayer[]>>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [certPlayers, setCertPlayers] = useState<Player[]>([]);
  const [certThreshold, setCertThreshold] = useState(30);

  useEffect(() => {
    (async () => {
      try {
        // Fetch upcoming(3) once — derive next event and summaries from it
        const [upcomingEvents, comms, bdays, upBdays, pCount, tStats, pls, settings, certPlys] = await Promise.all([
          eventService.getUpcoming(3),
          communicationService.getRecent(1),
          playerService.getBirthdaysToday(),
          playerService.getUpcomingBirthdays(30),
          playerService.countActive(),
          attendanceService.getTeamStats(),
          playerService.getActive(),
          settingsService.get(),
          certificateService.getExpiringOrExpired(),
        ]);

        // For parents, prioritize matches/tournaments/retreats over trainings
        const priorityEvents = upcomingEvents.filter((e) => e.event_type === 'partita' || e.event_type === 'torneo' || e.event_type === 'ritiro');
        const nextEv = role === 'parent' ? (priorityEvents[0] || upcomingEvents[0] || null) : (upcomingEvents[0] || null);
        setNextEvent(nextEv);
        setLatestComm(comms[0] || null);
        setBirthdays(bdays);
        setUpcomingBirthdays(upBdays);
        setPlayerCount(pCount);
        setTeamStats(tStats);
        setPlayers(pls);
        setCertThreshold(settings.expiring_soon_threshold);
        setCertPlayers(certPlys);

        // Parallelize all summary fetches
        const summaryPromises = upcomingEvents.map((ev) => convocazioneService.getSummary(ev.id));
        const summaries = await Promise.all(summaryPromises);
        const summaryPairs = upcomingEvents.map((event, i) => ({ event, summary: summaries[i] }));
        setUpcomingSummaries(summaryPairs);

        if (nextEv) {
          const nextSummary = summaryPairs.find((s) => s.event.id === nextEv.id);
          setNextEventSummary(nextSummary ? nextSummary.summary : null);
        }

        // Parallelize convocation + availability fetches
        const trainingEvents = upcomingEvents.filter((e) => e.event_type === 'allenamento');
        const nonTrainingEvents = upcomingEvents.filter((e) => e.event_type !== 'allenamento');

        const parallelPromises: Promise<any>[] = [];
        if (trainingEvents.length > 0) {
          parallelPromises.push(
            convocazioneService.getByEventIds(trainingEvents.map((e) => e.id)).then(setConvByEventAlerts)
          );
        }
        if (role === 'coach' || role === 'manager') {
          parallelPromises.push(
            availabilityService.getUpcomingWithAvailability().then(setAvailabilityItems)
          );
          if (nonTrainingEvents.length > 0) {
            parallelPromises.push(
              availabilityService.getByEventIds(nonTrainingEvents.map((e) => e.id)).then(setAvailByEvent)
            );
          }
        }
        await Promise.all(parallelPromises);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  // Build exception-based alerts for coach/manager — memoized
  // Must be called unconditionally before any early return (Rules of Hooks)
  const { alerts, hasAlerts } = useMemo(() => {
    const result: { type: 'unavailable' | 'absent_training' | 'unmanaged'; event: TeamEvent; players: { name: string; surname: string; id: string; note?: string | null }[] }[] = [];
    if (role === 'coach' || role === 'manager') {
      const today = new Date().toISOString().slice(0, 10);
      for (const item of availabilityItems) {
        const avs = availByEvent[item.event.id] || [];
        const unavailablePlayers = avs
          .filter((a) => a.status === 'non_disponibile')
          .map((a) => ({ name: a.player.name, surname: a.player.surname, id: a.player.id, note: a.note }));
        if (unavailablePlayers.length > 0) {
          result.push({ type: 'unavailable', event: item.event, players: unavailablePlayers });
        }
      }
      for (const { event, summary } of upcomingSummaries) {
        if (event.event_type === 'allenamento' && event.date >= today && summary.declined > 0) {
          const convs = convByEventAlerts[event.id] || [];
          const absentPlayers = convs
            .filter((c) => c.response === 'declinato')
            .map((c) => ({ name: c.player.name, surname: c.player.surname, id: c.player.id }));
          if (absentPlayers.length > 0) {
            result.push({ type: 'absent_training', event, players: absentPlayers });
          }
        }
        if ((event.event_type === 'partita' || event.event_type === 'torneo' || event.event_type === 'ritiro') && event.date >= today && summary.invited === 0) {
          result.push({ type: 'unmanaged', event, players: [] });
        }
      }
    }
    return { alerts: result, hasAlerts: result.length > 0 };
  }, [role, availabilityItems, availByEvent, upcomingSummaries, convByEventAlerts]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full gold-gradient opacity-10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full gold-gradient opacity-5 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <CherascheseBadge size={56} className="drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
          <div>
            <div className="flex items-center gap-1.5">
              <Star className="w-2.5 h-2.5 text-gold fill-gold" />
              <p className="text-[10px] text-gold/70 font-bebas tracking-widest">STAGIONE {branding.season.toUpperCase()}</p>
              <Star className="w-2.5 h-2.5 text-gold fill-gold" />
            </div>
            <h1 className="font-bebas text-3xl gold-text tracking-wide leading-none mt-1">{branding.teamName.toUpperCase()}</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-[0.2em] font-medium mt-0.5">{branding.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Birthdays today */}
      {birthdays.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 overflow-hidden">
          <div className="border-b border-amber-500/20 px-4 py-2.5 bg-amber-500/10">
            <h2 className="font-bebas text-sm text-amber-300 tracking-wider flex items-center gap-1.5">
              <Cake className="w-4 h-4" /> COMPLEANNI OGGI
            </h2>
          </div>
          <div className="p-3 space-y-2">
            {birthdays.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bebas text-amber-300">
                  {getInitials(p.name, p.surname)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Buon Compleanno {p.name}!</p>
                  <p className="text-[10px] text-amber-300/70">{p.name} {p.surname} compie gli anni oggi</p>
                </div>
                <Cake className="w-5 h-5 text-amber-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exception-based alerts — coach/manager only */}
      {(role === 'coach' || role === 'manager') && hasAlerts && (
        <section>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 overflow-hidden">
            <div className="border-b border-rose-500/20 px-4 py-2.5 bg-rose-500/10">
              <h2 className="font-bebas text-sm text-rose-300 tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> ATTENZIONE
              </h2>
            </div>
            <div className="p-3 space-y-2">
              {alerts.map((alert, idx) => {
                const meta = EVENT_TYPE_META[alert.event.event_type];
                const Icon = meta.icon;
                const date = new Date(alert.event.date + 'T00:00:00');
                const day = date.getDate();
                const monthShort = MONTHS_SHORT[date.getMonth()];
                return (
                  <Link
                    key={idx}
                    to={`/eventi/${alert.event.id}`}
                    className="flex items-start gap-3 rounded-xl bg-zinc-900/60 border border-rose-500/20 p-3 hover:border-rose-500/40 transition-colors"
                  >
                    <div className="w-10 h-11 gold-gradient rounded-md flex flex-col items-center justify-center shrink-0">
                      <span className="font-bebas text-lg text-black leading-none">{day}</span>
                      <span className="text-[7px] font-bold text-black/60 uppercase tracking-widest">{monthShort}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3 h-3 ${meta.color}`} />
                        <span className={`text-[9px] font-bebas uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                      </div>
                      <p className="text-xs font-medium text-white truncate mt-0.5">{alert.event.title}</p>
                      {alert.type === 'unavailable' && (
                        <p className="text-[10px] text-rose-300/80 mt-1">
                          Non disponibili: {alert.players.map((p) => p.name).join(', ')}
                        </p>
                      )}
                      {alert.type === 'absent_training' && (
                        <p className="text-[10px] text-rose-300/80 mt-1">
                          Assenti: {alert.players.map((p) => p.name).join(', ')}
                        </p>
                      )}
                      {alert.type === 'unmanaged' && (
                        <p className="text-[10px] text-amber-300/80 mt-1">Convocazioni da creare</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {alert.type === 'unavailable' && <XCircle className="w-4 h-4 text-rose-400" />}
                      {alert.type === 'absent_training' && <UserX className="w-4 h-4 text-rose-400" />}
                      {alert.type === 'unmanaged' && <ClipboardList className="w-4 h-4 text-amber-400" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Medical certificates alert — coach/manager only */}
      {(role === 'coach' || role === 'manager') && certPlayers.length > 0 && (
        <section>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 overflow-hidden">
            <div className="border-b border-rose-500/20 px-4 py-2.5 bg-rose-500/10">
              <h2 className="font-bebas text-sm text-rose-300 tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4" /> CERTIFICATI MEDICI
              </h2>
            </div>
            <div className="p-3 space-y-2">
              {certPlayers.map((p) => {
                const status = getCertificateStatus(p.medical_certificate_date, certThreshold);
                const meta = CERTIFICATE_STATUS_META[status];
                const daysLeft = getDaysUntilCertificateExpiry(p.medical_certificate_date);
                return (
                  <Link
                    key={p.id}
                    to={`/rosa/${p.id}`}
                    className="flex items-center gap-3 rounded-xl bg-zinc-900/60 border border-rose-500/20 p-3 hover:border-rose-500/40 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center shrink-0`}>
                      {status === 'expired' ? <XCircle className={`w-4 h-4 ${meta.color}`} /> : status === 'missing' ? <HelpCircle className={`w-4 h-4 ${meta.color}`} /> : <ShieldCheck className={`w-4 h-4 ${meta.color}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name} {p.surname}</p>
                      <p className={`text-[10px] ${meta.color}`}>
                        {status === 'missing' ? 'Nessun certificato' : status === 'expired' ? `Scaduto da ${Math.abs(daysLeft!)} giorni` : `Scade tra ${daysLeft} giorni`}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bebas tracking-wider ${meta.color} shrink-0`}>{meta.label.toUpperCase()}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* All-clear banner — coach/manager only, when no alerts */}
      {(role === 'coach' || role === 'manager') && !hasAlerts && certPlayers.length === 0 && (
        <section>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-300">Tutto a posto</p>
              <p className="text-[10px] text-emerald-400/60">Nessuna assenza o indisponibilità da segnalare</p>
            </div>
          </div>
        </section>
      )}

      {/* Published convocations — above next event */}
      {(() => {
        const today = new Date().toISOString().slice(0, 10);
        const publishedConvEvents = upcomingSummaries.filter(({ event, summary }) => {
          const needsConv = event.event_type === 'partita' || event.event_type === 'torneo' || event.event_type === 'ritiro';
          return needsConv && event.date >= today && summary.invited > 0;
        });
        if (publishedConvEvents.length === 0) return null;
        return (
          <section>
            <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-4">
              <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5 mb-3">
                <ClipboardList className="w-4 h-4" /> CONVOCAZIONI PUBBLICATE
              </h2>
              <div className="space-y-2">
                {publishedConvEvents.slice(0, 3).map(({ event, summary }) => {
                  const meta = EVENT_TYPE_META[event.event_type];
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={event.id}
                      to={`/eventi/${event.id}`}
                      className="flex items-center gap-3 rounded-xl bg-zinc-900/60 border border-gold/20 p-3 hover:border-gold/50 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{event.title}</p>
                        <p className="text-[10px] text-zinc-500 capitalize">{formatDateLong(event.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bebas text-lg text-gold leading-none">{summary.confirmed}</span>
                        <span className="text-[9px] text-zinc-500 block">CONF.</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gold/60 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Next event */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bebas text-lg text-gold tracking-wider flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> PROSSIMO EVENTO
          </h2>
          <Link to="/calendario" className="text-xs text-gold hover:text-gold/80 flex items-center gap-0.5 font-bebas tracking-wider">
            CALENDARIO <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {nextEvent ? (
          <NextEventCard event={nextEvent} summary={nextEventSummary} onClick={() => navigate(`/eventi/${nextEvent.id}`)} />
        ) : (
          <EmptyState icon={CalendarDays} title="Nessun evento in programma" subtitle="Aggiungi eventi dal calendario" />
        )}
      </section>

      {/* Latest communication — parents only (coaches/managers created it, don't need it highlighted) */}
      {role === 'parent' && latestComm && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bebas text-lg text-gold tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> ULTIMA COMUNICAZIONE
            </h2>
            <Link to="/comunicazioni" className="text-xs text-gold hover:text-gold/80 flex items-center gap-0.5 font-bebas tracking-wider">
              TUTTE <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <Link
            to="/comunicazioni"
            className="block rounded-xl border border-gold/20 bg-zinc-900/50 p-3 hover:border-gold/40 transition-colors"
          >
            <div className="flex items-start gap-2">
              {latestComm.pinned && <Pin className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-bebas px-1.5 py-0.5 rounded ${PRIORITY_META[latestComm.priority].bg} ${PRIORITY_META[latestComm.priority].color} tracking-wider`}>
                  {PRIORITY_META[latestComm.priority].label.toUpperCase()}
                </span>
                <p className="text-sm font-medium text-white mt-1">{latestComm.title}</p>
                <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{latestComm.body}</p>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <section>
          <h2 className="font-bebas text-lg text-gold tracking-wider flex items-center gap-2 mb-3">
            <Cake className="w-4 h-4" /> PROSSIMI COMPLEANNI
          </h2>
          <div className="space-y-2">
            {upcomingBirthdays.slice(0, 3).map((p) => {
              const days = getDaysUntilBirthday(p.birth_date);
              return (
                <Link
                  key={p.id}
                  to={`/rosa/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gold/20 bg-zinc-900/50 p-3 hover:border-gold/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center text-[10px] font-bebas text-gold shrink-0">
                    {getInitials(p.name, p.surname)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name} {p.surname}</p>
                    <p className="text-[10px] text-zinc-500">{formatDayMonth(p.birth_date!)}</p>
                  </div>
                  <span className="text-[10px] text-amber-300 font-bebas tracking-wider shrink-0">
                    {days === 0 ? 'OGGI' : days === 1 ? 'DOMANI' : `${days} GIORNI`}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function NextEventCard({ event, summary, onClick }: { event: TeamEvent; summary: ConvocationSummary | null; onClick: () => void }) {
  const meta = EVENT_TYPE_META[event.event_type];
  const Icon = meta.icon;
  const date = new Date(event.date + 'T00:00:00');
  const day = date.getDate();
  const monthShort = MONTHS_SHORT[date.getMonth()];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border ${meta.border} ${meta.bg} p-4 hover:scale-[1.01] transition-transform`}
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-16 gold-gradient rounded-lg flex flex-col items-center justify-center shrink-0">
          <span className="font-bebas text-3xl text-black leading-none">{day}</span>
          <span className="text-[9px] font-bold text-black/60 uppercase tracking-widest">{monthShort}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${meta.color}`} />
            </div>
            <span className={`text-[10px] font-bebas uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
            {event.opponent && <span className="text-[10px] text-zinc-500">vs {event.opponent}</span>}
          </div>
          <h3 className="text-base font-bold text-white mt-1.5">{event.title}</h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {formatDateLong(event.date)}
            </span>
            {event.time_start && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(event.time_start)}
              </span>
            )}
          </div>
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          )}
          {summary && (
            <div className="flex gap-2 mt-2.5">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bebas tracking-wider">{summary.confirmed} CONF</span>
              {summary.declined > 0 && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bebas tracking-wider">{summary.declined} ASSENTI</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
