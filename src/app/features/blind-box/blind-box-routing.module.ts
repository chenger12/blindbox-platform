import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlindBoxPageComponent } from './pages/blind-box-page/blind-box-page.component';

const routes: Routes = [{ path: '', component: BlindBoxPageComponent }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class BlindBoxRoutingModule {}
