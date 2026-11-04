import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { gameEnabledGuard } from './utils/game-enabled.guard';

const game = (path: string, gameId: string, load: Routes[number]['loadChildren']): Routes[number] =>
  ({ path, loadChildren: load, canActivate: [gameEnabledGuard], data: { gameId } });

const routes: Routes = [
  { path: 'admin', loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) },
  game('boxes', 'boxes', () => import('./features/boxes/boxes.module').then(m => m.BoxesModule)),
  game('kuji', 'kuji', () => import('./features/kuji/kuji.module').then(m => m.KujiModule)),
  game('gacha', 'gacha', () => import('./features/gacha/gacha.module').then(m => m.GachaModule)),
  game('blind-box', 'blindBox', () => import('./features/blind-box/blind-box.module').then(m => m.BlindBoxModule)),
  game('claw', 'claw', () => import('./features/claw/claw.module').then(m => m.ClawModule)),
  game('group-pull', 'groupPull', () => import('./features/group-pull/group-pull.module').then(m => m.GroupPullModule)),
  game('battles', 'battles', () => import('./features/battles/battles.module').then(m => m.BattlesModule)),
  game('market', 'market', () => import('./features/market/market.module').then(m => m.MarketModule)),
  game('swap', 'swap', () => import('./features/swap/swap.module').then(m => m.SwapModule)),
  game('wheel', 'wheel', () => import('./features/wheel/wheel.module').then(m => m.WheelModule)),
  { path: 'me', loadChildren: () => import('./features/me/me.module').then(m => m.MeModule) },
  { path: '', loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule) },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true, scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
