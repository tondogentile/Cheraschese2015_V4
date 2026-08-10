import { useState, useEffect } from 'react';
import { Settings, CalendarClock, Mail, MessageSquare, Save, Check, Palette, Image, Sun, Moon, Monitor, RotateCcw, AlertTriangle, Shield, ShieldCheck, Users, Eye, EyeOff, UserCog, MessageCircle, Trophy, StickyNote, Lock, Sparkles, ChevronRight } from 'lucide-react';
import { settingsService, privacyService, parentAssociationService } from '@/services';
import { DEFAULT_EXPIRING_SOON_THRESHOLD, USER_ROLE_META } from '@/lib/constants';
import type { AdminSettings as AdminSettingsType, PrivacySettings, ParentAssociation, UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, type ThemeMode, type ThemeColors } from '@/hooks/useTheme';
import { useBranding, DEFAULT_BRANDING } from '@/hooks/useBranding';

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'primary', label: 'Primario' },
  { key: 'secondary', label: 'Secondario' },
  { key: 'background', label: 'Sfondo' },
  { key: 'card', label: 'Sfondo card' },
  { key: 'text', label: 'Testo' },
  { key: 'textMuted', label: 'Testo secondario' },
  { key: 'border', label: 'Bordi' },
  { key: 'success', label: 'Successo' },
  { key: 'warning', label: 'Avviso' },
  { key: 'error', label: 'Errore' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Scuro', icon: Moon },
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

const PRIVACY_FIELDS: { key: keyof PrivacySettings; label: string; description: string }[] = [
  { key: 'parents_can_view_shirt_number', label: 'Numero maglia', description: 'I genitori possono vedere il numero di maglia degli altri giocatori' },
  { key: 'parents_can_view_position', label: 'Posizione', description: 'I genitori possono vedere il ruolo degli altri giocatori' },
  { key: 'parents_can_view_attendance_stats', label: 'Statistiche presenze', description: 'I genitori possono vedere le statistiche di presenza degli altri giocatori' },
  { key: 'parents_can_view_birthdays', label: 'Compleanni', description: 'I genitori possono vedere i compleanni degli altri giocatori' },
  { key: 'parents_can_view_photos', label: 'Foto giocatori', description: 'I genitori possono vedere le foto profilo degli altri giocatori' },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function relativeLuminance(rgb: [number, number, number]): number {
  const channels = rgb.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export default function AdminSettingsPage() {
  const { user, role, setRole } = useAuth();
  const [settings, setSettings] = useState<AdminSettingsType | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [associations, setAssociations] = useState<ParentAssociation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(String(DEFAULT_EXPIRING_SOON_THRESHOLD));

  const { mode, setMode, colors, setColors, resetColors } = useTheme();
  const { branding, setBranding, resetBranding } = useBranding();

  const textBgContrast = contrastRatio(colors.text, colors.background);
  const lowContrast = textBgContrast !== null && textBgContrast < 4.5;

  const isAdmin = role === 'coach' || role === 'manager';

  useEffect(() => {
    Promise.all([
      settingsService.get(),
      privacyService.get(),
      parentAssociationService.getAll(),
    ]).then(([s, p, a]) => {
      setSettings(s);
      setPrivacy(p);
      setAssociations(a);
      setThresholdInput(String(s.expiring_soon_threshold));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings || !privacy) return;
    setSaving(true);
    setSaved(false);
    const [updatedSettings, updatedPrivacy] = await Promise.all([
      settingsService.update({
        ...settings,
        expiring_soon_threshold: Math.max(1, parseInt(thresholdInput, 10) || DEFAULT_EXPIRING_SOON_THRESHOLD),
      }),
      privacyService.update(privacy),
    ]);
    setSettings(updatedSettings);
    setPrivacy(updatedPrivacy);
    setThresholdInput(String(updatedSettings.expiring_soon_threshold));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading || !settings || !privacy) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-app/30 border-t-primary-app rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary-app" />
        <h1 className="font-bebas text-2xl gold-text tracking-wider">IMPOSTAZIONI</h1>
      </div>

      {/* Theme selector */}
      <section className="rounded-2xl border border-primary-app/20 bg-card/60 overflow-hidden">
        <div className="border-b border-primary-app/10 px-4 py-2.5 bg-primary-app/5">
          <h2 className="font-bebas text-sm text-primary-app tracking-wider flex items-center gap-1.5">
            <Palette className="w-4 h-4" /> TEMA
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-muted-app">Scegli l'aspetto dell'applicazione.</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                  mode === value
                    ? 'border-primary-app bg-primary-app/10 text-primary-app'
                    : 'border-app/20 text-muted-app hover:text-app hover:border-app/40'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Branding settings */}
      <section className="rounded-2xl border border-primary-app/20 bg-card/60 overflow-hidden">
        <div className="border-b border-primary-app/10 px-4 py-2.5 bg-primary-app/5">
          <h2 className="font-bebas text-sm text-primary-app tracking-wider flex items-center gap-1.5">
            <Image className="w-4 h-4" /> BRANDING
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <BrandingField
            label="Nome squadra"
            value={branding.teamName}
            onChange={(v) => setBranding({ teamName: v })}
            placeholder={DEFAULT_BRANDING.teamName}
          />
          <BrandingField
            label="Sottotitolo / categoria"
            value={branding.subtitle}
            onChange={(v) => setBranding({ subtitle: v })}
            placeholder={DEFAULT_BRANDING.subtitle}
          />
          <BrandingField
            label="Stagione"
            value={branding.season}
            onChange={(v) => setBranding({ season: v })}
            placeholder={DEFAULT_BRANDING.season}
          />
          <BrandingField
            label="Mascotte"
            value={branding.mascot}
            onChange={(v) => setBranding({ mascot: v })}
            placeholder={DEFAULT_BRANDING.mascot}
          />
          <BrandingField
            label="Percorso logo"
            value={branding.logoPath}
            onChange={(v) => setBranding({ logoPath: v })}
            placeholder={DEFAULT_BRANDING.logoPath}
          />
          <div className="flex items-center gap-3 pt-1">
            <img
              src={branding.logoPath}
              alt="Logo"
              className="w-10 h-10 object-contain rounded-lg border border-primary-app/20"
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_BRANDING.logoPath; }}
            />
            <span className="text-[10px] text-muted-app">Anteprima logo attuale</span>
          </div>
          <button
            onClick={resetBranding}
            className="flex items-center gap-1.5 text-xs text-muted-app hover:text-app transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Ripristina branding predefinito
          </button>
        </div>
      </section>

      {/* Color settings */}
      <section className="rounded-2xl border border-primary-app/20 bg-card/60 overflow-hidden">
        <div className="border-b border-primary-app/10 px-4 py-2.5 bg-primary-app/5">
          <h2 className="font-bebas text-sm text-primary-app tracking-wider flex items-center gap-1.5">
            <Palette className="w-4 h-4" /> COLORI
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-muted-app">Personalizza i colori principali dell'applicazione.</p>
          <div className="grid grid-cols-2 gap-3">
            {COLOR_FIELDS.map(({ key, label }) => (
              <ColorRow
                key={key}
                label={label}
                value={colors[key]}
                onChange={(v) => setColors({ [key]: v })}
              />
            ))}
          </div>
          {lowContrast && (
            <div className="flex items-center gap-2 rounded-xl border border-warning-app/30 bg-warning-app/10 p-3">
              <AlertTriangle className="w-4 h-4 text-warning-app shrink-0" />
              <p className="text-[11px] text-warning-app">Attenzione: il contrasto tra testo e sfondo potrebbe rendere l'app poco leggibile.</p>
            </div>
          )}
          <button
            onClick={resetColors}
            className="flex items-center gap-1.5 text-xs text-muted-app hover:text-app transition-colors pt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Ripristina colori predefiniti
          </button>
        </div>
      </section>

      {/* Certificate threshold */}
      <section className="rounded-2xl border border-primary-app/20 bg-card/60 overflow-hidden">
        <div className="border-b border-primary-app/10 px-4 py-2.5 bg-primary-app/5">
          <h2 className="font-bebas text-sm text-primary-app tracking-wider flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" /> CERTIFICATI MEDICI
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-app mb-1.5 block">
              Soglia "In scadenza" (giorni)
            </label>
            <p className="text-[11px] text-muted-app mb-3">
              I certificati che scadono entro questo numero di giorni vengono segnalati come "In scadenza" nella home.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="input w-24 text-center font-bebas text-lg"
              />
              <span className="text-xs text-muted-app">giorni</span>
              {parseInt(thresholdInput, 10) !== settings.expiring_soon_threshold && (
                <span className="text-[10px] text-warning-app">Modificato</span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-primary-app/10">
            <p className="text-[10px] font-bebas text-primary-app/70 tracking-wider mb-3">PROMEMORIA AUTOMATICI</p>
            <div className="space-y-3">
              <ToggleRow
                icon={<Mail className="w-4 h-4" />}
                label="Promemoria via Email"
                description="Mostra un promemoria per inviare email ai genitori (nessun invio automatico)"
                checked={settings.email_reminder_enabled}
                onToggle={() => setSettings({ ...settings, email_reminder_enabled: !settings.email_reminder_enabled })}
              />
              <ToggleRow
                icon={<MessageSquare className="w-4 h-4" />}
                label="Promemoria via WhatsApp"
                description="Mostra un promemoria per inviare messaggi WhatsApp (nessun invio automatico)"
                checked={settings.whatsapp_reminder_enabled}
                onToggle={() => setSettings({ ...settings, whatsapp_reminder_enabled: !settings.whatsapp_reminder_enabled })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ADMIN CONSOLE — Coach/Manager only          */}
      {/* ═══════════════════════════════════════════ */}
      {isAdmin && (
        <>
          <div className="flex items-center gap-2 pt-4 pb-1">
            <Shield className="w-5 h-5 text-primary-app" />
            <h2 className="font-bebas text-xl gold-text tracking-wider">ADMIN CONSOLE</h2>
          </div>

          {/* Role Simulation */}
          <section className="rounded-2xl border border-primary-app/20 bg-card/60 overflow-hidden">
            <div className="border-b border-primary-app/10 px-4 py-2.5 bg-primary-app/5">
              <h3 className="font-bebas text-sm text-primary-app tracking-wider flex items-center gap-1.5">
                <UserCog className="w-4 h-4" /> SIMULAZIONE RUOLO
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[11px] text-muted-app mb-1">Utente attuale</p>
                <p className="text-sm font-medium text-app">{user.name}</p>
                <p className="text-[10px] text-muted-app">
                  Ruolo: {USER_ROLE_META[role].label}
                </p>
              </div>
              <div className="pt-3 border-t border-primary-app/10">
                <p className="text-[10px] font-bebas text-primary-app/70 tracking-wider mb-3">CAMBIA RUOLO SIMULATO</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['coach', 'manager', 'parent'] as UserRole[]).map((r) => {
                    const meta = USER_ROLE_META[r];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                          role === r
                            ? 'border-primary-app bg-primary-app/10 text-primary-app'
                            : 'border-app/20 text-muted-app hover:text-app hover:border-app/40'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-app mt-3">
                  La simulazione del ruolo permette di visualizzare l'app dalla prospettiva di ogni tipo di utente.
                </p>
              </div>
            </div>
          </section>

          {/* Parent-Player Association */}
          <section className="rounded-2xl border border-primary-app/20 bg-card/60 overflow-hidden">
            <div className="border-b border-primary-app/10 px-4 py-2.5 bg-primary-app/5">
              <h3 className="font-bebas text-sm text-primary-app tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4" /> ASSOCIAZIONE GENITORE-GIOCATORE
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-muted-app">
                Associazioni simulate tra genitori e giocatori. In futuro saranno gestite tramite autenticazione reale.
              </p>
              <div className="divide-y divide-app/10">
                {associations.map((a) => (
                  <div key={a.parent_id} className="flex items-center gap-3 py-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary-app/10 border border-primary-app/20 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-primary-app" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-app truncate">{a.parent_name}</p>
                      <p className="text-[10px] text-muted-app">Genitore</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-app shrink-0" />
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-app truncate">{a.player_name}</p>
                      <p className="text-[10px] text-muted-app">Giocatore associato</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Privacy Settings */}
          <section className="rounded-2xl border border-primary-app/20 bg-card/60 overflow-hidden">
            <div className="border-b border-primary-app/10 px-4 py-2.5 bg-primary-app/5">
              <h3 className="font-bebas text-sm text-primary-app tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> PRIVACY ROSA
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-[11px] text-muted-app">
                Controlla quali informazioni i genitori possono vedere degli altri giocatori. Le impostazioni sono simulate e non hanno ancora effetto reale.
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-primary-app/10 bg-primary-app/5 p-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-app/60 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-app">
                  Simulazione mock frontend-only: le impostazioni privacy sono applicate alla vista rosa genitore simulata. Non sono sicurezza reale — l'applicazione server-side arriverà con l'integrazione Supabase/auth.
                </p>
              </div>
              <div className="space-y-3">
                {PRIVACY_FIELDS.map(({ key, label, description }) => (
                  <ToggleRow
                    key={key}
                    icon={privacy[key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    label={label}
                    description={description}
                    checked={privacy[key]}
                    onToggle={() => setPrivacy({ ...privacy, [key]: !privacy[key] })}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Future Features Placeholders */}
          <section className="rounded-2xl border border-primary-app/10 bg-card/40 overflow-hidden">
            <div className="border-b border-primary-app/10 px-4 py-2.5 bg-primary-app/5">
              <h3 className="font-bebas text-sm text-primary-app/60 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> FUNZIONALITA' FUTURE
              </h3>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-[10px] text-muted-app mb-3">
                Le seguenti aree saranno disponibili in futuro. Attualmente non sono funzionali.
              </p>
              <FuturePlaceholder icon={<Trophy className="w-4 h-4" />} label="Impostazioni MVP Badge" description="Configurazione del sistema di badge MVP per le partite" />
              <FuturePlaceholder icon={<StickyNote className="w-4 h-4" />} label="Note Tecniche" description="Gestione delle note tecniche sui giocatori" />
              <FuturePlaceholder icon={<MessageCircle className="w-4 h-4" />} label="Impostazioni WhatsApp" description="Integrazione e modelli per invii WhatsApp automatici" />
              <FuturePlaceholder icon={<Image className="w-4 h-4" />} label="Branding Avanzato" description="Personalizzazione avanzata dell'aspetto della squadra" />
              <FuturePlaceholder icon={<Palette className="w-4 h-4" />} label="Temi Personalizzati" description="Creazione e salvataggio di temi personalizzati" />
            </div>
          </section>
        </>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-app/20 border border-primary-app/30 text-primary-app font-bebas text-sm tracking-wider hover:bg-primary-app/30 transition-colors disabled:opacity-50"
      >
        {saving ? (
          <><div className="w-4 h-4 border-2 border-primary-app/30 border-t-primary-app rounded-full animate-spin" /> Salvataggio...</>
        ) : saved ? (
          <><Check className="w-4 h-4" /> Salvato</>
        ) : (
          <><Save className="w-4 h-4" /> Salva impostazioni</>
        )}
      </button>
    </div>
  );
}

function BrandingField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-app mb-1.5 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input w-full"
      />
    </div>
  );
}

function ColorRow({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-app/10 bg-app/30 p-2.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
        aria-label={label}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-app">{label}</p>
        <p className="text-[10px] text-muted-app font-mono">{value}</p>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, description, checked, onToggle }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-app/40 border border-app/5 p-3">
      <div className="w-9 h-9 rounded-lg bg-primary-app/10 border border-primary-app/20 flex items-center justify-center text-primary-app shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-app">{label}</p>
        <p className="text-[10px] text-muted-app mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary-app/40' : 'bg-muted-app/30'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-app transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function FuturePlaceholder({ icon, label, description }: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-app/10 bg-app/20 p-3 opacity-70">
      <div className="w-9 h-9 rounded-lg bg-primary-app/5 border border-primary-app/10 flex items-center justify-center text-primary-app/50 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-app/80">{label}</p>
        <p className="text-[10px] text-muted-app mt-0.5">{description}</p>
      </div>
      <span className="text-[9px] font-bebas text-muted-app/50 tracking-wider shrink-0">PRESTO</span>
    </div>
  );
}
