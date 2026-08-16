import { useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, Users, Megaphone, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useBranding } from '@/hooks/useBranding';
import { USER_ROLE_META } from '@/lib/constants';
import CherascheseBadge from '@/components/CherascheseBadge';
import Dashboard from '@/pages/Dashboard';
import Calendar from '@/pages/Calendar';
import Players from '@/pages/Players';
import Communications from '@/pages/Communications';
import Convocazioni from '@/pages/Convocazioni';
import EventDetails from '@/pages/EventDetails';
import PlayerDetails from '@/pages/PlayerDetails';
import Attendance from '@/pages/Attendance';
import AdminSettings from '@/pages/AdminSettings';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays, end: false },
  { to: '/presenze', label: 'Presenze', icon: BarChart3, end: false },
  { to: '/convocazioni', label: 'Convocazioni', icon: ClipboardList, end: false },
  { to: '/rosa', label: 'Rosa', icon: Users, end: false },
  { to: '/comunicazioni', label: 'Comunicazioni', icon: Megaphone, end: false },
];

const adminNavItems = [
  { to: '/impostazioni', label: 'Impostazioni', icon: Settings, end: false },
];

function ParentPresenzeRedirect({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user.role === 'parent') navigate('/calendario', { replace: true });
  }, [user.role, navigate]);
  if (user.role === 'parent') return null;
  return <>{children}</>;
}

function AppInner() {
  const location = useLocation();
  const { user, setRole } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const canAccessSettings = user.role === 'coach' || user.role === 'manager';

  return (
    <div className="min-h-screen bg-app text-app flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-primary-app/30 safe-top">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <CherascheseBadge size={36} className="shrink-0 drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
          <div className="flex flex-col leading-none">
            <span className="font-bebas text-xl gold-text tracking-wider">{branding.teamName.toUpperCase()}</span>
            <span className="text-[9px] text-muted-app uppercase tracking-[0.2em] font-medium">{branding.subtitle}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Settings gear — coach/manager only, ensures access on mobile portrait */}
            {canAccessSettings && (
              <button
                onClick={() => navigate('/impostazioni')}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-primary-app/20 text-muted-app hover:text-primary-app hover:border-primary-app/40 transition-colors"
                title="Impostazioni"
                aria-label="Impostazioni"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            {/* Role switcher */}
            <div className="flex items-center gap-1 bg-card/80 border border-primary-app/20 rounded-lg p-0.5">
              {(['coach', 'manager', 'parent'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-2 py-1 rounded-md text-[9px] font-bebas tracking-wider transition-colors ${
                    user.role === r ? 'bg-primary-app/20 text-primary-app' : 'text-muted-app hover:text-app'
                  }`}
                  title={`Ruolo: ${USER_ROLE_META[r].label}`}
                >
                  {USER_ROLE_META[r].label.toUpperCase().slice(0, 4)}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-primary-app/60 font-bebas tracking-widest hidden sm:block">STAGIONE {branding.season.toUpperCase()}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-primary-app animate-pulse" />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-24">
        <div key={location.pathname} className="animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/convocazioni" element={<Convocazioni />} />
            <Route path="/rosa" element={<Players />} />
            <Route path="/rosa/:id" element={<PlayerDetails />} />
            <Route path="/comunicazioni" element={<Communications />} />
            <Route path="/presenze" element={<ParentPresenzeRedirect><Attendance /></ParentPresenzeRedirect>} />
            <Route path="/eventi/:id" element={<EventDetails />} />
            <Route path="/impostazioni" element={<AdminSettings />} />
          </Routes>
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-primary-app/30 safe-bottom">
        <div className="max-w-5xl mx-auto px-2 flex items-center justify-around h-16">
          {navItems.filter((item) => user.role !== 'parent' || item.to !== '/presenze').map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                  isActive ? 'text-primary-app' : 'text-muted-app hover:text-app'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`relative ${isActive ? '' : ''}`}>
                    {isActive && <div className="absolute -inset-2 rounded-full bg-primary-app/10 blur-sm" />}
                    <Icon className="w-5 h-5 relative" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bebas text-xs tracking-wider' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
          {(user.role === 'coach' || user.role === 'manager') && adminNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                  isActive ? 'text-primary-app' : 'text-muted-app hover:text-app'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`relative ${isActive ? '' : ''}`}>
                    {isActive && <div className="absolute -inset-2 rounded-full bg-primary-app/10 blur-sm" />}
                    <Icon className="w-5 h-5 relative" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bebas text-xs tracking-wider' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
