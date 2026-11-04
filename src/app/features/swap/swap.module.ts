import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { SwapCreateDialogComponent } from './components/swap-create-dialog/swap-create-dialog.component';
import { SwapOfferDialogComponent } from './components/swap-offer-dialog/swap-offer-dialog.component';
import { SwapPostComponent } from './components/swap-post/swap-post.component';
import { SwapRulesDialogComponent } from './components/swap-rules-dialog/swap-rules-dialog.component';
import { SwapPageComponent } from './pages/swap-page/swap-page.component';
import { SwapRoutingModule } from './swap-routing.module';

@NgModule({
  declarations: [SwapPageComponent, SwapPostComponent, SwapOfferDialogComponent, SwapCreateDialogComponent, SwapRulesDialogComponent],
  imports: [SharedModule, SwapRoutingModule]
})
export class SwapModule {}
