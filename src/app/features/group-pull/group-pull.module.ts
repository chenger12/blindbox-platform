import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { GroupPullRoutingModule } from './group-pull-routing.module';
import { GroupPullPageComponent } from './pages/group-pull-page/group-pull-page.component';

@NgModule({
  declarations: [GroupPullPageComponent],
  imports: [SharedModule, GroupPullRoutingModule]
})
export class GroupPullModule {}
