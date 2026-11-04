import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { WheelPageComponent } from './pages/wheel-page/wheel-page.component';
import { WheelRoutingModule } from './wheel-routing.module';

@NgModule({
  declarations: [WheelPageComponent],
  imports: [SharedModule, WheelRoutingModule]
})
export class WheelModule {}
