import { Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, RendererStyleFlags2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameMeta } from '../../../models/game/game.model';
import { GameId } from '../../../models/theme/theme.model';
import { GameRegistryService } from '../../../services/game-registry/game-registry.service';
import { ThemeService } from '../../../services/theme/theme.service';

/**
 * Wrapper every game page sits in. Applies the admin's per-game style override as scoped
 * CSS variables, and shows the title, how-to and links to the other enabled games.
 */
@Component({
  selector: 'app-game-frame',
  templateUrl: './game-frame.component.html',
  styleUrl: './game-frame.component.scss'
})
export class GameFrameComponent implements OnInit, OnDestroy {
  @Input({ required: true }) gameId!: GameId;
  @Input() wide = false;
  meta!: GameMeta;
  showHow = false;
  private applied: string[] = [];
  private sub?: Subscription;

  constructor(
    readonly registry: GameRegistryService,
    private readonly theme: ThemeService,
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.meta = this.registry.meta(this.gameId);
    this.sub = this.theme.config$.subscribe(() => this.applyScope());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private applyScope(): void {
    const host = this.el.nativeElement;
    this.applied.forEach(k => this.renderer.removeStyle(host, k, RendererStyleFlags2.DashCase));
    const vars = this.theme.scopedVars(this.gameId) ?? {};
    Object.entries(vars).forEach(([k, v]) => this.renderer.setStyle(host, k, v, RendererStyleFlags2.DashCase));
    this.applied = Object.keys(vars);
    if (this.applied.length) { this.renderer.addClass(host, 'scoped'); } else { this.renderer.removeClass(host, 'scoped'); }
    this.renderer.setAttribute(host, 'data-style', this.theme.effectiveStyle(this.gameId));
  }
}
