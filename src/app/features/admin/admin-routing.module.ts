import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { adminAuthGuard } from '../../utils/admin-auth.guard';
import { AdminDashboardPageComponent } from './pages/admin-dashboard-page/admin-dashboard-page.component';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';

const routes: Routes = [
  { path: 'login', component: AdminLoginPageComponent },
  { path: '', component: AdminDashboardPageComponent, canActivate: [adminAuthGuard] }
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AdminRoutingModule {}
