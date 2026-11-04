import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryPageComponent } from './pages/inventory-page/inventory-page.component';
import { RewardsPageComponent } from './pages/rewards-page/rewards-page.component';

const routes: Routes = [
  { path: '', component: InventoryPageComponent },
  { path: 'rewards', component: RewardsPageComponent }
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class MeRoutingModule {}
