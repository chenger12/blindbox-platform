import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

/** Native-only touches when the app runs inside the iOS / Android shell. No-ops on the website. */
@Injectable({ providedIn: 'root' })
export class NativeService {
  readonly isNative = Capacitor.isNativePlatform();
  readonly platform = Capacitor.getPlatform();

  init(darkBackground: boolean): void {
    if (!this.isNative) { return; }
    document.documentElement.classList.add('is-native', 'is-' + this.platform);
    void StatusBar.setOverlaysWebView({ overlay: true }).catch(() => undefined);
    void StatusBar.setStyle({ style: darkBackground ? Style.Dark : Style.Light }).catch(() => undefined);
  }

  /** Returns true when a native haptic was fired. */
  haptic(pattern: number | number[]): boolean {
    if (!this.isNative) { return false; }
    const strong = Array.isArray(pattern) ? pattern.length > 3 || Math.max(...pattern) >= 100 : pattern >= 60;
    void Haptics.impact({ style: strong ? ImpactStyle.Heavy : ImpactStyle.Light }).catch(() => undefined);
    return true;
  }
}
