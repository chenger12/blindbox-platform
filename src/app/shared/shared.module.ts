import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AvatarComponent } from './components/avatar/avatar.component';
import { BoxArtComponent } from './components/box-art/box-art.component';
import { BoxCardComponent } from './components/box-card/box-card.component';
import { CoinComponent } from './components/coin/coin.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { GameCardComponent } from './components/game-card/game-card.component';
import { GameFrameComponent } from './components/game-frame/game-frame.component';
import { ItemTileComponent } from './components/item-tile/item-tile.component';
import { OddsDialogComponent } from './components/odds-dialog/odds-dialog.component';
import { PrizeArtComponent } from './components/prize-art/prize-art.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { ReelComponent } from './components/reel/reel.component';
import { ResultDialogComponent } from './components/result-dialog/result-dialog.component';
import { SellDialogComponent } from './components/sell-dialog/sell-dialog.component';
import { SectionHeaderComponent } from './components/section-header/section-header.component';
import { TierTagComponent } from './components/tier-tag/tier-tag.component';
import { CssVarsDirective } from './directives/css-vars.directive';
import { AgoPipe } from './pipes/ago.pipe';
import { CoinsPipe } from './pipes/coins.pipe';
import { ItemNamePipe } from './pipes/item-name.pipe';
import { TranslatePipe } from './pipes/translate.pipe';
import { UserNamePipe } from './pipes/user-name.pipe';

const DECLARATIONS = [
  AvatarComponent, BoxArtComponent, BoxCardComponent, CoinComponent, EmptyStateComponent, GameCardComponent,
  GameFrameComponent, ItemTileComponent, OddsDialogComponent, PrizeArtComponent, ProgressBarComponent, ReelComponent,
  ResultDialogComponent, SectionHeaderComponent, SellDialogComponent, TierTagComponent,
  CssVarsDirective, AgoPipe, CoinsPipe, ItemNamePipe, TranslatePipe, UserNamePipe
];

@NgModule({
  declarations: DECLARATIONS,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatDialogModule, MatSnackBarModule],
  exports: [...DECLARATIONS, CommonModule, RouterModule, ReactiveFormsModule, MatDialogModule]
})
export class SharedModule {}
