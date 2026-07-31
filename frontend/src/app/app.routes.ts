import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
import { ParetoAnalysisComponent } from './pages/pareto-analysis/pareto-analysis.component';
import { SprintScheduleComponent } from './pages/sprint-schedule/sprint-schedule.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'student', component: StudentDashboardComponent },
  { path: 'pareto/:id', component: ParetoAnalysisComponent },
  { path: 'sprints/:id', component: SprintScheduleComponent },
  { path: '**', redirectTo: 'login' }
];
