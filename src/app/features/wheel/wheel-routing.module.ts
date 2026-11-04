import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WheelPageComponent } from './pages/wheel-page/wheel-page.component';

const routes: Routes = [{ path: '', component: WheelPageComponent }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class WheelRoutingModule {}
