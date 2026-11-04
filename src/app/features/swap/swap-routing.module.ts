import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SwapPageComponent } from './pages/swap-page/swap-page.component';

const routes: Routes = [{ path: '', component: SwapPageComponent }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class SwapRoutingModule {}
