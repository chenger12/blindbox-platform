export type TemplateType = 'modern' | 'classic' | 'customise';
export type ButtonStyle = 'rounded' | 'square' | 'pill';
export type NavPosition = 'top' | 'side' | 'bottom';
export type DesktopNav = 'top' | 'side';
export type LangCode = 'en' | 'zh' | 'ja';
export type StyleRegion = 'western' | 'japanese' | 'chinese';
export type StyleId = 'trendy' | 'street' | 'pop' | 'arena' | 'holo' | 'vault' | 'soft';
export type BadgeType = 'none' | 'new' | 'hot' | 'free';
export type GameId = 'boxes' | 'kuji' | 'gacha' | 'blindBox' | 'claw' | 'groupPull' | 'battles' | 'market' | 'swap' | 'wheel';
export type HomeSectionId =
  | 'search' | 'banner' | 'quickActions' | 'categories' | 'boxes' | 'games'
  | 'battles' | 'topPulls' | 'checkIn' | 'missions' | 'portfolio' | 'packDeck' | 'dropCalendar' | 'liveDrops';
export type NavItemId = 'home' | 'play' | 'games' | 'me' | GameId;

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  surface: string;
  surface2: string;
  textPrimary: string;
  textSecondary: string;
  onPrimary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeButton {
  style: ButtonStyle;
  borderRadius: string;
  fontWeight: string;
  textTransform: string;
  shadow: string;
  border: string;
  background: string;
}

export interface ThemeTypography {
  display: string;
  body: string;
  titleTransform: string;
  titleWeight: string;
}

export interface ThemeSurface {
  cardRadius: string;
  cardBorder: string;
  cardShadow: string;
  tileBackground: string;
  backgroundImage: string;
}

export interface ThemeLayout {
  /** Phone / tablet navigation. */
  navPosition: NavPosition;
  /** Navigation on screens 1024px and wider (the web version). */
  desktopNav: DesktopNav;
  sidebarWidth: string;
  topbarHeight: string;
  footerVisible: boolean;
  bannerPosition: 'top' | 'middle' | 'hidden';
  componentOrder: HomeSectionId[];
  navItems: NavItemId[];
}

export interface GameConfig {
  id: GameId;
  enabled: boolean;
  order: number;
  badge: BadgeType;
  styleOverride: StyleId | null;
  /**
   * Optional back-office odds tuning. When absent the game uses its built-in defaults.
   * The in-browser server reads these to decide outcomes, and the player-facing odds
   * tables read the same numbers, so what players see always matches what they get.
   */
  odds?: GameOdds;
}

/** A labelled weight row in a game's odds table (e.g. one wheel segment or one gacha tier). */
export interface OddsEntry {
  /** Stable key identifying the slice (segment index, tier name, ...). */
  key: string;
  /** i18n key for the label shown in the back office and the player odds table. */
  labelKey: string;
  /** Relative weight; the UI also shows each as a percentage of the total. */
  weight: number;
}

/** Per-game tunable odds. Every field is optional so a game only stores what it tunes. */
export interface GameOdds {
  /** Weighted slices that should sum to 100% (wheel segments, gacha tiers, ...). */
  weights?: OddsEntry[];
  /** Ichiban Kuji: how many tickets each tier has in a box (quantity, not a percentage). */
  tierCounts?: OddsEntry[];
  /** Pity counter: a guaranteed good outcome after this many misses. */
  pity?: number;
  /** Claw grip chance range, 0-1 (min when poorly aligned, max when centred). */
  gripMin?: number;
  gripMax?: number;
  /** Claw: chance a gripped prize slips, 0-1. */
  slipChance?: number;
  /** Mystery boxes: average return as a fraction of price (RTP). */
  returnRate?: number;
  /** Blind box: chance a case contains the secret style, 0-1. */
  secretChance?: number;
}

export interface SiteConfig {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  defaultLang: LangCode;
  template: TemplateType;
  styleId: StyleId;
  colors: ThemeColors;
  button: ThemeButton;
  typography: ThemeTypography;
  surface: ThemeSurface;
  layout: ThemeLayout;
  games: GameConfig[];
}

export interface StylePreset {
  id: StyleId;
  region: StyleRegion;
  nameKey: string;
  descKey: string;
  template: TemplateType;
  colors: ThemeColors;
  button: ThemeButton;
  typography: ThemeTypography;
  surface: ThemeSurface;
  componentOrder: HomeSectionId[];
  navItems: NavItemId[];
  navPosition: NavPosition;
  desktopNav: DesktopNav;
  canvas: CanvasPalette;
}

export interface CanvasPalette {
  capsules: string[];
  boxes: string[];
  clawBackground: [string, string];
  clawAccent: string;
  wheel: [string, string][];
  wheelStroke: string;
  confetti: string[];
  artOutline: string | null;
  artStroke: number;
}
