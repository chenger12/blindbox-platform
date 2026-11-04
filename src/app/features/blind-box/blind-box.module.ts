import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { BlindBoxRoutingModule } from './blind-box-routing.module';
import { BlindBoxPageComponent } from './pages/blind-box-page/blind-box-page.component';

@NgModule({
  declarations: [BlindBoxPageComponent],
  imports: [SharedModule, BlindBoxRoutingModule]
})
export class BlindBoxModule {}
