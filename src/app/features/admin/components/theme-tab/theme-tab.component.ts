import { Component, Input } from '@angular/core';
import { StylePreset, StyleRegion } from '../../../../models/theme/theme.model';
import { STYLE_PRESETS, STYLE_REGIONS } from '../../../../utils/style-presets';
import { ConfigForm } from '../../../../utils/config-form.util';

export const FONT_OPTIONS = [
  "'Inter','Noto Sans JP','Noto Sans SC',sans-serif",
  "'Chakra Petch','Noto Sans JP','Inter',sans-serif",
  "'Sora','Noto Sans JP','Inter',sans-serif",
  "'Anton','Noto Sans JP','Inter',sans-serif",
  "'Archivo Black','Noto Sans JP','Inter',sans-serif",
  "'Playfair Display','Noto Serif JP',serif",
  "'Space Grotesk','Noto Sans SC','Noto Sans JP',sans-serif",
  "'Outfit','Noto Sans SC','Noto Sans JP',sans-serif",
  "'DM Sans','Noto Sans SC','Noto Sans JP',sans-serif",
  "'Noto Sans SC','Noto Sans JP',system-ui,sans-serif"
];

@Component({
  selector: 'app-theme-tab',
  templateUrl: './theme-tab.component.html',
  styleUrl: './theme-tab.component.scss'
})
export class ThemeTabComponent {
  @Input({ required: true }) form!: ConfigForm;
  readonly regions: StyleRegion[] = STYLE_REGIONS;
  readonly fonts = FONT_OPTIONS;
  readonly colorKeys = ['primary', 'primaryHover', 'secondary', 'background', 'surface', 'surface2', 'textPrimary', 'textSecondary', 'onPrimary', 'border', 'success', 'warning', 'error'] as const;

  presets(region: StyleRegion): StylePreset[] {
    return STYLE_PRESETS.filter(p => p.region === region);
  }

  fontLabel(f: string): string {
    return f.split(',')[0].replace(/'/g, '');
  }

  vars(p: StylePreset): Record<string, string> {
    return {
      '--p-bg': p.colors.background, '--p-surface': p.colors.surface, '--p-primary': p.colors.primary,
      '--p-secondary': p.colors.secondary, '--p-ink': p.colors.textPrimary, '--p-muted': p.colors.textSecondary,
      '--p-on': p.colors.onPrimary, '--p-btn': p.button.background.replace('var(--color-primary)', p.colors.primary), '--p-radius': p.button.borderRadius,
      '--p-card-radius': p.surface.cardRadius, '--p-font': p.typography.display, '--p-border': p.surface.cardBorder,
      '--p-shadow': p.button.shadow, '--p-btn-border': p.button.border, '--p-tile': p.surface.tileBackground
    };
  }

  apply(p: StylePreset): void {
    this.form.patchValue({
      styleId: p.id, template: p.template,
      colors: { ...p.colors }, button: { ...p.button }, typography: { ...p.typography }, surface: { ...p.surface },
      layout: { navPosition: p.navPosition, desktopNav: p.desktopNav, componentOrder: [...p.componentOrder], navItems: [...p.navItems] }
    });
  }

  setButtonStyle(style: 'rounded' | 'square' | 'pill'): void {
    this.form.controls.button.patchValue({ style, borderRadius: style === 'pill' ? '999px' : style === 'square' ? '3px' : '10px' });
  }
}
