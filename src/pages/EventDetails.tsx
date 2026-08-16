import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, FileText, Users, Check, X, Clock as ClockIcon, Navigation, Star, Trash2, Pencil, Flag, UserCheck, UserX, Repeat, AlertTriangle, CalendarOff, Sparkles, CheckCircle } from 'lucide-react';
import type { TeamEvent, ConvocazioneWithPlayer, ConvocationSummary, EventType, TimeOfDay, EditScope, DeleteScope, ExceptionType, AvailabilityWithPlayer, AvailabilitySummary, Player } from '@/types';
import { eventService, convocazioneService, availabilityService, playerService, isTrainingEvent, requiresConvocations, requiresAvailability } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { EVENT_TYPE_META, EVENT_STATUS_META, TIME_OF_DAY_META, CONVOCATO_STATUS_META, RESPONSE_META, AVAILABILITY_META, formatDateLong, formatTime, getInitials, ROLE_LABELS, MONTHS_SHORT } from '@/lib/constants';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import Modal from '@/components/Modal';

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permissions, user } = useAuth();
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [convs, setConvs] = useState<ConvocazioneWithPlayer[]>([]);
  const [summary, setSummary] = useState<ConvocationSummary | null>(null);
  const [availabilities, setAvailabilities] = useState<AvailabilityWithPlayer[]>([]);
  const [availSummary, setAvailSummary] = useState<AvailabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editScope, setEditScope] = useState<EditScope>('single');
  const [deleteScope, setDeleteScope] = useState<DeleteScope>('single');
  const [showException, setShowException] = useState(false);
  const [parentPlayers, setParentPlayers] = useState<Player[]>([]);

  const isParent = user.role === 'parent';
  const parentPlayerIds = isParent ? (user.player_ids || []) : [];

  const load = async () => {
    if (!id) return;
    try {
      const [ev, cv, sm] = await Promise.all([
        eventService.getById(id),
        convocazioneService.getByEventId(id),
        convocazioneService.getSummary(id),
      ]);
      if (!ev) { setError('Evento non trovato'); return; }
      setEvent(ev);
      setConvs(cv);
      setSummary(sm);
      if (isParent && parentPlayerIds.length > 0) {
        const players: Player[] = [];
        for (const pid of parentPlayerIds) {
          const p = await playerService.getById(pid);
          if (p) players.push(p);
        }
        setParentPlayers(players);
      }
      if (requiresAvailability(ev.event_type)) {
        const [avs, avSum] = await Promise.all([
          availabilityService.getByEventId(id),
          availabilityService.getSummary(id),
        ]);
        setAvailabilities(avs);
        setAvailSummary(avSum);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!event) return;
    if (event.series_id && deleteScope !== 'single') {
      await eventService.removeWithScope(event.id, deleteScope);
    } else {
      await eventService.remove(event.id);
    }
    navigate('/calendario');
  };

  const handleException = async (exceptionType: ExceptionType, data: Partial<TeamEvent>) => {
    if (!event) return;
    await eventService.createException(event.id, exceptionType, data);
    setShowException(false);
    load();
  };

  const handleResponse = async (convId: string, response: 'confermato' | 'declinato') => {
    await convocazioneService.setResponse(convId, response);
    load();
  };

  const handleSetAvailability = async (playerId: string, status: 'disponibile' | 'non_disponibile') => {
    if (!id) return;
    await availabilityService.setAvailability(id, playerId, status);
    load();
  };

  const handleParentPresenceResponse = async (playerId: string, response: 'confermato' | 'declinato') => {
    if (!event) return;
    const existing = convs.find((c) => c.player_id === playerId);
    if (existing) {
      await convocazioneService.setResponse(existing.id, response);
    } else {
      await convocazioneService.setPlayerResponseForEvent(event.id, playerId, response);
    }
    load();
  };

  const needsAvailabilityTracking = event ? requiresAvailability(event.event_type) : false;
  const hasConvocations = convs.length > 0;

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!event) return <ErrorState message="Evento non trovato" />;

  const meta = EVENT_TYPE_META[event.event_type];
  const TypeIcon = meta.icon;
  const statusMeta = EVENT_STATUS_META[event.status];
  const date = new Date(event.date + 'T00:00:00');
  const day = date.getDate();
  const monthShort = MONTHS_SHORT[date.getMonth()];
  const isTraining = isTrainingEvent(event.event_type);
  const needsConvocations = requiresConvocations(event.event_type);

  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  const convocati = convs.filter((c) => c.status === 'convocato');
  const confirmed = convs.filter((c) => c.status === 'convocato' && c.response === 'confermato').length;
  const absent = convs.filter((c) => c.status === 'convocato' && c.response === 'declinato').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/calendario')}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Torna al calendario
        </button>
        {permissions.canManageEvents && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gold/30 text-gold text-xs font-bebas tracking-wider hover:bg-gold/10 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> MODIFICA
            </button>
            {event.series_id && (
              <button
                onClick={() => setShowException(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 text-xs font-bebas tracking-wider hover:bg-amber-500/10 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> ECCEZIONE
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-bebas tracking-wider hover:text-rose-400 hover:border-rose-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> ELIMINA
            </button>
          </div>
        )}
      </div>

      {/* Event header card */}
      <div className={`rounded-2xl border ${meta.border} ${meta.bg} overflow-hidden`}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-16 gold-gradient rounded-lg flex flex-col items-center justify-center shrink-0">
              <span className="font-bebas text-3xl text-black leading-none">{day}</span>
              <span className="text-[9px] font-bold text-black/60 uppercase tracking-widest">{monthShort}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`w-7 h-7 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center`}>
                  <TypeIcon className={`w-4 h-4 ${meta.color}`} />
                </div>
                <span className={`font-bebas text-sm tracking-wider ${meta.color}`}>{meta.label.toUpperCase()}</span>
                <span className={`text-[10px] font-bebas px-2 py-0.5 rounded-full border ${statusMeta.border} ${statusMeta.bg} ${statusMeta.color} tracking-wider`}>
                  {statusMeta.label.toUpperCase()}
                </span>
                {event.series_id && (
                  <span className="text-[10px] font-bebas px-2 py-0.5 rounded-full border border-gold/30 bg-gold/10 text-gold tracking-wider flex items-center gap-0.5">
                    <Repeat className="w-2.5 h-2.5" /> SERIE
                  </span>
                )}
                {event.is_exception && event.exception_type && (
                  <span className="text-[10px] font-bebas px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 tracking-wider flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> {EXCEPTION_META[event.exception_type].label.toUpperCase()}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white mt-2">{event.title}</h1>
              {event.opponent && (
                <p className="text-sm text-zinc-400 mt-0.5 flex items-center gap-1">
                  <Star className="w-3 h-3 text-gold/60" /> vs {event.opponent}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
        <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
          <h2 className="font-bebas text-sm text-gold tracking-wider">DETTAGLI</h2>
        </div>
        <div className="divide-y divide-gold/10">
          <InfoRow icon={CalendarDays} label="Data" value={formatDateLong(event.date)} />
          {event.meeting_time && (
            <InfoRow icon={Users} label="Ritrovo" value={formatTime(event.meeting_time)} highlight />
          )}
          {event.time_start && (
            <InfoRow icon={Flag} label="Inizio" value={formatTime(event.time_start)} />
          )}
          {event.time_end && (
            <InfoRow icon={Clock} label="Fine" value={formatTime(event.time_end)} />
          )}
          <InfoRow icon={TIME_OF_DAY_META[event.time_of_day].icon} label="Fascia" value={TIME_OF_DAY_META[event.time_of_day].label} />
          {event.location && <InfoRow icon={MapPin} label="Luogo" value={event.location} />}
        </div>
      </div>

      {/* Google Maps button */}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gold-gradient text-black text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Navigation className="w-4 h-4" /> Apri in Google Maps
        </a>
      )}

      {/* Notes */}
      {event.description && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> NOTE
            </h2>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>
      )}

      {/* Parent: Presenza figli section */}
      {isParent && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> PRESENZA FIGLI
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Indica se tuo figlio sarà presente o assente a questo evento.</p>
            {parentPlayers.length === 0 ? (
              <EmptyState icon={Users} title="Nessun giocatore associato" subtitle="Contatta il dirigente per associare il tuo profilo" />
            ) : (
              parentPlayers.map((child) => {
                const childConv = convs.find((c) => c.player_id === child.id);
                const currentResponse = childConv?.response || 'confermato';
                return (
                  <div key={child.id} className="rounded-xl border border-gold/20 bg-zinc-900/50 p-3">
                    <p className="text-sm font-medium text-white mb-2">{child.name} {child.surname}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleParentPresenceResponse(child.id, 'confermato')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bebas tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                          currentResponse === 'confermato' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> PRESENTE
                      </button>
                      <button
                        onClick={() => handleParentPresenceResponse(child.id, 'declinato')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bebas tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                          currentResponse === 'declinato' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-zinc-800 text-zinc-400 border border-transparent'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> ASSENTE
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Availability section — shown for matches, tournaments, retreats (staff only) */}
      {needsAvailabilityTracking && event && !isParent && (
        <AvailabilitySection
          event={event}
          availabilities={availabilities}
          availSummary={availSummary}
          hasConvocations={hasConvocations}
          convs={convs}
          parentPlayerIds={parentPlayerIds}
          canManage={permissions.canManageConvocations}
          onSetAvailability={handleSetAvailability}
        />
      )}

      {/* Convocation stats — staff only */}
      {!isParent && (
      <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
        <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5 flex items-center justify-between">
          <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5">
            {isTraining ? <UserCheck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            {isTraining ? 'PRESENZE' : 'CONVOCAZIONI'}
          </h2>
          {permissions.canManageConvocations && needsConvocations && (
            <Link to="/convocazioni" className="text-[10px] text-gold/70 hover:text-gold font-bebas tracking-wider">
              GESTISCI →
            </Link>
          )}
        </div>

        {/* Stats grid */}
        {isTraining ? (
          <div className="grid grid-cols-2 gap-px bg-gold/10">
            <StatBox label="Presenti" value={confirmed} icon={UserCheck} color="text-emerald-400" pct={summary?.confirmedPct} />
            <StatBox label="Assenti" value={absent} icon={UserX} color="text-rose-400" pct={summary?.declinedPct} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px bg-gold/10">
            <StatBox label="Invitati" value={summary?.invited ?? 0} icon={Users} color="text-white" />
            <StatBox label="Confermati" value={confirmed} icon={Check} color="text-emerald-400" pct={summary?.confirmedPct} />
            <StatBox label="Assenti" value={absent} icon={X} color="text-rose-400" pct={summary?.declinedPct} />
          </div>
        )}

        {(summary?.inDubbio ?? 0) > 0 && !isTraining && (
          <div className="px-4 py-2 border-t border-gold/10">
            <p className="text-[10px] text-amber-400/80 font-bebas tracking-wider">
              {summary?.inDubbio} GIOCATORI IN DUBBIO
            </p>
          </div>
        )}

        {/* Player list */}
        {convs.length > 0 ? (
          <div className="divide-y divide-gold/10">
            {convs.map((c) => {
              const sm = CONVOCATO_STATUS_META[c.status];
              const rm = RESPONSE_META[c.response];
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Link to={`/rosa/${c.player.id}`} className="w-8 h-8 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center text-[10px] font-bebas text-gold shrink-0 hover:border-gold/60 transition-colors">
                    {getInitials(c.player.name, c.player.surname)}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.player.name} {c.player.surname}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">{ROLE_LABELS[c.player.role] || c.player.role}</p>
                  </div>
                  {permissions.canConfirmAttendance && isTraining && parentPlayerIds.includes(c.player_id) ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleResponse(c.id, 'confermato')} className={`p-1.5 rounded-lg transition-colors ${c.response === 'confermato' ? 'bg-emerald-500/25 text-emerald-300' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'}`} title="Presente">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleResponse(c.id, 'declinato')} className={`p-1.5 rounded-lg transition-colors ${c.response === 'declinato' ? 'bg-rose-500/25 text-rose-300' : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'}`} title="Assente">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : permissions.canManageConvocations && c.response === 'in_attesa' && isTraining ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleResponse(c.id, 'confermato')} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors" title="Presente">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleResponse(c.id, 'declinato')} className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 transition-colors" title="Assente">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isTraining && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${sm.bg} ${sm.color}`}>{sm.label}</span>
                      )}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${rm.bg} ${rm.color} flex items-center gap-0.5`}>
                        {c.response === 'confermato' && <Check className="w-2.5 h-2.5" />}
                        {c.response === 'declinato' && <X className="w-2.5 h-2.5" />}
                        {c.response === 'in_attesa' && <ClockIcon className="w-2.5 h-2.5" />}
                        {isTraining ? (c.response === 'confermato' ? 'Presente' : c.response === 'declinato' ? 'Assente' : 'In attesa') : rm.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-6">
            <EmptyState icon={Users} title={isTraining ? 'Nessuna presenza registrata' : 'Nessuna convocazione'} subtitle={isTraining ? 'Tutti i giocatori sono automaticamente invitati' : 'Gestisci le convocazioni dalla sezione dedicata'} />
          </div>
        )}
      </div>
      )}

      {/* Delete confirmation with scope */}
      {confirmDelete && permissions.canManageEvents && (
        <Modal open onClose={() => setConfirmDelete(false)} title="ELIMINA EVENTO">
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Sei sicuro di voler eliminare questo evento?</p>
            {event.series_id ? (
              <div className="space-y-2">
                <ScopeOption
                  selected={deleteScope === 'single'}
                  onClick={() => setDeleteScope('single')}
                  icon={CalendarDays}
                  title="Solo questo evento"
                  desc="Elimina solo questa occorrenza della serie"
                />
                <ScopeOption
                  selected={deleteScope === 'future'}
                  onClick={() => setDeleteScope('future')}
                  icon={CalendarOff}
                  title="Questo e futuri"
                  desc="Elimina questa e tutte le occorrenze successive"
                />
                <ScopeOption
                  selected={deleteScope === 'series'}
                  onClick={() => setDeleteScope('series')}
                  icon={Repeat}
                  title="Intera serie"
                  desc="Elimina tutti gli eventi della serie ricorrente"
                />
              </div>
            ) : null}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">Annulla</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-semibold hover:bg-rose-500/30 transition-colors">Elimina</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit modal with scope */}
      {showEdit && event && (
        <EventEditForm
          event={event}
          editScope={editScope}
          setEditScope={setEditScope}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}

      {/* Exception modal */}
      {showException && event && (
        <ExceptionModal
          event={event}
          onClose={() => setShowException(false)}
          onApply={handleException}
        />
      )}
    </div>
  );
}

function EventEditForm({ event, editScope, setEditScope, onClose, onSaved }: { event: TeamEvent; editScope: EditScope; setEditScope: (s: EditScope) => void; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: event.title,
    event_type: event.event_type as EventType,
    date: event.date,
    meeting_time: event.meeting_time || '',
    time_start: event.time_start || '',
    time_end: event.time_end || '',
    time_of_day: event.time_of_day as TimeOfDay,
    location: event.location || '',
    description: event.description || '',
    opponent: event.opponent || '',
    status: event.status,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('Inserisci un titolo'); return; }
    setSaving(true);
    setErr(null);
    try {
      const data = {
        ...form,
        meeting_time: form.meeting_time || null,
        time_start: form.time_start || null,
        time_end: form.time_end || null,
        opponent: form.opponent || null,
        location: form.location || null,
        description: form.description || null,
      };
      if (event.series_id && editScope !== 'single') {
        await eventService.updateWithScope(event.id, data, editScope);
      } else {
        await eventService.update(event.id, data);
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="MODIFICA EVENTO">
      <div className="space-y-4">
        {event.series_id && (
          <div className="space-y-2 p-3 rounded-xl border border-gold/20 bg-gold/5">
            <p className="text-[10px] font-bebas text-gold/70 tracking-wider mb-1">MODIFICA SCOPE</p>
            <ScopeOption selected={editScope === 'single'} onClick={() => setEditScope('single')} icon={CalendarDays} title="Solo questo evento" desc="Modifica solo questa occorrenza" />
            <ScopeOption selected={editScope === 'future'} onClick={() => setEditScope('future')} icon={CalendarOff} title="Questo e futuri" desc="Modifica questa e le occorrenze successive" />
            <ScopeOption selected={editScope === 'series'} onClick={() => setEditScope('series')} icon={Repeat} title="Intera serie" desc="Modifica tutti gli eventi della serie" />
          </div>
        )}
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
        {editScope === 'single' && (
          <Field label="Data">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
          </Field>
        )}
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
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="es. Campo Sportivo Cheraschese" className="input" />
        </Field>
        {form.event_type === 'partita' && (
          <Field label="Avversario">
            <input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="es. ASD Ciriè" className="input" />
          </Field>
        )}
        <Field label="Descrizione">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Note aggiuntive..." rows={2} className="input resize-none" />
        </Field>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">Annulla</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl gold-gradient text-black text-sm font-bold disabled:opacity-50">
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
      <style>{`.input { width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; color: #fafafa; outline: none; }
      .input:focus { border-color: rgba(212,175,55,0.5); }`}</style>
    </Modal>
  );
}

const EXCEPTION_META: Record<ExceptionType, { label: string; icon: any; color: string; bg: string; border: string; desc: string }> = {
  holiday: { label: 'Festivo', icon: CalendarOff, color: 'text-sky-300', bg: 'bg-sky-500/10', border: 'border-sky-500/30', desc: 'Allenamento saltato per festività' },
  cancellation: { label: 'Annullato', icon: X, color: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/30', desc: 'Allenamento annullato' },
  different_schedule: { label: 'Orario diverso', icon: Clock, color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', desc: 'Orario o luogo diverso dal solito' },
  special_training: { label: 'Speciale', icon: Sparkles, color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/30', desc: 'Allenamento speciale' },
};

function ExceptionModal({ event, onClose, onApply }: { event: TeamEvent; onClose: () => void; onApply: (type: ExceptionType, data: Partial<TeamEvent>) => void }) {
  const [excType, setExcType] = useState<ExceptionType | null>(null);
  const [form, setForm] = useState({
    time_start: event.time_start || '',
    time_end: event.time_end || '',
    location: event.location || '',
    description: event.description || '',
  });

  const handleApply = () => {
    if (!excType) return;
    onApply(excType, {
      time_start: form.time_start || null,
      time_end: form.time_end || null,
      location: form.location || null,
      description: form.description || null,
    });
  };

  return (
    <Modal open onClose={onClose} title="ECCEZIONE ALLENAMENTO">
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">Questo allenamento fa parte di una serie ricorrente. Crea un'eccezione per questa singola occorrenza.</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(EXCEPTION_META) as [ExceptionType, typeof EXCEPTION_META[ExceptionType]][]).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <button
                key={key}
                onClick={() => setExcType(key)}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors ${
                  excType === key ? `${meta.bg} ${meta.border}` : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${excType === key ? meta.color : 'text-zinc-400'}`} />
                <span className={`text-sm font-medium ${excType === key ? meta.color : 'text-zinc-300'}`}>{meta.label}</span>
                <span className="text-[10px] text-zinc-500">{meta.desc}</span>
              </button>
            );
          })}
        </div>
        {excType && (excType === 'different_schedule' || excType === 'special_training') && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inizio">
                <input type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} className="input" />
              </Field>
              <Field label="Fine">
                <input type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} className="input" />
              </Field>
            </div>
            <Field label="Luogo">
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="es. Campo Sportivo Cheraschese" className="input" />
            </Field>
            <Field label="Descrizione">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Note aggiuntive..." rows={2} className="input resize-none" />
            </Field>
          </>
        )}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">Annulla</button>
          <button onClick={handleApply} disabled={!excType} className="flex-1 py-2.5 rounded-xl gold-gradient text-black text-sm font-bold disabled:opacity-50">Applica eccezione</button>
        </div>
      </div>
      <style>{`.input { width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; color: #fafafa; outline: none; }
      .input:focus { border-color: rgba(212,175,55,0.5); }`}</style>
    </Modal>
  );
}

function ScopeOption({ selected, onClick, icon: Icon, title, desc }: { selected: boolean; onClick: () => void; icon: any; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-xl border text-left w-full transition-colors ${
        selected ? 'border-gold/40 bg-gold/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${selected ? 'text-gold' : 'text-zinc-500'}`} />
      <div>
        <p className={`text-sm font-medium ${selected ? 'text-gold' : 'text-zinc-300'}`}>{title}</p>
        <p className="text-[10px] text-zinc-500">{desc}</p>
      </div>
    </button>
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

function InfoRow({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className={`w-4 h-4 ${highlight ? 'text-gold' : 'text-gold/70'} shrink-0`} />
      <span className="text-xs text-zinc-500 w-16 shrink-0 uppercase tracking-wider">{label}</span>
      <span className={`text-sm ${highlight ? 'text-gold font-medium' : 'text-zinc-200'} capitalize flex-1`}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color, pct }: { label: string; value: number; icon: any; color: string; pct?: number }) {
  return (
    <div className="bg-zinc-950 px-3 py-4 flex flex-col items-center gap-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`font-bebas text-2xl ${color} leading-none`}>{value}</span>
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>
      {pct != null && pct > 0 && <span className="text-[9px] text-zinc-600">{pct}%</span>}
    </div>
  );
}

function AvailabilitySection({
  event,
  availabilities,
  availSummary,
  hasConvocations,
  convs,
  parentPlayerIds,
  canManage,
  onSetAvailability,
}: {
  event: TeamEvent;
  availabilities: AvailabilityWithPlayer[];
  availSummary: AvailabilitySummary | null;
  hasConvocations: boolean;
  convs: ConvocazioneWithPlayer[];
  parentPlayerIds: string[];
  canManage: boolean;
  onSetAvailability: (playerId: string, status: 'disponibile' | 'non_disponibile') => void;
}) {
  const isParent = parentPlayerIds.length > 0;
  const today = new Date().toISOString().slice(0, 10);
  const isFuture = event.date >= today;

  if (!availSummary) return null;

  return (
    <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
      <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5 flex items-center justify-between">
        <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          DISPONIBILITÀ
        </h2>
        {hasConvocations && (
          <span className="text-[10px] text-gold/60 font-bebas tracking-wider">
            CONVOCAZIONI PUBBLICATE
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Summary for coach/manager */}
        {canManage && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 flex flex-col items-center gap-0.5">
              <span className="font-bebas text-2xl text-emerald-400 leading-none">{availSummary.available}</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Disponibili</span>
            </div>
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 flex flex-col items-center gap-0.5">
              <span className="font-bebas text-2xl text-rose-400 leading-none">{availSummary.unavailable}</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Non disponib.</span>
            </div>
          </div>
        )}

        {/* Parent: manage own child availability */}
        {isParent && isFuture && parentPlayerIds.map((pid) => {
          const childAvail = availabilities.find((a) => a.player_id === pid);
          const childPlayer = availabilities.find((a) => a.player_id === pid)?.player;
          if (!childPlayer) return null;
          return (
            <div key={pid} className="rounded-xl border border-gold/20 bg-zinc-900/50 p-3">
              <p className="text-xs text-zinc-400 mb-2">Indica la disponibilità di <span className="text-white font-medium">{childPlayer.name} {childPlayer.surname}</span></p>
              <div className="flex gap-2">
                <button
                  onClick={() => onSetAvailability(pid, 'disponibile')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bebas tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                    childAvail?.status === 'disponibile'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> DISPONIBILE
                </button>
                <button
                  onClick={() => onSetAvailability(pid, 'non_disponibile')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bebas tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                    childAvail?.status === 'non_disponibile'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-transparent'
                  }`}
                >
                  <X className="w-3.5 h-3.5" /> NON DISPONIBILE
                </button>
              </div>
              {childAvail?.note && (
                <p className="text-[10px] text-zinc-500 mt-2 italic">Note: {childAvail.note}</p>
              )}
            </div>
          );
        })}

        {/* Parent: read-only view of all availabilities (after convocations published) */}
        {isParent && hasConvocations && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Stato disponibilità</p>
            {availabilities.map((a) => {
              const am = AVAILABILITY_META[a.status];
              return (
                <div key={a.id} className="flex items-center gap-2.5 py-1">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center text-[9px] font-bebas text-gold shrink-0">
                    {getInitials(a.player.name, a.player.surname)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{a.player.name} {a.player.surname}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${am.bg} ${am.color}`}>{am.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Coach/Manager: full list */}
        {canManage && (
          <div className="space-y-1.5">
            {availabilities.length === 0 ? (
              <p className="text-xs text-emerald-400/80 text-center py-2">Tutti i giocatori sono disponibili</p>
            ) : (
              availabilities.map((a) => {
                const am = AVAILABILITY_META[a.status];
                const conv = convs.find((c) => c.player_id === a.player_id);
                return (
                  <div key={a.id} className="flex items-center gap-2.5 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center text-[9px] font-bebas text-gold shrink-0">
                      {getInitials(a.player.name, a.player.surname)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{a.player.name} {a.player.surname}</p>
                      {a.note && <p className="text-[9px] text-zinc-500 italic truncate">{a.note}</p>}
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${am.bg} ${am.color}`}>{am.label}</span>
                    {hasConvocations && conv && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${RESPONSE_META[conv.response].bg} ${RESPONSE_META[conv.response].color}`}>
                        {RESPONSE_META[conv.response].label}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Info banner */}
        {!hasConvocations && (
          <div className="rounded-lg border border-gold/15 bg-gold/5 px-3 py-2">
            <p className="text-[10px] text-gold/70">
              {canManage
                ? 'I genitori possono segnalare assenze. Crea le convocazioni dalla sezione dedicata.'
                : 'Segala l\'assenza di tuo figlio se non può partecipare. Il tecnico creerà le convocazioni a breve.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
