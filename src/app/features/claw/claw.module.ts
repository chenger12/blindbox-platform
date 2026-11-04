import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ClawRoutingModule } from './claw-routing.module';
import { ClawPageComponent } from './pages/claw-page/claw-page.component';

@NgModule({
  declarations: [ClawPageComponent],
  imports: [SharedModule, ClawRoutingModule]
})
export class ClawModule {}
