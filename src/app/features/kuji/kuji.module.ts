import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { KujiBoxPickerComponent } from './components/kuji-box-picker/kuji-box-picker.component';
import { KujiShowComponent } from './components/kuji-show/kuji-show.component';
import { KujiRoutingModule } from './kuji-routing.module';
import { KujiPageComponent } from './pages/kuji-page/kuji-page.component';

@NgModule({
  declarations: [KujiPageComponent, KujiShowComponent, KujiBoxPickerComponent],
  imports: [SharedModule, KujiRoutingModule]
})
export class KujiModule {}
