import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LevelsComponent } from './pages/levels/levels.component';

export const routes: Routes = [
  { path: '',        component: DashboardComponent },
  { path: 'levels',  component: LevelsComponent },
  { path: '**',      redirectTo: '' }
];
