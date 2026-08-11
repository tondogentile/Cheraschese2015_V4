import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Users, Cake, ChevronRight, Info, EyeOff } from 'lucide-react';
import type { Player, PrivacySettings } from '@/types';
import { playerService, privacyService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, ROLE_LABELS, ROLE_COLORS, getInitials, isBirthdayToday } from '@/lib/constants';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import Modal from '@/components/Modal';

export default function Players() {
  const navigate = useNavigate();
  const { permissions, role, user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);

  const isParent = role === 'parent';
  const childIds = user.player_ids || [];

  const load = async () => {
    setLoading(true);
    try {
      const [data, p] = await Promise.all([
        playerService.getAll(),
        privacyService.get(),
      ]);
      setPlayers(data);
      setPrivacy(p);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // For parent role, filter to only associated players
  const rosterPlayers = isParent
    ? players.filter((p) => childIds.includes(p.id))
    : players;

  const filtered = rosterPlayers.filter((p) => {
    const matchSearch = `${p.name} ${p.surname}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || p.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = rosterPlayers.filter((p) => p.role === r && p.active).length;
    return acc;
  }, {} as Record<string, number>);

  // Privacy-aware rendering helpers for parent role
  const showShirtNumber = !isParent || (privacy?.parents_can_view_shirt_number ?? true);
  const showPosition = !isParent || (privacy?.parents_can_view_position ?? true);
  const showBirthdays = !isParent || (privacy?.parents_can_view_birthdays ?? true);
  const showPhotos = !isParent || (privacy?.parents_can_view_photos ?? true);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl gold-text tracking-wide">ROSA</h1>
          <p className="text-[10px] text-gold/60 font-bebas tracking-widest mt-0.5">{rosterPlayers.length} GIOCATORI</p>
        </div>
        {permissions.canManagePlayers && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg gold-gradient text-black text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
        )}
      </div>

      {/* Role filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bebas tracking-wider whitespace-nowrap border transition-colors ${
            filterRole === 'all' ? 'bg-gold/15 text-gold border-gold/40' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}
        >
          TUTTI ({rosterPlayers.length})
        </button>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-bebas tracking-wider whitespace-nowrap border transition-colors ${
              filterRole === r ? 'bg-gold/15 text-gold border-gold/40' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            {ROLE_LABELS[r].toUpperCase()} ({roleCounts[r] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca giocatore..."
          className="w-full bg-zinc-900 border border-gold/20 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold/50"
        />
      </div>

      {/* Parent simulation notice */}
      {isParent && (
        <div className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
          <Info className="w-4 h-4 text-sky-400/70 shrink-0 mt-0.5" />
          <p className="text-[11px] text-sky-300/80">
            Vista genitore simulata: sono mostrati solo i giocatori associati al genitore selezionato.
          </p>
        </div>
      )}

      {/* Player list */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nessun giocatore trovato" subtitle={isParent ? 'Nessun giocatore associato al tuo profilo' : 'Aggiungi il primo giocatore alla rosa'} />
      ) : (
        <div className="rounded-2xl border border-gold/30 overflow-hidden bg-black card-list">
          {filtered.map((player, idx) => {
            const birthday = isBirthdayToday(player.birth_date);
            return (
              <button
                key={player.id}
                onClick={() => navigate(`/rosa/${player.id}`)}
                className={`w-full text-left bg-zinc-950/50 p-3 hover:bg-gold/5 transition-colors ${idx < filtered.length - 1 ? 'border-b border-gold/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {showPhotos ? (
                      <div className="w-11 h-11 rounded-full bg-zinc-900 border border-gold/30 flex items-center justify-center font-bebas text-lg text-gold">
                        {getInitials(player.name, player.surname)}
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-900 border border-gold/20 flex items-center justify-center text-gold/40">
                        <EyeOff className="w-4 h-4" />
                      </div>
                    )}
                    {showShirtNumber && player.number != null && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full gold-gradient text-black text-[10px] font-bold flex items-center justify-center border border-black">
                        {player.number}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-white truncate">{player.name} {player.surname}</p>
                      {showBirthdays && birthday && <Cake className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {showPosition && (
                        <span className={`text-[10px] font-bebas px-2 py-0.5 rounded-full border ${ROLE_COLORS[player.role] || ROLE_COLORS.centrocampista} tracking-wider`}>
                          {ROLE_LABELS[player.role]?.toUpperCase() || player.role.toUpperCase()}
                        </span>
                      )}
                      {!player.active && <span className="text-[10px] text-zinc-500 uppercase">Non attivo</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showAdd && (
        <PlayerForm onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      )}
      {editPlayer && (
        <PlayerForm player={editPlayer} onClose={() => setEditPlayer(null)} onSaved={() => { setEditPlayer(null); load(); }} />
      )}
    </div>
  );
}

function PlayerForm({ player, onClose, onSaved }: { player?: Player; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!player;
  const [form, setForm] = useState({
    name: player?.name || '',
    surname: player?.surname || '',
    number: player?.number?.toString() || '',
    birth_date: player?.birth_date || '',
    role: player?.role || 'centrocampista',
    parent1_name: player?.parent1_name || '',
    parent1_phone: player?.parent1_phone || '',
    parent1_email: player?.parent1_email || '',
    parent2_name: player?.parent2_name || '',
    parent2_phone: player?.parent2_phone || '',
    parent2_email: player?.parent2_email || '',
    notes: player?.notes || '',
    medical_certificate_date: player?.medical_certificate_date || '',
    medical_certificate_notes: player?.medical_certificate_notes || '',
    active: player?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.surname.trim()) { setErr('Nome e cognome sono obbligatori'); return; }
    setSaving(true);
    setErr(null);
    const payload = {
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
      medical_certificate_date: form.medical_certificate_date || null,
      medical_certificate_notes: form.medical_certificate_notes || null,
      avatar_url: null,
      active: form.active,
    };
    try {
      if (isEdit) {
        await playerService.update(player!.id, payload);
      } else {
        await playerService.create(payload);
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await playerService.remove(player!.id);
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'MODIFICA GIOCATORE' : 'NUOVO GIOCATORE'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="input" />
          </Field>
          <Field label="Cognome">
            <input value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} placeholder="Cognome" className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Numero maglia">
            <input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="10" className="input" />
          </Field>
          <Field label="Data nascita">
            <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="input" />
          </Field>
        </div>
        <Field label="Ruolo">
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>

        {/* Parent 1 */}
        <div className="pt-2 border-t border-gold/10">
          <p className="text-[10px] font-bebas text-gold/70 tracking-wider mb-2">GENITORE 1</p>
          <div className="space-y-3">
            <Field label="Nome">
              <input value={form.parent1_name} onChange={(e) => setForm({ ...form, parent1_name: e.target.value })} placeholder="Nome genitore" className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefono">
                <input value={form.parent1_phone} onChange={(e) => setForm({ ...form, parent1_phone: e.target.value })} placeholder="333..." className="input" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.parent1_email} onChange={(e) => setForm({ ...form, parent1_email: e.target.value })} placeholder="email@..." className="input" />
              </Field>
            </div>
          </div>
        </div>

        {/* Parent 2 */}
        <div className="pt-2 border-t border-gold/10">
          <p className="text-[10px] font-bebas text-gold/70 tracking-wider mb-2">GENITORE 2 (OPZIONALE)</p>
          <div className="space-y-3">
            <Field label="Nome">
              <input value={form.parent2_name} onChange={(e) => setForm({ ...form, parent2_name: e.target.value })} placeholder="Nome genitore" className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefono">
                <input value={form.parent2_phone} onChange={(e) => setForm({ ...form, parent2_phone: e.target.value })} placeholder="333..." className="input" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.parent2_email} onChange={(e) => setForm({ ...form, parent2_email: e.target.value })} placeholder="email@..." className="input" />
              </Field>
            </div>
          </div>
        </div>

        <Field label="Note">
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Note aggiuntive..." rows={2} className="input resize-none" />
        </Field>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-amber-500" />
          <span className="text-sm text-zinc-300">Giocatore attivo</span>
        </label>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">Annulla</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl gold-gradient text-black text-sm font-bold disabled:opacity-50">
            {saving ? 'Salvataggio...' : isEdit ? 'Salva' : 'Aggiungi'}
          </button>
        </div>
        {isEdit && (
          <>
            {confirmDelete ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800">Annulla</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-semibold hover:bg-rose-500/30">Elimina</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-sm hover:text-rose-400 hover:border-rose-500/30 transition-colors">
                <Trash2 className="w-4 h-4" /> Elimina giocatore
              </button>
            )}
          </>
        )}
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
