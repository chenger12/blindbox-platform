import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { BoxesRoutingModule } from './boxes-routing.module';
import { BoxDetailPageComponent } from './pages/box-detail-page/box-detail-page.component';
import { BoxListPageComponent } from './pages/box-list-page/box-list-page.component';

@NgModule({
  declarations: [BoxListPageComponent, BoxDetailPageComponent],
  imports: [SharedModule, BoxesRoutingModule]
})
export class BoxesModule {}
