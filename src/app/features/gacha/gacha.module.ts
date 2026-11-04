import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { GachaRoutingModule } from './gacha-routing.module';
import { GachaPageComponent } from './pages/gacha-page/gacha-page.component';

@NgModule({
  declarations: [GachaPageComponent],
  imports: [SharedModule, GachaRoutingModule]
})
export class GachaModule {}
