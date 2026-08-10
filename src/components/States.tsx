import { Loader2 } from 'lucide-react';

export function Loading({ label = 'Caricamento...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <img
          src="/LogoCheraschese.png"
          alt="Cheraschese 1904"
          className="w-16 h-16 object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]"
          draggable={false}
        />
        <div className="absolute -inset-2 rounded-full border border-primary-app/20 animate-pulse" />
      </div>
      <Loader2 className="w-5 h-5 text-primary-app/60 animate-spin" />
      <p className="text-xs text-muted-app font-bebas tracking-widest">{label.toUpperCase()}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <p className="text-sm text-error-app">{message}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-card border border-app/20 flex items-center justify-center">
        <Icon className="w-7 h-7 text-muted-app" />
      </div>
      <div>
        <p className="text-sm font-medium text-app">{title}</p>
        {subtitle && <p className="text-xs text-muted-app mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
