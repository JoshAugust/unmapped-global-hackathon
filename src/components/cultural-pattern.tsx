import { useEffect, useState } from 'react';
import { getCountryTheme } from '@/lib/country-theme';
import type { PatternType } from '@/lib/country-theme';

// Import SVG patterns as URLs
import adireSvg from '@/assets/patterns/adire.svg';
import kenteSvg from '@/assets/patterns/kente.svg';
import maasaiSvg from '@/assets/patterns/maasai.svg';
import madhubaniSvg from '@/assets/patterns/madhubani.svg';
import imigongoSvg from '@/assets/patterns/imigongo.svg';

const PATTERN_MAP: Record<PatternType, string> = {
  adire: adireSvg,
  kente: kenteSvg,
  maasai: maasaiSvg,
  madhubani: madhubaniSvg,
  imigongo: imigongoSvg,
  none: '',
};

interface CulturalPatternProps {
  /** ISO3 country code */
  country?: string;
  /** Override opacity (default from theme, typically 0.03–0.08) */
  opacity?: number;
  /** Additional CSS classes */
  className?: string;
  /** Pattern size in px (default 100) */
  size?: number;
}

/**
 * Renders a country's cultural SVG pattern as a subtle repeating background.
 *
 * Usage:
 * ```tsx
 * <CulturalPattern country="NGA" opacity={0.05} />
 * ```
 */
export function CulturalPattern({
  country = 'NGA',
  opacity,
  className = '',
  size = 100,
}: CulturalPatternProps) {
  const theme = getCountryTheme(country);
  const patternUrl = PATTERN_MAP[theme.pattern.type];
  const finalOpacity = opacity ?? theme.pattern.opacity;

  if (!patternUrl || theme.pattern.type === 'none') {
    return null;
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      style={{
        backgroundImage: `url(${patternUrl})`,
        backgroundRepeat: 'repeat',
        backgroundSize: `${size}px ${size}px`,
        opacity: finalOpacity,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Hook to get the current pattern SVG URL for a country.
 */
export function useCountryPattern(iso3: string) {
  const theme = getCountryTheme(iso3);
  return {
    url: PATTERN_MAP[theme.pattern.type],
    type: theme.pattern.type,
    opacity: theme.pattern.opacity,
  };
}

export default CulturalPattern;
