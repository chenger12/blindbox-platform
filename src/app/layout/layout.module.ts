import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AppShellComponent } from './components/app-shell/app-shell.component';
import { HomeSectionComponent } from './components/home-section/home-section.component';
import { TemplateResolverComponent } from './components/template-resolver/template-resolver.component';
import { TickerComponent } from './components/ticker/ticker.component';
import { BannerSectionComponent } from './sections/banner-section/banner-section.component';
import { BattlesSectionComponent } from './sections/battles-section/battles-section.component';
import { BoxesSectionComponent } from './sections/boxes-section/boxes-section.component';
import { CategoriesSectionComponent } from './sections/categories-section/categories-section.component';
import { CheckInSectionComponent } from './sections/check-in-section/check-in-section.component';
import { DropCalendarSectionComponent } from './sections/drop-calendar-section/drop-calendar-section.component';
import { GamesSectionComponent } from './sections/games-section/games-section.component';
import { LiveDropsSectionComponent } from './sections/live-drops-section/live-drops-section.component';
import { MissionsSectionComponent } from './sections/missions-section/missions-section.component';
import { PackDeckSectionComponent } from './sections/pack-deck-section/pack-deck-section.component';
import { PortfolioSectionComponent } from './sections/portfolio-section/portfolio-section.component';
import { QuickActionsSectionComponent } from './sections/quick-actions-section/quick-actions-section.component';
import { SearchSectionComponent } from './sections/search-section/search-section.component';
import { TopPullsSectionComponent } from './sections/top-pulls-section/top-pulls-section.component';
import { ClassicLayoutComponent } from './templates/classic-layout/classic-layout.component';
import { CustomiseLayoutComponent } from './templates/customise-layout/customise-layout.component';
import { ModernLayoutComponent } from './templates/modern-layout/modern-layout.component';

@NgModule({
  declarations: [
    AppShellComponent, TemplateResolverComponent, HomeSectionComponent, TickerComponent,
    ModernLayoutComponent, ClassicLayoutComponent, CustomiseLayoutComponent,
    SearchSectionComponent, BannerSectionComponent, QuickActionsSectionComponent, CategoriesSectionComponent,
    BoxesSectionComponent, GamesSectionComponent, BattlesSectionComponent, TopPullsSectionComponent,
    CheckInSectionComponent, MissionsSectionComponent, PortfolioSectionComponent, PackDeckSectionComponent,
    DropCalendarSectionComponent, LiveDropsSectionComponent
  ],
  imports: [SharedModule],
  exports: [AppShellComponent, TemplateResolverComponent, CheckInSectionComponent, MissionsSectionComponent]
})
export class LayoutModule {}
