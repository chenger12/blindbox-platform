import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoxDetailPageComponent } from './pages/box-detail-page/box-detail-page.component';
import { BoxListPageComponent } from './pages/box-list-page/box-list-page.component';

const routes: Routes = [
  { path: '', component: BoxListPageComponent },
  { path: ':id', component: BoxDetailPageComponent }
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class BoxesRoutingModule {}
