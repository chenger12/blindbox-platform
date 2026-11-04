import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClawPageComponent } from './pages/claw-page/claw-page.component';

const routes: Routes = [{ path: '', component: ClawPageComponent }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ClawRoutingModule {}
