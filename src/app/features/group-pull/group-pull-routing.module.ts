import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupPullPageComponent } from './pages/group-pull-page/group-pull-page.component';

const routes: Routes = [{ path: '', component: GroupPullPageComponent }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class GroupPullRoutingModule {}
