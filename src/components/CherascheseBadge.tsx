import { useState } from 'react';
import { useBranding, DEFAULT_BRANDING } from '@/hooks/useBranding';

type Props = {
  size?: number;
  className?: string;
};

export default function CherascheseBadge({ size = 40, className = '' }: Props) {
  const { branding } = useBranding();
  const logoPath = branding.logoPath?.trim() || DEFAULT_BRANDING.logoPath;
  const [src, setSrc] = useState(logoPath);

  return (
    <img
      src={src}
      alt="Cheraschese 1904"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      draggable={false}
      onError={() => setSrc(DEFAULT_BRANDING.logoPath)}
    />
  );
}
