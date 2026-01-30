'use client';

import { useState } from 'react';
import { usePrivacy } from '@/lib/PrivacyContext';

interface PrivacyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function PrivacyImage({ src, alt, className = '' }: PrivacyImageProps) {
  const { blurEnabled } = usePrivacy();
  const [isHovered, setIsHovered] = useState(false);

  const shouldBlur = blurEnabled && !isHovered;

  return (
    <img
      src={src}
      alt={alt}
      className={`transition-all duration-300 ${className} ${shouldBlur ? 'blur-lg' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    />
  );
}
