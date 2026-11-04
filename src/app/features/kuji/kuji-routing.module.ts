import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KujiPageComponent } from './pages/kuji-page/kuji-page.component';

const routes: Routes = [{ path: '', component: KujiPageComponent }];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class KujiRoutingModule {}
