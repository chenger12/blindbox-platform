import { Directive, ElementRef, Input, OnChanges, Renderer2, RendererStyleFlags2 } from '@angular/core';

/**
 * Sets CSS custom properties on the host through Renderer2, e.g.
 * `[mbVars]="{ '--progress': 0.4 }"`. Used instead of inline style attributes.
 */
@Directive({ selector: '[mbVars]' })
export class CssVarsDirective implements OnChanges {
  @Input() mbVars: Record<string, string | number | null | undefined> | null = null;
  private applied: string[] = [];

  constructor(private readonly el: ElementRef<HTMLElement>, private readonly renderer: Renderer2) {}

  ngOnChanges(): void {
    const next = this.mbVars ?? {};
    this.applied.filter(k => !(k in next)).forEach(k => this.renderer.removeStyle(this.el.nativeElement, k, RendererStyleFlags2.DashCase));
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined) { this.renderer.removeStyle(this.el.nativeElement, k, RendererStyleFlags2.DashCase); }
      else { this.renderer.setStyle(this.el.nativeElement, k, String(v), RendererStyleFlags2.DashCase); }
    });
    this.applied = Object.keys(next);
  }
}
