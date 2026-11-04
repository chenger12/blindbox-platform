import { NgModule } from '@angular/core';
import { LayoutModule } from '../../layout/layout.module';
import { SharedModule } from '../../shared/shared.module';
import { MeTabsComponent } from './components/me-tabs/me-tabs.component';
import { MeRoutingModule } from './me-routing.module';
import { InventoryPageComponent } from './pages/inventory-page/inventory-page.component';
import { RewardsPageComponent } from './pages/rewards-page/rewards-page.component';

@NgModule({
  declarations: [InventoryPageComponent, RewardsPageComponent, MeTabsComponent],
  imports: [SharedModule, LayoutModule, MeRoutingModule]
})
export class MeModule {}
