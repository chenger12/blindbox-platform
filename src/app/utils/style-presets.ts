import { StylePreset, StyleId, StyleRegion } from '../models/theme/theme.model';

/**
 * Built-in style presets. The back office applies a preset to the site config,
 * then lets the admin fine-tune every value. Components never read these
 * directly — they only use the CSS variables ThemeService derives from config.
 */
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'pop', region: 'japanese', nameKey: 'style.pop.name', descKey: 'style.pop.desc', template: 'classic', navPosition: 'bottom', desktopNav: 'top',
    colors: { primary: '#ff3d7f', primaryHover: '#ff1f6b', secondary: '#ffd60a', background: '#fff3d6', surface: '#ffffff', surface2: '#fff8e8',
      textPrimary: '#111111', textSecondary: '#6b5d45', onPrimary: '#ffffff', border: '#111111', success: '#0f9d6b', warning: '#ff9f1a', error: '#ff3d7f' },
    button: { style: 'rounded', borderRadius: '12px', fontWeight: '900', textTransform: 'none', shadow: '3px 3px 0 #111111', border: '2.5px solid #111111', background: 'var(--color-primary)' },
    typography: { display: "'Archivo Black','Noto Sans JP','Inter',sans-serif", body: "'Inter','Noto Sans JP','Noto Sans SC',sans-serif", titleTransform: 'none', titleWeight: '400' },
    surface: { cardRadius: '14px', cardBorder: '2.5px solid #111111', cardShadow: '4px 4px 0 #111111', tileBackground: '#ffffff',
      backgroundImage: 'radial-gradient(#00000012 1.4px, transparent 1.6px) 0 0 / 14px 14px' },
    componentOrder: ['checkIn', 'banner', 'games', 'missions', 'boxes'],
    navItems: ['home', 'games', 'play', 'market', 'me'],
    canvas: { capsules: ['#ffd60a', '#ff3d7f', '#2b6bff', '#21d19f', '#ffb36b', '#c8a8ff', '#ffffff'], boxes: ['#ffd60a', '#ff8fb5', '#6fe3c1', '#ffffff', '#ffb36b', '#c8a8ff'],
      clawBackground: ['#2b6bff', '#1a47c2'], clawAccent: '#ffd60a', wheel: [['#ffd60a', '#111'], ['#2b6bff', '#fff'], ['#ff3d7f', '#fff'], ['#21d19f', '#111'], ['#ffffff', '#111'], ['#ff9f1a', '#111'], ['#c8a8ff', '#111'], ['#111111', '#ffd60a']],
      wheelStroke: '#111111', confetti: ['#ff3d7f', '#ffd60a', '#2b6bff', '#21d19f', '#111111'], artOutline: '#111111', artStroke: 2.6 }
  },
  {
    id: 'arena', region: 'western', nameKey: 'style.arena.name', descKey: 'style.arena.desc', template: 'modern', navPosition: 'bottom', desktopNav: 'top',
    colors: { primary: '#8b5cff', primaryHover: '#7a48ff', secondary: '#00d4ff', background: '#0a0d1f', surface: '#111634', surface2: '#171e44',
      textPrimary: '#eef1ff', textSecondary: '#7c86bf', onPrimary: '#ffffff', border: '#252e63', success: '#3ddc97', warning: '#f5b400', error: '#ff4d6d' },
    button: { style: 'rounded', borderRadius: '10px', fontWeight: '800', textTransform: 'uppercase', shadow: '0 0 22px #8b5cff55', border: '0', background: 'linear-gradient(90deg,#8b5cff,#00d4ff)' },
    typography: { display: "'Chakra Petch','Noto Sans JP','Inter',sans-serif", body: "'Inter','Noto Sans JP','Noto Sans SC',sans-serif", titleTransform: 'uppercase', titleWeight: '700' },
    surface: { cardRadius: '14px', cardBorder: '1px solid #252e63', cardShadow: 'none', tileBackground: 'radial-gradient(circle at 50% 42%,#2e3480,#141a3f 75%)',
      backgroundImage: 'radial-gradient(70% 40% at 0% 0%,#8b5cff2e,transparent 60%)' },
    componentOrder: ['banner', 'quickActions', 'liveDrops', 'boxes', 'games', 'battles', 'topPulls'],
    navItems: ['home', 'play', 'battles', 'market', 'me'],
    canvas: { capsules: ['#8b5cff', '#00d4ff', '#ffffff', '#2a3270', '#ffc23d', '#ff3d9a', '#4b5385'], boxes: ['#3a4290', '#2c3478', '#4b3a99', '#25306e', '#3d2f85', '#1f5f8f'],
      clawBackground: ['#151b48', '#0a0d1f'], clawAccent: '#00d4ff', wheel: [['#171e44', '#fff'], ['#2a1f6b', '#fff'], ['#171e44', '#fff'], ['#2a1f6b', '#fff'], ['#171e44', '#fff'], ['#f5b400', '#1a1200'], ['#2a1f6b', '#fff'], ['#00d4ff', '#05060f']],
      wheelStroke: '#8b5cff', confetti: ['#8b5cff', '#00d4ff', '#ff3d9a', '#f5b400', '#ffffff'], artOutline: null, artStroke: 2 }
  },
  {
    id: 'holo', region: 'western', nameKey: 'style.holo.name', descKey: 'style.holo.desc', template: 'modern', navPosition: 'bottom', desktopNav: 'top',
    colors: { primary: '#c49bff', primaryHover: '#b182ff', secondary: '#7cf7ff', background: '#0b0b10', surface: '#15151c', surface2: '#1c1c25',
      textPrimary: '#f5f5fa', textSecondary: '#8a8a9e', onPrimary: '#111111', border: '#2c2c39', success: '#7cffcb', warning: '#ffe59b', error: '#ff7aa8' },
    button: { style: 'rounded', borderRadius: '12px', fontWeight: '700', textTransform: 'none', shadow: '0 0 22px #c49bff44', border: '0', background: 'linear-gradient(110deg,#7cf7ff,#c49bff 30%,#ff9bd2 55%,#ffe59b 80%)' },
    typography: { display: "'Sora','Noto Sans JP','Inter',sans-serif", body: "'Inter','Noto Sans JP','Noto Sans SC',sans-serif", titleTransform: 'none', titleWeight: '700' },
    surface: { cardRadius: '16px', cardBorder: '1px solid #2c2c39', cardShadow: 'none',
      tileBackground: 'linear-gradient(115deg,#ffffff00 30%,#ffffff1c 45%,#ffffff00 60%),radial-gradient(circle at 50% 42%,#35354a,#16161f 75%)',
      backgroundImage: 'radial-gradient(70% 35% at 50% 0%,#c49bff26,transparent 60%)' },
    componentOrder: ['packDeck', 'games', 'topPulls'],
    navItems: ['home', 'games', 'battles', 'market', 'me'],
    canvas: { capsules: ['#c49bff', '#7cf7ff', '#ff9bd2', '#ffe59b', '#f5f5fa', '#2c2c39', '#4a4a5c'], boxes: ['#2c2840', '#262a44', '#3a2a4a', '#22303f', '#33284a', '#2a2a38'],
      clawBackground: ['#1c1a2a', '#0b0b10'], clawAccent: '#c49bff', wheel: [['#15151c', '#fff'], ['#2a2440', '#fff'], ['#15151c', '#fff'], ['#2a2440', '#fff'], ['#15151c', '#fff'], ['#ffe59b', '#111'], ['#2a2440', '#fff'], ['#7cf7ff', '#111']],
      wheelStroke: '#c49bff', confetti: ['#7cf7ff', '#c49bff', '#ff9bd2', '#ffe59b', '#ffffff'], artOutline: null, artStroke: 2 }
  },
  {
    id: 'street', region: 'western', nameKey: 'style.street.name', descKey: 'style.street.desc', template: 'modern', navPosition: 'bottom', desktopNav: 'top',
    colors: { primary: '#e3262f', primaryHover: '#c41d25', secondary: '#111111', background: '#f4f4f1', surface: '#ffffff', surface2: '#f3f3f0',
      textPrimary: '#111111', textSecondary: '#777777', onPrimary: '#ffffff', border: '#dcdcd7', success: '#0a8a4a', warning: '#b8892b', error: '#e3262f' },
    button: { style: 'square', borderRadius: '3px', fontWeight: '900', textTransform: 'uppercase', shadow: 'none', border: '0', background: 'var(--color-primary)' },
    typography: { display: "'Anton','Noto Sans JP','Inter',sans-serif", body: "'Inter','Noto Sans JP','Noto Sans SC',sans-serif", titleTransform: 'uppercase', titleWeight: '400' },
    surface: { cardRadius: '4px', cardBorder: '1.5px solid #111111', cardShadow: 'none', tileBackground: '#f1f1ee', backgroundImage: 'none' },
    componentOrder: ['dropCalendar', 'games', 'boxes'],
    navItems: ['home', 'play', 'battles', 'market', 'me'],
    canvas: { capsules: ['#ffffff', '#111111', '#e3262f', '#bdbdb8', '#e7e7e3', '#6b6b6b'], boxes: ['#ffffff', '#f1f1ef', '#e3262f', '#ffffff', '#111111', '#e7e7e3'],
      clawBackground: ['#2a2a2a', '#141414'], clawAccent: '#e3262f', wheel: [['#111', '#fff'], ['#fff', '#111'], ['#111', '#fff'], ['#fff', '#111'], ['#111', '#fff'], ['#b8892b', '#fff'], ['#fff', '#111'], ['#e3262f', '#fff']],
      wheelStroke: '#111111', confetti: ['#e3262f', '#111111', '#ffffff', '#bbbbbb'], artOutline: null, artStroke: 2 }
  },
  {
    id: 'vault', region: 'western', nameKey: 'style.vault.name', descKey: 'style.vault.desc', template: 'modern', navPosition: 'bottom', desktopNav: 'side',
    colors: { primary: '#c9a45c', primaryHover: '#b8924a', secondary: '#f3dfae', background: '#0c0d10', surface: '#14161b', surface2: '#1b1e25',
      textPrimary: '#f4efe6', textSecondary: '#8c8577', onPrimary: '#14110b', border: '#2b2f39', success: '#8fbf8a', warning: '#c9a45c', error: '#c46a5a' },
    button: { style: 'square', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase', shadow: 'none', border: '0', background: 'var(--color-primary)' },
    typography: { display: "'Playfair Display','Noto Serif JP',serif", body: "'Inter','Noto Sans JP','Noto Sans SC',sans-serif", titleTransform: 'none', titleWeight: '700' },
    surface: { cardRadius: '6px', cardBorder: '1px solid #2b2f39', cardShadow: 'none', tileBackground: 'radial-gradient(circle at 50% 42%,#3a3529,#16140f 78%)',
      backgroundImage: 'radial-gradient(70% 30% at 50% 0%,#c9a45c1c,transparent 60%)' },
    componentOrder: ['portfolio', 'boxes', 'games'],
    navItems: ['home', 'me', 'market', 'play', 'games'],
    canvas: { capsules: ['#c9a45c', '#f4efe6', '#14161b', '#3b404c', '#8a6a2c', '#5b7493', '#a8574a'], boxes: ['#1b1e25', '#252932', '#2a2721', '#1f2229', '#2e2a22', '#181a20'],
      clawBackground: ['#1b1a16', '#0c0d10'], clawAccent: '#c9a45c', wheel: [['#14161b', '#f4efe6'], ['#252932', '#f4efe6'], ['#14161b', '#f4efe6'], ['#252932', '#f4efe6'], ['#14161b', '#f4efe6'], ['#c9a45c', '#14110b'], ['#252932', '#f4efe6'], ['#f3dfae', '#14110b']],
      wheelStroke: '#c9a45c', confetti: ['#c9a45c', '#f3dfae', '#f4efe6', '#8a6a2c'], artOutline: null, artStroke: 2 }
  },
  {
    id: 'trendy', region: 'chinese', nameKey: 'style.trendy.name', descKey: 'style.trendy.desc', template: 'classic', navPosition: 'bottom', desktopNav: 'top',
    colors: { primary: '#d4ff3a', primaryHover: '#c2ee28', secondary: '#d8b45c', background: '#0c0c0e', surface: '#151518', surface2: '#1c1c20',
      textPrimary: '#f3f2ee', textSecondary: '#8d8d95', onPrimary: '#111113', border: '#2c2c32', success: '#3ddc97', warning: '#f5b400', error: '#ff5b4f' },
    button: { style: 'rounded', borderRadius: '10px', fontWeight: '700', textTransform: 'none', shadow: 'none', border: '0', background: 'var(--color-primary)' },
    typography: { display: "'Space Grotesk','Noto Sans SC','Noto Sans JP',sans-serif", body: "'Noto Sans SC','Noto Sans JP',system-ui,sans-serif", titleTransform: 'none', titleWeight: '700' },
    surface: { cardRadius: '16px', cardBorder: '1px solid #2c2c32', cardShadow: 'none', tileBackground: 'radial-gradient(120% 90% at 50% 30%,#f7f6f2,#ecebe6 55%,#dddcd6)', backgroundImage: 'none' },
    componentOrder: ['banner', 'games', 'boxes', 'topPulls'],
    navItems: ['home', 'kuji', 'wheel', 'gacha', 'me'],
    canvas: { capsules: ['#f4f3ef', '#2b2b31', '#d4ff3a', '#9d9da4', '#c9c8c1', '#3e4a68', '#5d5d66'], boxes: ['#ecebe6', '#dcdad3', '#e6e4dd', '#d3d1ca', '#efeee9', '#c9c7c0'],
      clawBackground: ['#1e1e22', '#0e0e10'], clawAccent: '#d4ff3a', wheel: [['#1d1d21', '#f3f2ee'], ['#ecebe6', '#111'], ['#1d1d21', '#f3f2ee'], ['#ecebe6', '#111'], ['#1d1d21', '#f3f2ee'], ['#d8b45c', '#111'], ['#ecebe6', '#111'], ['#d4ff3a', '#111']],
      wheelStroke: '#0c0c0e', confetti: ['#d4ff3a', '#f3f2ee', '#d8b45c', '#9d9da4', '#bdf3ff'], artOutline: null, artStroke: 2 }
  },
  {
    id: 'soft', region: 'chinese', nameKey: 'style.soft.name', descKey: 'style.soft.desc', template: 'customise', navPosition: 'bottom', desktopNav: 'top',
    colors: { primary: '#ff6b6b', primaryHover: '#ff5252', secondary: '#1d1b19', background: '#f6f3ef', surface: '#ffffff', surface2: '#f4f0ea',
      textPrimary: '#1d1b19', textSecondary: '#8e877d', onPrimary: '#ffffff', border: '#e7e1d8', success: '#2f9e7a', warning: '#ffb347', error: '#ff6b6b' },
    button: { style: 'pill', borderRadius: '999px', fontWeight: '700', textTransform: 'none', shadow: 'none', border: '0', background: 'var(--color-primary)' },
    typography: { display: "'Outfit','Noto Sans SC','Noto Sans JP',sans-serif", body: "'DM Sans','Noto Sans SC','Noto Sans JP',sans-serif", titleTransform: 'none', titleWeight: '700' },
    surface: { cardRadius: '20px', cardBorder: '0', cardShadow: '0 6px 20px #6b5a4014', tileBackground: 'radial-gradient(circle at 50% 35%,#ffffff,#f3eee6 75%)', backgroundImage: 'none' },
    componentOrder: ['search', 'banner', 'categories', 'boxes', 'games', 'topPulls'],
    navItems: ['home', 'play', 'games', 'market', 'me'],
    canvas: { capsules: ['#ffb3c7', '#ffe29a', '#b8e6ff', '#d6c4ff', '#bdf0d8', '#ffffff', '#ffcfa8'], boxes: ['#ffe3dc', '#e9f1ff', '#e8f7ef', '#fff3dd', '#f1eaff', '#e6f6f8'],
      clawBackground: ['#e8f7ef', '#cdeedd'], clawAccent: '#ff6b6b', wheel: [['#ffe3dc', '#1d1b19'], ['#e9f1ff', '#1d1b19'], ['#e8f7ef', '#1d1b19'], ['#fff3dd', '#1d1b19'], ['#f1eaff', '#1d1b19'], ['#ffd27a', '#1d1b19'], ['#e6f6f8', '#1d1b19'], ['#ff6b6b', '#ffffff']],
      wheelStroke: '#ffffff', confetti: ['#ff8fa8', '#ffd27a', '#7aa7ff', '#5cc29a', '#a98bff'], artOutline: null, artStroke: 2 }
  }
];

export const STYLE_REGIONS: StyleRegion[] = ['japanese', 'western', 'chinese'];

export function findPreset(id: StyleId | null | undefined): StylePreset {
  return STYLE_PRESETS.find(p => p.id === id) ?? STYLE_PRESETS[0];
}
