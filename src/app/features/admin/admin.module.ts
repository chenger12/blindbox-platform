import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { SharedModule } from '../../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { BrandTabComponent } from './components/brand-tab/brand-tab.component';
import { GamesTabComponent } from './components/games-tab/games-tab.component';
import { LayoutTabComponent } from './components/layout-tab/layout-tab.component';
import { NavTabComponent } from './components/nav-tab/nav-tab.component';
import { ThemeTabComponent } from './components/theme-tab/theme-tab.component';
import { AdminDashboardPageComponent } from './pages/admin-dashboard-page/admin-dashboard-page.component';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';

@NgModule({
  declarations: [
    AdminLoginPageComponent, AdminDashboardPageComponent,
    ThemeTabComponent, GamesTabComponent, LayoutTabComponent, NavTabComponent, BrandTabComponent
  ],
  imports: [SharedModule, AdminRoutingModule, DragDropModule, MatTabsModule, MatSlideToggleModule, MatButtonModule, MatButtonToggleModule]
})
export class AdminModule {}
