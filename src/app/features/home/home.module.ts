import { NgModule } from '@angular/core';
import { LayoutModule } from '../../layout/layout.module';
import { SharedModule } from '../../shared/shared.module';
import { HomeRoutingModule } from './home-routing.module';
import { GamesPageComponent } from './pages/games-page/games-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';

@NgModule({
  declarations: [HomePageComponent, GamesPageComponent],
  imports: [SharedModule, LayoutModule, HomeRoutingModule]
})
export class HomeModule {}
