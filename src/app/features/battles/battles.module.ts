import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { BattlesRoutingModule } from './battles-routing.module';
import { CreateBattleDialogComponent } from './components/create-battle-dialog/create-battle-dialog.component';
import { BattlesPageComponent } from './pages/battles-page/battles-page.component';

@NgModule({
  declarations: [BattlesPageComponent, CreateBattleDialogComponent],
  imports: [SharedModule, BattlesRoutingModule]
})
export class BattlesModule {}
