import { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card border border-primary-app/30 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass border-b border-primary-app/20 px-5 py-4 flex items-center justify-between">
          <h2 className="font-bebas text-lg text-primary-app tracking-wider">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-app hover:text-app hover:bg-app/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
