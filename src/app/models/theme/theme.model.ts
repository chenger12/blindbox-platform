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
