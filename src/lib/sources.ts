/**
 * Registry of common data sources used across the platform.
 * Import individual sources or spread them into <DataSource /> props.
 *
 * Usage:
 *   import { SOURCES } from "@/lib/sources";
 *   <DataSource {...SOURCES.ILOSTAT_2024} />
 */

export interface SourceDefinition {
  /** Short label shown inline, e.g. "ILOSTAT 2024" */
  label: string;
  /** Full dataset name */
  dataset: string;
  /** Year or date range */
  vintage: string;
  /** Brief methodology description */
  methodology?: string;
  /** Known data gaps or caveats */
  caveat?: string;
  /** URL to source */
  url?: string;
}

export const SOURCES: Record<string, SourceDefinition> = {
  ILOSTAT_2024: {
    label: "ILOSTAT 2024",
    dataset: "ILO ILOSTAT Database",
    vintage: "2024",
    methodology:
      "ILO modelled estimates based on nationally reported data with imputation for missing country-years",
    url: "https://ilostat.ilo.org",
  },

  WDI_2024: {
    label: "WDI 2024",
    dataset: "World Bank World Development Indicators",
    vintage: "2024",
    methodology:
      "Compiled from officially recognised international sources, with consistent methodology across countries",
    url: "https://databank.worldbank.org/source/world-development-indicators",
  },

  NBS_LFS_2022: {
    label: "NBS LFS 2022",
    dataset: "National Bureau of Statistics Labour Force Survey",
    vintage: "2022",
    methodology:
      "Nationally representative household survey covering employment, unemployment, and underemployment",
    caveat: "Formal sector only; informal economy coverage is limited",
    url: "https://nigerianstat.gov.ng",
  },

  FREY_OSBORNE: {
    label: "Frey & Osborne 2017",
    dataset: "The Future of Employment: How Susceptible Are Jobs to Computerisation?",
    vintage: "2017",
    methodology:
      "Expert-labelled automation probabilities for 702 O*NET occupations using Gaussian process classification",
    caveat:
      "US-centric occupational taxonomy; cross-country mapping requires careful adaptation",
    url: "https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment/",
  },

  WITTGENSTEIN_SSP2: {
    label: "Wittgenstein Centre SSP2",
    dataset: "Wittgenstein Centre Human Capital Data Explorer — SSP2 Scenario",
    vintage: "2024",
    methodology:
      "Multi-dimensional demographic projections by age, sex, and education under the middle-of-the-road shared socioeconomic pathway",
    url: "http://dataexplorer.wittgensteincentre.org/wcde-v3/",
  },

  HCI_2020: {
    label: "HCI 2020",
    dataset: "World Bank Human Capital Index",
    vintage: "2020",
    methodology:
      "Composite index measuring expected productivity of the next generation of workers relative to full health and education benchmarks",
    caveat: "Pre-COVID data; pandemic impacts not captured",
    url: "https://www.worldbank.org/en/publication/human-capital",
  },

  ESCO_V12: {
    label: "ESCO v1.2",
    dataset: "European Skills, Competences, Qualifications and Occupations",
    vintage: "2024",
    methodology:
      "Standardised European taxonomy of 3,008 occupations and 13,890 skills with hierarchical classification",
    url: "https://esco.ec.europa.eu",
  },

  UNDESA_WPP_2024: {
    label: "UN WPP 2024",
    dataset: "United Nations World Population Prospects",
    vintage: "2024",
    methodology:
      "Probabilistic population projections using Bayesian hierarchical models for fertility, mortality, and migration",
    url: "https://population.un.org/wpp/",
  },

  UNESCO_UIS_2024: {
    label: "UNESCO UIS 2024",
    dataset: "UNESCO Institute for Statistics Education Database",
    vintage: "2024",
    methodology:
      "National administrative and survey data on education enrolment, completion, and learning outcomes",
    caveat: "Reporting gaps for sub-Saharan Africa in recent years",
    url: "http://data.uis.unesco.org",
  },

  ITU_2024: {
    label: "ITU 2024",
    dataset: "International Telecommunication Union ICT Statistics",
    vintage: "2024",
    methodology:
      "National regulatory authority reports on internet penetration, mobile subscriptions, and broadband access",
    url: "https://datahub.itu.int",
  },

  AFDB_AEO_2024: {
    label: "AfDB AEO 2024",
    dataset: "African Development Bank African Economic Outlook",
    vintage: "2024",
    methodology:
      "Macro-fiscal analysis and projections for all 54 African economies based on national accounts data",
    url: "https://www.afdb.org/en/knowledge/publications/african-economic-outlook",
  },

  ONET_2024: {
    label: "O*NET 28.1",
    dataset: "O*NET Occupational Information Network",
    vintage: "2024",
    methodology:
      "Continuously updated occupational database with task-level data from incumbent worker surveys and analyst ratings",
    caveat: "US occupational taxonomy; requires crosswalk for non-US markets",
    url: "https://www.onetonline.org",
  },
} as const;
