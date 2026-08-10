import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Cake, Shirt, User, Trash2, Pencil, CalendarDays, Check, X, Clock, TrendingUp, Award, Zap, Trophy, CalendarOff, Plane, HeartPulse, GraduationCap, HelpCircle, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';
import type { Player, TeamEvent, ConvocazioneWithPlayer, PlayerAttendanceDetail, AttendanceStats, PlannedAbsence, CertificateStatus } from '@/types';import { playerService, eventService, convocazioneService, attendanceService, absenceService, certificateService, settingsService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, getInitials, formatBirthDate, getAge, isBirthdayToday, formatDateLong, EVENT_TYPE_META, MONTHS_SHORT, ABSENCE_REASON_META, ROLES, CERTIFICATE_STATUS_META, getCertificateStatus, getCertificateExpiryDate, getDaysUntilCertificateExpiry } from '@/lib/constants';
import { Loading, ErrorState } from '@/components/States';
import Modal from '@/components/Modal';

export default function PlayerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permissions, user, role } = useAuth();
  const isParent = role === 'parent';
  const childIds = user.player_ids || [];
  const isOwnChild = isParent && id ? childIds.includes(id) : false;
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [detail, setDetail] = useState<PlayerAttendanceDetail | null>(null);
  const [plannedAbsences, setPlannedAbsences] = useState<PlannedAbsence[]>([]);
  const [playerConvs, setPlayerConvs] = useState<ConvocazioneWithPlayer[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [threshold, setThreshold] = useState(30);

  const reload = async () => {
    try {
      setLoading(true);
      const pid = id || '';
      const [p, st, det, absences] = await Promise.all([
        playerService.getById(pid),
        playerService.getAttendanceStats(pid),
        attendanceService.getPlayerDetail(pid),
        absenceService.getByPlayer(pid),
      ]);
      if (!p) { setError('Giocatore non trovato'); return; }
      setPlayer(p);
      setStats(st);
      setDetail(det);
      setPlannedAbsences(absences);
      const settings = await settingsService.get();
      setThreshold(settings.expiring_soon_threshold);
    } catch (err) {
      setError('Errore caricamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const [p, st, det, absences] = await Promise.all([
          playerService.getById(id),
          playerService.getAttendanceStats(id),
          attendanceService.getPlayerDetail(id),
          absenceService.getByPlayer(id),
        ]);
        if (!p) { setError('Giocatore non trovato'); return; }
        setPlayer(p);
        setStats(st);
        setDetail(det);
        setPlannedAbsences(absences);

        const settings = await settingsService.get();
        setThreshold(settings.expiring_soon_threshold);

        const allEvents = await eventService.getAll();
        setEvents(allEvents);
        const convMap = await convocazioneService.getByEventIds(allEvents.map((e) => e.id));
        const myConvs: ConvocazioneWithPlayer[] = [];
        for (const eid of Object.keys(convMap)) {
          for (const c of convMap[eid]) {
            if (c.player_id === id) myConvs.push(c);
          }
        }
        setPlayerConvs(myConvs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!player) return;
    await playerService.remove(player.id);
    navigate('/rosa');
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!player) return <ErrorState message="Giocatore non trovato" />;

  const RoleIcon = ROLE_ICONS[player.role] || User;
  const age = getAge(player.birth_date);
  const birthdayToday = isBirthdayToday(player.birth_date);
  const canSeeFullProfile = !isParent || isOwnChild;

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/rosa')}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-gold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Torna alla rosa
      </button>

      {/* Player header */}
      <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
        <div className="p-5 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center font-bebas text-2xl text-gold">
              {getInitials(player.name, player.surname)}
            </div>
            {player.number != null && (
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full gold-gradient text-black text-xs font-bold flex items-center justify-center border border-black">
                {player.number}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{player.name} {player.surname}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bebas px-2 py-0.5 rounded-full border ${ROLE_COLORS[player.role] || ROLE_COLORS.centrocampista} tracking-wider flex items-center gap-1`}>
                <RoleIcon className="w-3 h-3" />
                {ROLE_LABELS[player.role]?.toUpperCase() || player.role.toUpperCase()}
              </span>
              {birthdayToday && (
                <span className="text-[10px] font-bebas px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 tracking-wider flex items-center gap-1">
                  <Cake className="w-3 h-3" /> COMPLEANNO OGGI!
                </span>
              )}
            </div>
          </div>
          {permissions.canManagePlayers && (
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 rounded-lg border border-gold/20 text-gold/70 hover:text-gold hover:border-gold/40 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Attendance stats with badges — hidden for parents viewing other children */}
      {canSeeFullProfile && detail && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> STATISTICHE PRESENZA
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-px bg-gold/10">
            <StatBox label="Eventi" value={detail.total} color="text-white" />
            <StatBox label="Presenti" value={detail.present} color="text-emerald-400" />
            <StatBox label="Assenti" value={detail.absent} color="text-rose-400" />
          </div>
          {/* Overall rate bar */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Tasso presenze</span>
              <span className="font-bebas text-lg text-gold">{detail.rate}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full gold-gradient rounded-full transition-all duration-500" style={{ width: `${detail.rate}%` }} />
            </div>
          </div>
          {/* Per-type badges */}
          <div className="px-4 pb-3 grid grid-cols-3 gap-2">
            <AttendanceBadge label="Allenamenti" icon={Zap} total={detail.training.total} rate={detail.training.rate} />
            <AttendanceBadge label="Partite" icon={Trophy} total={detail.match.total} rate={detail.match.rate} />
            <AttendanceBadge label="Tornei" icon={Award} total={detail.tournament.total} rate={detail.tournament.rate} />
          </div>
        </div>
      )}

      {/* Personal info */}
      <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
        <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
          <h2 className="font-bebas text-sm text-gold tracking-wider">DATI PERSONALI</h2>
        </div>
        <div className="divide-y divide-gold/10">
          <InfoRow icon={Shirt} label="Maglia" value={player.number != null ? `N° ${player.number}` : 'N/D'} />
          <InfoRow icon={CalendarDays} label="Nascita" value={formatBirthDate(player.birth_date)} />
          {age != null && <InfoRow icon={Cake} label="Età" value={`${age} anni`} />}
        </div>
      </div>

      {/* Parent 1 — hidden for parents viewing other children */}
      {canSeeFullProfile && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider">GENITORE 1</h2>
          </div>
          <div className="divide-y divide-gold/10">
            <InfoRow icon={User} label="Nome" value={player.parent1_name || 'N/D'} />
            {player.parent1_phone && <InfoRow icon={Phone} label="Telefono" value={player.parent1_phone} link={`tel:${player.parent1_phone}`} />}
            {player.parent1_email && <InfoRow icon={Mail} label="Email" value={player.parent1_email} link={`mailto:${player.parent1_email}`} />}
          </div>
        </div>
      )}

      {/* Parent 2 — hidden for parents viewing other children */}
      {canSeeFullProfile && (player.parent2_name || player.parent2_phone || player.parent2_email) && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider">GENITORE 2</h2>
          </div>
          <div className="divide-y divide-gold/10">
            {player.parent2_name && <InfoRow icon={User} label="Nome" value={player.parent2_name} />}
            {player.parent2_phone && <InfoRow icon={Phone} label="Telefono" value={player.parent2_phone} link={`tel:${player.parent2_phone}`} />}
            {player.parent2_email && <InfoRow icon={Mail} label="Email" value={player.parent2_email} link={`mailto:${player.parent2_email}`} />}
          </div>
        </div>
      )}

      {/* Medical Certificate — hidden for parents viewing other children */}
      {canSeeFullProfile && <MedicalCertificateSection player={player} threshold={threshold} canEdit={permissions.canManagePlayers} />}

      {/* Notes — hidden for parents viewing other children */}
      {canSeeFullProfile && player.notes && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider">NOTE</h2>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{player.notes}</p>
          </div>
        </div>
      )}

      {/* Last 5 events attended — hidden for parents viewing other children */}
      {canSeeFullProfile && detail && detail.recentAttended.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> ULTIME 5 PRESENZE
            </h2>
          </div>
          <div className="divide-y divide-gold/10">
            {detail.recentAttended.map((r) => {
              const meta = EVENT_TYPE_META[r.eventType];
              const date = new Date(r.date + 'T00:00:00');
              return (
                <button
                  key={r.eventId}
                  onClick={() => navigate(`/eventi/${r.eventId}`)}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gold/5 transition-colors"
                >
                  <div className="w-8 h-9 rounded-md bg-zinc-900 border border-gold/20 flex flex-col items-center justify-center shrink-0">
                    <span className="font-bebas text-sm text-gold leading-none">{date.getDate()}</span>
                    <span className="text-[7px] text-zinc-500 uppercase">{MONTHS_SHORT[date.getMonth()]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.eventTitle}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{formatDateLong(r.date)}</p>
                  </div>
                  <meta.icon className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Planned absences / availability — hidden for parents viewing other children */}
      {canSeeFullProfile && plannedAbsences.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider flex items-center gap-1.5">
              <CalendarOff className="w-3.5 h-3.5" /> ASSENZE PROGRAMMATE
            </h2>
          </div>
          <div className="divide-y divide-gold/10">
            {plannedAbsences.map((a) => {
              const meta = ABSENCE_REASON_META[a.reason];
              const Icon = meta.icon;
              const isRange = a.start_date !== a.end_date;
              const today = new Date().toISOString().slice(0, 10);
              const isActive = a.start_date <= today && a.end_date >= today;
              const isUpcoming = a.start_date > today;
              return (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bebas uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                        {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bebas">ASSENTE ORA</span>}
                        {isUpcoming && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-bebas">PROGRAMMATA</span>}
                      </div>
                      <p className="text-xs text-white mt-0.5">
                        {isRange ? `${formatDateLong(a.start_date)} - ${formatDateLong(a.end_date)}` : formatDateLong(a.start_date)}
                      </p>
                      {a.notes && <p className="text-[10px] text-zinc-500 mt-1">{a.notes}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Availability status — hidden for parents viewing other children */}
      {canSeeFullProfile && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider">STATO DISPONIBILITA'</h2>
          </div>
        <div className="p-4">
          {(() => {
            const today = new Date().toISOString().slice(0, 10);
            const activeAbsence = plannedAbsences.find((a) => a.start_date <= today && a.end_date >= today);
            if (activeAbsence) {
              const meta = ABSENCE_REASON_META[activeAbsence.reason];
              return (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${meta.bg} border ${meta.border} flex items-center justify-center shrink-0`}>
                    <X className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-rose-300">Non disponibile</p>
                    <p className="text-[10px] text-zinc-500">{meta.label} fino al {formatDateLong(activeAbsence.end_date)}</p>
                  </div>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-300">Disponibile</p>
                  <p className="text-[10px] text-zinc-500">Nessuna assenza programmata oggi</p>
                </div>
              </div>
            );
          })()}
        </div>
        </div>
      )}

      {/* Full attendance history — hidden for parents viewing other children */}
      {canSeeFullProfile && playerConvs.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-zinc-950/50 overflow-hidden">
          <div className="border-b border-gold/15 px-4 py-2.5 bg-gold/5">
            <h2 className="font-bebas text-sm text-gold tracking-wider">STORICO PRESENZE</h2>
          </div>
          <div className="divide-y divide-gold/10">
            {playerConvs.map((c) => {
              const ev = events.find((e) => e.id === c.event_id);
              if (!ev) return null;
              const meta = EVENT_TYPE_META[ev.event_type];
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/eventi/${ev.id}`)}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gold/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <meta.icon className={`w-3 h-3 ${meta.color} shrink-0`} />
                      <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                    </div>
                    <p className="text-[10px] text-zinc-500 capitalize">{formatDateLong(ev.date)}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 ${
                    c.response === 'confermato' ? 'bg-emerald-500/15 text-emerald-300' :
                    'bg-rose-500/15 text-rose-300'
                  }`}>
                    {c.response === 'confermato' && <Check className="w-2.5 h-2.5" />}
                    {c.response === 'declinato' && <X className="w-2.5 h-2.5" />}
                    {c.response === 'confermato' ? 'Presente' : 'Assente'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && player && (
        <PlayerEditForm
          player={player}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); reload(); }}
        />
      )}

      {/* Delete (coach/manager only) */}
      {permissions.canManagePlayers && !isParent && (
        confirmDelete ? (
          <div className="flex gap-2">
            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800">Annulla</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-semibold hover:bg-rose-500/30">Conferma elimina</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-sm hover:text-rose-400 hover:border-rose-500/30 transition-colors">
            <Trash2 className="w-4 h-4" /> Elimina giocatore
          </button>
        )
      )}
    </div>
  );
}

function PlayerEditForm({ player, onClose, onSaved }: { player: Player; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: player.name,
    surname: player.surname,
    number: player.number?.toString() || '',
    birth_date: player.birth_date || '',
    role: player.role,
    parent1_name: player.parent1_name || '',
    parent1_phone: player.parent1_phone || '',
    parent1_email: player.parent1_email || '',
    parent2_name: player.parent2_name || '',
    parent2_phone: player.parent2_phone || '',
    parent2_email: player.parent2_email || '',
    notes: player.notes || '',
    active: player.active,
    medical_certificate_date: player.medical_certificate_date || '',
    medical_certificate_notes: player.medical_certificate_notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.name.trim() || !form.surname.trim()) { setErr('Nome e cognome sono obbligatori'); return; }
    setSaving(true);
    setErr(null);
    try {
      await playerService.update(player.id, {
        name: form.name.trim(),
        surname: form.surname.trim(),
        number: form.number ? parseInt(form.number) : null,
        birth_date: form.birth_date || null,
        role: form.role,
        parent1_name: form.parent1_name || null,
        parent1_phone: form.parent1_phone || null,
        parent1_email: form.parent1_email || null,
        parent2_name: form.parent2_name || null,
        parent2_phone: form.parent2_phone || null,
        parent2_email: form.parent2_email || null,
        notes: form.notes || null,
        active: form.active,
        medical_certificate_date: form.medical_certificate_date || null,
        medical_certificate_notes: form.medical_certificate_notes || null,
      });
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="MODIFICA GIOCATORE">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nome</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Cognome</label>
            <input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Numero maglia</label>
            <input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Data nascita</label>
            <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="input" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Ruolo</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Player['role'] })} className="input">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div className="pt-2 border-t border-gold/10">
          <p className="text-[10px] font-bebas text-gold/70 tracking-wider mb-2">GENITORE 1</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nome</label>
              <input value={form.parent1_name} onChange={(e) => setForm({ ...form, parent1_name: e.target.value })} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Telefono</label>
                <input value={form.parent1_phone} onChange={(e) => setForm({ ...form, parent1_phone: e.target.value })} className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
                <input type="email" value={form.parent1_email} onChange={(e) => setForm({ ...form, parent1_email: e.target.value })} className="input" />
              </div>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-gold/10">
          <p className="text-[10px] font-bebas text-gold/70 tracking-wider mb-2">GENITORE 2 (OPZIONALE)</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nome</label>
              <input value={form.parent2_name} onChange={(e) => setForm({ ...form, parent2_name: e.target.value })} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Telefono</label>
                <input value={form.parent2_phone} onChange={(e) => setForm({ ...form, parent2_phone: e.target.value })} className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
                <input type="email" value={form.parent2_email} onChange={(e) => setForm({ ...form, parent2_email: e.target.value })} className="input" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Note</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input resize-none" />
        </div>
        <div className="pt-2 border-t border-gold/10">
          <p className="text-[10px] font-bebas text-gold/70 tracking-wider mb-2">CERTIFICATO MEDICO</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Data ultima visita medica</label>
              <input type="date" value={form.medical_certificate_date} onChange={(e) => setForm({ ...form, medical_certificate_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Note certificato</label>
              <textarea value={form.medical_certificate_notes} onChange={(e) => setForm({ ...form, medical_certificate_notes: e.target.value })} rows={2} className="input resize-none" />
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-amber-500" />
          <span className="text-sm text-zinc-300">Giocatore attivo</span>
        </label>
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

function InfoRow({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: string }) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-gold/70 shrink-0" />
      <span className="text-xs text-zinc-500 w-20 shrink-0 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-zinc-200 flex-1">{value}</span>
    </div>
  );
  if (link) {
    return <a href={link} className="block hover:bg-gold/5 transition-colors">{content}</a>;
  }
  return content;
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-zinc-950 px-3 py-4 flex flex-col items-center gap-1">
      <span className={`font-bebas text-2xl ${color} leading-none`}>{value}</span>
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function AttendanceBadge({ label, icon: Icon, total, rate }: { label: string; icon: any; total: number; rate: number }) {
  const color = rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : rate > 0 ? 'text-rose-400' : 'text-zinc-500';
  return (
    <div className="rounded-lg border border-gold/15 bg-zinc-900/50 p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`font-bebas text-lg ${color} leading-none block`}>{total > 0 ? `${rate}%` : '-'}</span>
      <span className="text-[8px] text-zinc-600">{total} eventi</span>
    </div>
  );
}

function MedicalCertificateSection({ player, threshold, canEdit }: { player: Player; threshold: number; canEdit: boolean }) {
  const status = getCertificateStatus(player.medical_certificate_date, threshold);
  const meta = CERTIFICATE_STATUS_META[status];
  const expiryDate = getCertificateExpiryDate(player.medical_certificate_date);
  const daysLeft = getDaysUntilCertificateExpiry(player.medical_certificate_date);
  const Icon = status === 'valid' ? ShieldCheck : status === 'expiring_soon' ? AlertTriangle : status === 'expired' ? XCircle : HelpCircle;

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bebas text-sm text-white tracking-wider flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-gold" /> CERTIFICATO MEDICO
        </h3>
        <span className={`flex items-center gap-1.5 text-[10px] font-bebas tracking-wider ${meta.color}`}>
          <span className={`w-2 h-2 rounded-full ${meta.dot} ${status === 'expiring_soon' || status === 'expired' ? 'animate-pulse' : ''}`} />
          {meta.label.toUpperCase()}
        </span>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Ultima visita medica</span>
          <span className="text-white font-medium">
            {player.medical_certificate_date ? formatDateLong(player.medical_certificate_date) : 'Non registrata'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Scadenza</span>
          <span className={`font-medium ${meta.color}`}>
            {expiryDate ? formatDateLong(expiryDate) : '—'}
          </span>
        </div>
        {daysLeft !== null && daysLeft >= 0 && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Giorni alla scadenza</span>
            <span className={`font-bebas tracking-wider ${meta.color}`}>{daysLeft}</span>
          </div>
        )}
        {daysLeft !== null && daysLeft < 0 && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Scaduto da</span>
            <span className={`font-bebas tracking-wider ${meta.color}`}>{Math.abs(daysLeft)} giorni</span>
          </div>
        )}
        {player.medical_certificate_notes && (
          <div className="pt-2 mt-2 border-t border-white/5">
            <span className="text-zinc-500 block mb-1">Note</span>
            <span className="text-zinc-300">{player.medical_certificate_notes}</span>
          </div>
        )}
        {!player.medical_certificate_date && (
          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/5 text-zinc-400">
            <Icon className="w-3.5 h-3.5" />
            <span className="text-[11px]">Nessuna visita medica registrata{canEdit ? '. Aggiungi dalla modifica.' : '.'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
