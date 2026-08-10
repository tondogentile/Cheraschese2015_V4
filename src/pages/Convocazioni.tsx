import { useEffect, useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, Check, X, Clock, Users, CheckCheck, UserCheck, UserX, Eye, EyeOff, Star } from 'lucide-react';
import type { TeamEvent, Player, ConvocazioneWithPlayer, ConvocationSummary, AvailabilityWithPlayer } from '@/types';
import { eventService, playerService, convocazioneService, availabilityService, isTrainingEvent, requiresConvocations } from '@/services';
import { EVENT_TYPE_META, CONVOCATO_STATUS_META, RESPONSE_META, AVAILABILITY_META, formatDateLong, getInitials, ROLE_LABELS, MONTHS_SHORT } from '@/lib/constants';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import Modal from '@/components/Modal';
import { useAuth } from '@/hooks/useAuth';

export default function Convocazioni() {
  const { role, user } = useAuth();
  const isParent = role === 'parent';
  const childIds = user.player_ids || [];
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [convByEvent, setConvByEvent] = useState<Record<string, ConvocazioneWithPlayer[]>>({});
  const [summaryByEvent, setSummaryByEvent] = useState<Record<string, ConvocationSummary>>({});
  const [loading, setLoading] = useState(true);
  const [showTraining, setShowTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [manageEvent, setManageEvent] = useState<TeamEvent | null>(null);
  const [availByEvent, setAvailByEvent] = useState<Record<string, AvailabilityWithPlayer[]>>({});

  useEffect(() => {
    (async () => {
      try {
        const [evs, pls] = await Promise.all([
          eventService.getUpcoming(),
          playerService.getActive(),
        ]);
        setEvents(evs);
        setPlayers(pls);

        if (evs.length > 0) {
          const needAv = evs.filter((e) => e.event_type !== 'allenamento');
          const [convMap, summaryMap, avMap] = await Promise.all([
            convocazioneService.getByEventIds(evs.map((e) => e.id)),
            (async () => {
              const m: Record<string, ConvocationSummary> = {};
              for (const e of evs) {
                m[e.id] = await convocazioneService.getSummary(e.id);
              }
              return m;
            })(),
            needAv.length > 0 ? availabilityService.getByEventIds(needAv.map((e) => e.id)) : Promise.resolve({} as Record<string, AvailabilityWithPlayer[]>),
          ]);
          setConvByEvent(convMap);
          setSummaryByEvent(summaryMap);
          setAvailByEvent(avMap);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reloadEvent = async (eventId: string) => {
    const [data, summary] = await Promise.all([
      convocazioneService.getByEventId(eventId),
      convocazioneService.getSummary(eventId),
    ]);
    setConvByEvent((prev) => ({ ...prev, [eventId]: data }));
    setSummaryByEvent((prev) => ({ ...prev, [eventId]: summary }));
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bebas text-3xl gold-text tracking-wide">CONVOCAZIONI</h1>
        <p className="text-[10px] text-gold/60 font-bebas tracking-widest mt-0.5">{isParent ? 'CONVOCAZIONI PUBBLICATE' : 'GESTIONE SQUADRA'}</p>
      </div>

      {/* Training toggle — coach/manager only */}
      {!isParent && (
        <button
          onClick={() => setShowTraining(!showTraining)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold/20 bg-zinc-900/50 text-xs font-bebas tracking-wider text-gold/70 hover:text-gold hover:border-gold/40 transition-colors"
        >
          {showTraining ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showTraining ? 'NASCONDI ALLENAMENTI' : 'MOSTRA ALLENAMENTI'}
        </button>
      )}

      {events.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nessun evento futuro" subtitle="Crea eventi dal calendario per gestire le convocazioni" />
      ) : (
        <div className="space-y-3">
          {events.filter((e) => {
            if (isParent) {
              // Parents: only events with published convocations (invited > 0), hide trainings and 0-convocated events
              const summary = summaryByEvent[e.id];
              const needsConv = requiresConvocations(e.event_type);
              return needsConv && summary && summary.invited > 0;
            }
            return showTraining || e.event_type !== 'allenamento';
          }).map((event) => {
            const meta = EVENT_TYPE_META[event.event_type];
            const Icon = meta.icon;
            const convs = convByEvent[event.id] || [];
            const summary = summaryByEvent[event.id];
            const isTraining = isTrainingEvent(event.event_type);
            const needsConv = requiresConvocations(event.event_type);
            const isOpen = expanded === event.id;
            const date = new Date(event.date + 'T00:00:00');
            const day = date.getDate();
            const monthShort = MONTHS_SHORT[date.getMonth()];

            return (
              <div key={event.id} className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : event.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-12 gold-gradient rounded-md flex flex-col items-center justify-center shrink-0">
                      <span className="font-bebas text-2xl text-black leading-none">{day}</span>
                      <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">{monthShort}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${meta.bg} border ${meta.border} flex items-center justify-center`}>
                          <Icon className={`w-3 h-3 ${meta.color}`} />
                        </div>
                        <span className={`text-[10px] font-bebas uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                      </div>
                      <p className="text-sm font-medium text-white mt-0.5">{event.title}</p>
                      <p className="text-xs text-zinc-400 capitalize mt-0.5">{formatDateLong(event.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="font-bebas text-lg text-gold leading-none">
                          {isTraining ? summary?.confirmed : summary?.invited}
                        </p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
                          {isTraining ? 'presenti' : 'convocati'}
                        </p>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gold/60" /> : <ChevronDown className="w-4 h-4 text-gold/60" />}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gold/15 p-3 space-y-3 animate-fade-in">
                    {/* Summary cards with percentages */}
                    {summary && (
                      <div className="grid grid-cols-3 gap-2">
                        {isTraining ? (
                          <>
                            <SummaryCard label="Presenti" value={summary.confirmed} color="text-emerald-400" pct={summary.confirmedPct} />
                            <SummaryCard label="Assenti" value={summary.declined} color="text-rose-400" pct={summary.declinedPct} />
                            <SummaryCard label="Totale" value={summary.invited} color="text-white" />
                          </>
                        ) : (
                          <>
                            <SummaryCard label="Invitati" value={summary.invited} color="text-white" />
                            <SummaryCard label="Confermati" value={summary.confirmed} color="text-emerald-400" pct={summary.confirmedPct} />
                            <SummaryCard label="Assenti" value={summary.declined} color="text-rose-400" pct={summary.declinedPct} />
                          </>
                        )}
                      </div>
                    )}

                    {/* Progress bars */}
                    {summary && !isTraining && summary.invited > 0 && (
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex items-center justify-between text-[9px] mb-0.5">
                            <span className="text-emerald-400 font-bebas tracking-wider">CONFERMATI {summary.confirmedPct}%</span>
                            <span className="text-rose-400 font-bebas tracking-wider">ASSENTI {summary.declinedPct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                            <div className="h-full bg-emerald-500/60 transition-all duration-500" style={{ width: `${summary.confirmedPct}%` }} />
                            <div className="h-full bg-rose-500/60 transition-all duration-500" style={{ width: `${summary.declinedPct}%` }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {convs.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-3">
                        {isTraining ? 'Nessuna presenza registrata' : 'Nessuna convocazione ancora creata'}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {convs.map((c) => {
                          const sm = CONVOCATO_STATUS_META[c.status];
                          const rm = RESPONSE_META[c.response];
                          const isChild = isParent && childIds.includes(c.player_id);
                          return (
                            <div key={c.id} className={`flex items-center gap-2.5 py-1.5 rounded-lg ${isChild ? 'bg-gold/10 border border-gold/30 px-2' : ''}`}>
                              <div className={`w-8 h-8 rounded-full ${isChild ? 'gold-gradient' : 'bg-zinc-900 border border-gold/30'} flex items-center justify-center text-[10px] font-bebas ${isChild ? 'text-black' : 'text-gold'} shrink-0`}>
                                {getInitials(c.player.name, c.player.surname)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className={`text-xs font-medium truncate ${isChild ? 'text-gold' : 'text-white'}`}>{c.player.name} {c.player.surname}</p>
                                  {isChild && <Star className="w-3 h-3 text-gold shrink-0 fill-gold" />}
                                </div>
                                <p className="text-[10px] text-zinc-500 uppercase">{ROLE_LABELS[c.player.role] || c.player.role}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {!isTraining && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${sm.bg} ${sm.color}`}>{sm.label}</span>
                                )}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${rm.bg} ${rm.color} flex items-center gap-0.5`}>
                                  {c.response === 'confermato' && <Check className="w-2.5 h-2.5" />}
                                  {c.response === 'declinato' && <X className="w-2.5 h-2.5" />}
                                  {isTraining ? (c.response === 'confermato' ? 'Presente' : 'Assente') : rm.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Manage button - only for coach/manager on events requiring convocations */}
                    {needsConv && !isParent && (
                      <button
                        onClick={() => setManageEvent(event)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gold/30 text-gold text-xs font-bebas tracking-wider hover:bg-gold/10 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" /> GESTISCI CONVOCAZIONI
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {manageEvent && (
        <ManageConvocazioniModal
          event={manageEvent}
          players={players}
          existing={convByEvent[manageEvent.id] || []}
          availabilities={availByEvent[manageEvent.id] || []}
          onClose={() => setManageEvent(null)}
          onSaved={() => { reloadEvent(manageEvent.id); }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, pct }: { label: string; value: number; color: string; pct?: number }) {
  return (
    <div className="rounded-lg border border-gold/20 bg-zinc-950/80 p-2.5 flex flex-col items-center gap-0.5">
      <span className={`font-bebas text-xl ${color} leading-none`}>{value}</span>
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>
      {pct != null && <span className="text-[8px] text-zinc-600">{pct}%</span>}
    </div>
  );
}

function ManageConvocazioniModal({
  event,
  players,
  existing,
  availabilities,
  onClose,
  onSaved,
}: {
  event: TeamEvent;
  players: Player[];
  existing: ConvocazioneWithPlayer[];
  availabilities: AvailabilityWithPlayer[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [statusMap, setStatusMap] = useState<Record<string, 'convocato' | 'non_convocato' | 'in_dubbio'>>(() => {
    const m: Record<string, 'convocato' | 'non_convocato' | 'in_dubbio'> = {};
    for (const c of existing) m[c.player_id] = c.status;
    return m;
  });
  const [responseMap, setResponseMap] = useState<Record<string, 'confermato' | 'declinato' | 'in_attesa'>>(() => {
    const m: Record<string, 'confermato' | 'declinato' | 'in_attesa'> = {};
    for (const c of existing) m[c.player_id] = c.response;
    return m;
  });
  const [saving, setSaving] = useState(false);

  const togglePlayer = (playerId: string, status: 'convocato' | 'in_dubbio') => {
    setStatusMap((prev) => {
      const next = { ...prev };
      if (next[playerId] === status) {
        delete next[playerId];
      } else {
        next[playerId] = status;
      }
      return next;
    });
  };

  const setResponse = (playerId: string, response: 'confermato' | 'declinato') => {
    setResponseMap((prev) => ({ ...prev, [playerId]: response }));
  };

  const handleSave = async () => {
    setSaving(true);
    const items = Object.entries(statusMap).map(([playerId, status]) => ({
      player_id: playerId,
      status,
      response: responseMap[playerId] || ('confermato' as const),
    }));
    await convocazioneService.replaceForEvent(event.id, items);
    setSaving(false);
    onSaved();
    onClose();
  };

  const convocatiCount = Object.values(statusMap).filter((s) => s === 'convocato').length;

  return (
    <Modal open onClose={onClose} title={`CONVOCAZIONI - ${event.title.toUpperCase()}`}>
      <div className="space-y-4">
        <div className="rounded-xl border border-gold/20 bg-zinc-900/50 p-3">
          <p className="text-xs text-zinc-400 capitalize">{formatDateLong(event.date)}</p>
          <p className="text-sm text-white mt-0.5"><span className="font-bebas text-lg text-gold">{convocatiCount}</span> giocatori convocati</p>
        </div>

        {event.event_type !== 'allenamento' && availabilities.length > 0 && (
          <div className="rounded-xl border border-gold/15 bg-gold/5 p-3">
            <p className="text-[10px] text-gold/70 uppercase tracking-wider mb-2">Riepilogo disponibilità</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <span className="font-bebas text-lg text-emerald-400 leading-none">{players.filter((p) => p.active && !availabilities.find((a) => a.player_id === p.id && a.status === 'non_disponibile')).length}</span>
                <span className="text-[8px] text-zinc-500 block uppercase">Disponib.</span>
              </div>
              <div className="text-center">
                <span className="font-bebas text-lg text-rose-400 leading-none">{availabilities.filter((a) => a.status === 'non_disponibile').length}</span>
                <span className="text-[8px] text-zinc-500 block uppercase">Non disp.</span>
              </div>
            </div>
          </div>
        )}

        <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
          {players.map((player) => {
            const status = statusMap[player.id];
            const response = responseMap[player.id];
            return (
              <div key={player.id} className={`rounded-lg border p-2.5 transition-colors ${
                status === 'convocato' ? 'border-emerald-500/30 bg-emerald-500/5' :
                status === 'in_dubbio' ? 'border-gold/30 bg-gold/5' :
                'border-zinc-800 bg-zinc-900/30'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center text-[10px] font-bebas text-gold shrink-0">
                    {getInitials(player.name, player.surname)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{player.name} {player.surname}</p>
                    <div className="flex items-center gap-1.5">
                      {player.number != null && <p className="text-[10px] text-zinc-500">N° {player.number}</p>}
                      {(() => {
                        const av = availabilities.find((a) => a.player_id === player.id);
                        if (!av || event.event_type === 'allenamento') return null;
                        const am = AVAILABILITY_META[av.status];
                        return (
                          <span className={`text-[8px] px-1 py-0.5 rounded ${am.bg} ${am.color}`}>{am.label}</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={() => togglePlayer(player.id, 'convocato')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bebas tracking-wider transition-colors ${
                      status === 'convocato' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-transparent'
                    }`}
                  >
                    CONVOCATO
                  </button>
                  <button
                    onClick={() => togglePlayer(player.id, 'in_dubbio')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bebas tracking-wider transition-colors ${
                      status === 'in_dubbio' ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-zinc-800 text-zinc-400 border border-transparent'
                    }`}
                  >
                    IN DUBBIO
                  </button>
                </div>
                {status === 'convocato' && (
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      onClick={() => setResponse(player.id, 'confermato')}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1 ${
                        response === 'confermato' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-800/50 text-zinc-500'
                      }`}
                    >
                      <Check className="w-3 h-3" /> Confermato
                    </button>
                    <button
                      onClick={() => setResponse(player.id, 'declinato')}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-colors flex items-center justify-center gap-1 ${
                        response === 'declinato' ? 'bg-rose-500/15 text-rose-300' : 'bg-zinc-800/50 text-zinc-500'
                      }`}
                    >
                      <X className="w-3 h-3" /> Non disponibile
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800">Annulla</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl gold-gradient text-black text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
            <CheckCheck className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salva'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
