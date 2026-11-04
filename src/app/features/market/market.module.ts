import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { MarketRoutingModule } from './market-routing.module';
import { MarketPageComponent } from './pages/market-page/market-page.component';

@NgModule({
  declarations: [MarketPageComponent],
  imports: [SharedModule, MarketRoutingModule]
})
export class MarketModule {}
