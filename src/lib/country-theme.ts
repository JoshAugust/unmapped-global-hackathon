/**
 * Country Visual Identity System
 *
 * Swap a country config → get a completely new visual identity.
 * Each country has culturally authentic colors, patterns, silhouettes, and greetings.
 */

export type PatternType = 'adire' | 'kente' | 'maasai' | 'madhubani' | 'imigongo' | 'none';

export interface CountryTheme {
  iso3: string;
  name: string;
  flag: string;
  colors: {
    primary: string;       // HSL value for CSS variable
    secondary: string;
    accent: string;
    surface: string;       // subtle background tint
  };
  pattern: {
    type: PatternType;
    svgPath: string;
    opacity: number;       // 0.03–0.08
  };
  silhouette: string;
  currency: {
    symbol: string;
    code: string;
  };
  greeting: string;
  greetingAlternates?: string[];
}

// ─── Theme Definitions ──────────────────────────────────────────────

const THEMES: Record<string, CountryTheme> = {
  NGA: {
    iso3: 'NGA',
    name: 'Nigeria',
    flag: '🇳🇬',
    colors: {
      primary: '152 100% 27%',       // Nigeria green #008751
      secondary: '0 0% 100%',         // White
      accent: '43 96% 56%',           // Golden yellow
      surface: '152 40% 97%',         // Very subtle green tint
    },
    pattern: {
      type: 'adire',
      svgPath: '/src/assets/patterns/adire.svg',
      opacity: 0.05,
    },
    silhouette: '/src/assets/silhouettes/nga.svg',
    currency: { symbol: '₦', code: 'NGN' },
    greeting: 'Bawo ni',
    greetingAlternates: ['Kedu', 'Sannu'],
  },

  GHA: {
    iso3: 'GHA',
    name: 'Ghana',
    flag: '🇬🇭',
    colors: {
      primary: '0 72% 44%',           // Ghana red
      secondary: '43 96% 50%',        // Gold
      accent: '43 100% 55%',          // Warm gold
      surface: '43 50% 97%',          // Warm gold tint
    },
    pattern: {
      type: 'kente',
      svgPath: '/src/assets/patterns/kente.svg',
      opacity: 0.05,
    },
    silhouette: '/src/assets/silhouettes/gha.svg',
    currency: { symbol: '₵', code: 'GHS' },
    greeting: 'Akwaaba',
  },

  KEN: {
    iso3: 'KEN',
    name: 'Kenya',
    flag: '🇰🇪',
    colors: {
      primary: '0 0% 10%',            // Black (near-black for readability)
      secondary: '0 80% 45%',         // Kenya red
      accent: '0 85% 50%',            // Warm red accent
      surface: '0 30% 97%',           // Subtle warm tint
    },
    pattern: {
      type: 'maasai',
      svgPath: '/src/assets/patterns/maasai.svg',
      opacity: 0.05,
    },
    silhouette: '/src/assets/silhouettes/ken.svg',
    currency: { symbol: 'KSh', code: 'KES' },
    greeting: 'Habari',
  },

  IND: {
    iso3: 'IND',
    name: 'India',
    flag: '🇮🇳',
    colors: {
      primary: '24 95% 53%',          // Saffron
      secondary: '0 0% 100%',         // White
      accent: '220 56% 30%',          // Navy blue (Ashoka Chakra)
      surface: '24 40% 97%',          // Subtle saffron tint
    },
    pattern: {
      type: 'madhubani',
      svgPath: '/src/assets/patterns/madhubani.svg',
      opacity: 0.04,
    },
    silhouette: '/src/assets/silhouettes/ind.svg',
    currency: { symbol: '₹', code: 'INR' },
    greeting: 'Namaste',
  },

  RWA: {
    iso3: 'RWA',
    name: 'Rwanda',
    flag: '🇷🇼',
    colors: {
      primary: '210 80% 45%',         // Rwanda blue
      secondary: '50 95% 55%',        // Yellow
      accent: '195 85% 55%',          // Sky blue
      surface: '210 40% 97%',         // Subtle blue tint
    },
    pattern: {
      type: 'imigongo',
      svgPath: '/src/assets/patterns/imigongo.svg',
      opacity: 0.06,
    },
    silhouette: '/src/assets/silhouettes/rwa.svg',
    currency: { symbol: 'FRw', code: 'RWF' },
    greeting: 'Muraho',
  },

};

// ─── Default / Fallback ─────────────────────────────────────────────

const DEFAULT_THEME: CountryTheme = THEMES.NGA;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Get theme data for a country by ISO3 code.
 * Falls back to Nigeria if unknown.
 */
export function getCountryTheme(iso3: string): CountryTheme {
  return THEMES[iso3.toUpperCase()] ?? DEFAULT_THEME;
}

/**
 * Get all available country themes.
 */
export function getAllCountryThemes(): CountryTheme[] {
  return Object.values(THEMES);
}

/**
 * Apply a country theme by setting CSS custom properties on :root.
 * This drives the entire visual identity through Tailwind's CSS variable system.
 */
export function applyCountryTheme(theme: CountryTheme): void {
  const root = document.documentElement;

  // Core color variables — these override the design system tokens
  root.style.setProperty('--country-primary', theme.colors.primary);
  root.style.setProperty('--country-secondary', theme.colors.secondary);
  root.style.setProperty('--country-accent', theme.colors.accent);
  root.style.setProperty('--country-surface', theme.colors.surface);

  // Map to existing design system variables for seamless integration
  // Convert HSL to oklch-compatible values for the existing theme
  root.style.setProperty('--country-primary-hsl', `hsl(${theme.colors.primary})`);
  root.style.setProperty('--country-secondary-hsl', `hsl(${theme.colors.secondary})`);
  root.style.setProperty('--country-accent-hsl', `hsl(${theme.colors.accent})`);
  root.style.setProperty('--country-surface-hsl', `hsl(${theme.colors.surface})`);

  // Pattern metadata
  root.style.setProperty('--country-pattern-opacity', String(theme.pattern.opacity));
  root.style.setProperty('--country-pattern-type', theme.pattern.type);

  // Country identifier for conditional styling
  root.dataset.country = theme.iso3.toLowerCase();

  // Persist selection
  try {
    localStorage.setItem('unmapped-country', theme.iso3);
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Load the persisted country theme, if any.
 */
export function loadPersistedTheme(): CountryTheme | null {
  try {
    const stored = localStorage.getItem('unmapped-country');
    if (stored && THEMES[stored.toUpperCase()]) {
      return THEMES[stored.toUpperCase()];
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Initialize country theme from localStorage or default.
 */
export function initCountryTheme(): CountryTheme {
  const persisted = loadPersistedTheme();
  const theme = persisted ?? DEFAULT_THEME;
  applyCountryTheme(theme);
  return theme;
}
