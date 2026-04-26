import { useState, useEffect } from 'react';
import {
  getAllCountryThemes,
  getCountryTheme,
  applyCountryTheme,
  loadPersistedTheme,
} from '@/lib/country-theme';
import type { CountryTheme } from '@/lib/country-theme';
import { CulturalPattern } from '@/components/cultural-pattern';

interface CountryPickerProps {
  /** Called when a country is selected */
  onSelect?: (theme: CountryTheme) => void;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Country selection grid — each card previews the cultural identity.
 * On select: applies theme CSS variables and persists choice.
 */
export function CountryPicker({ onSelect, className = '' }: CountryPickerProps) {
  const themes = getAllCountryThemes();
  const [selected, setSelected] = useState<string>(() => {
    const persisted = loadPersistedTheme();
    return persisted?.iso3 ?? '';
  });

  function handleSelect(theme: CountryTheme) {
    setSelected(theme.iso3);
    applyCountryTheme(theme);
    onSelect?.(theme);
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 ${className}`}>
      {themes.map((theme) => (
        <CountryCard
          key={theme.iso3}
          theme={theme}
          isSelected={selected === theme.iso3}
          onSelect={() => handleSelect(theme)}
        />
      ))}
    </div>
  );
}

// ─── Country Card ───────────────────────────────────────────────────

interface CountryCardProps {
  theme: CountryTheme;
  isSelected: boolean;
  onSelect: () => void;
}

function CountryCard({ theme, isSelected, onSelect }: CountryCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        relative overflow-hidden rounded-xl border-2 p-6 text-left
        transition-all duration-300 ease-out cursor-pointer
        hover:scale-[1.02] hover:shadow-lg
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${isSelected
          ? 'border-current shadow-md scale-[1.02] ring-2 ring-current ring-offset-2'
          : 'border-border/50 hover:border-border'
        }
      `}
      style={{
        backgroundColor: isSelected
          ? `hsl(${theme.colors.surface})`
          : undefined,
        borderColor: isSelected
          ? `hsl(${theme.colors.primary})`
          : undefined,
        '--ring-color': `hsl(${theme.colors.primary})`,
      } as React.CSSProperties}
      aria-pressed={isSelected}
      aria-label={`Select ${theme.name}`}
    >
      {/* Cultural pattern background */}
      <CulturalPattern
        country={theme.iso3}
        opacity={isSelected ? 0.08 : 0.04}
        size={80}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Flag */}
        <span className="text-4xl block mb-3" role="img" aria-label={`${theme.name} flag`}>
          {theme.flag}
        </span>

        {/* Country name */}
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {theme.name}
        </h3>

        {/* Greeting */}
        <p
          className="text-sm font-medium italic"
          style={{ color: `hsl(${theme.colors.primary})` }}
        >
          "{theme.greeting}"
        </p>

        {/* Currency badge */}
        <span className="inline-block mt-3 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
          {theme.currency.symbol} {theme.currency.code}
        </span>

        {/* Selection indicator */}
        {isSelected && (
          <div
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold animate-in zoom-in-50 duration-200"
            style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
          >
            ✓
          </div>
        )}
      </div>

      {/* Color accent bar at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, hsl(${theme.colors.primary}), hsl(${theme.colors.accent}))`,
          opacity: isSelected ? 1 : 0.3,
        }}
      />
    </button>
  );
}

export default CountryPicker;
