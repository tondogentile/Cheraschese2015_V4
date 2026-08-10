import { useEffect, useState } from 'react';
import { Plus, Pin, PinOff, Trash2, Megaphone, Pencil, AlertCircle, AlertTriangle, Info, MessageCircle } from 'lucide-react';
import type { Communication } from '@/types';
import { communicationService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { PRIORITY_META, buildWhatsAppUrl, formatCommunicationForWhatsApp } from '@/lib/constants';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import Modal from '@/components/Modal';

export default function Communications() {
  const { permissions } = useAuth();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editComm, setEditComm] = useState<Communication | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await communicationService.getAll();
      setCommunications(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const togglePin = async (comm: Communication) => {
    await communicationService.update(comm.id, { pinned: !comm.pinned });
    load();
  };

  const handleShareWhatsApp = (comm: Communication) => {
    const message = formatCommunicationForWhatsApp(comm.title, comm.body, comm.priority);
    window.open(buildWhatsAppUrl(message), '_blank');
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl gold-text tracking-wide">COMUNICAZIONI</h1>
          <p className="text-[10px] text-gold/60 font-bebas tracking-widest mt-0.5">{communications.length} MESSAGGI</p>
        </div>
        {permissions.canManageCommunications && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg gold-gradient text-black text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Nuova
          </button>
        )}
      </div>

      {communications.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nessuna comunicazione" subtitle="Invia la prima comunicazione alla squadra" />
      ) : (
        <div className="space-y-2">
          {communications.map((comm) => {
            const prio = PRIORITY_META[comm.priority];
            const PriorityIcon = comm.priority === 'urgente' ? AlertTriangle : comm.priority === 'importante' ? AlertCircle : Info;
            return (
              <div
                key={comm.id}
                className={`rounded-xl border ${prio.border} ${prio.bg} p-3.5 ${comm.pinned ? 'ring-1 ring-gold/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <PriorityIcon className={`w-4 h-4 ${prio.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bebas px-1.5 py-0.5 rounded ${prio.bg} ${prio.color} tracking-wider`}>{prio.label.toUpperCase()}</span>
                      {comm.pinned && <Pin className="w-3 h-3 text-gold" />}
                      <span className="text-[10px] text-zinc-500">
                        {new Date(comm.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1.5">{comm.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap">{comm.body}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-gold/10">
                  {/* WhatsApp share — coach/manager only */}
                  {permissions.canManageCommunications && (
                    <button
                      onClick={() => handleShareWhatsApp(comm)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-colors font-bebas tracking-wider"
                    >
                      <MessageCircle className="w-3 h-3" /> WHATSAPP
                    </button>
                  )}
                  {permissions.canManageCommunications && (
                    <>
                      <button
                        onClick={() => togglePin(comm)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-gold hover:bg-gold/10 transition-colors font-bebas tracking-wider"
                      >
                        {comm.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        {comm.pinned ? 'RIMUOVI PIN' : 'FISSA'}
                      </button>
                      <button
                        onClick={() => setEditComm(comm)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors font-bebas tracking-wider"
                      >
                        <Pencil className="w-3 h-3" /> MODIFICA
                      </button>
                      <button
                        onClick={async () => { await communicationService.remove(comm.id); load(); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors font-bebas tracking-wider ml-auto"
                      >
                        <Trash2 className="w-3 h-3" /> ELIMINA
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <CommForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
      {editComm && (
        <CommForm comm={editComm} onClose={() => setEditComm(null)} onSaved={() => { setEditComm(null); load(); }} />
      )}
    </div>
  );
}

function CommForm({ comm, onClose, onSaved }: { comm?: Communication; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!comm;
  const [form, setForm] = useState({
    title: comm?.title || '',
    body: comm?.body || '',
    priority: comm?.priority || ('normale' as Communication['priority']),
    pinned: comm?.pinned ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) { setErr('Titolo e messaggio sono obbligatori'); return; }
    setSaving(true);
    setErr(null);
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      priority: form.priority,
      pinned: form.pinned,
    };
    try {
      if (isEdit) {
        await communicationService.update(comm!.id, payload);
      } else {
        await communicationService.create(payload);
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'MODIFICA COMUNICAZIONE' : 'NUOVA COMUNICAZIONE'}>
      <div className="space-y-4">
        <Field label="Titolo">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="es. Allenamento annullato"
            className="input"
          />
        </Field>
        <Field label="Messaggio">
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Scrivi il messaggio..."
            rows={5}
            className="input resize-none"
          />
        </Field>
        <Field label="Priorità">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PRIORITY_META).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setForm({ ...form, priority: k as Communication['priority'] })}
                className={`py-2 rounded-lg text-xs font-bebas tracking-wider border transition-colors ${
                  form.priority === k ? `${v.bg} ${v.color} ${v.border}` : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                {v.label.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="w-4 h-4 accent-amber-500" />
          <span className="text-sm text-zinc-300">Fissa in alto</span>
        </label>
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800">Annulla</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl gold-gradient text-black text-sm font-bold disabled:opacity-50">
            {saving ? 'Invio...' : isEdit ? 'Salva' : 'Invia'}
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
