import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
import { ParetoAnalysisComponent } from './pages/pareto-analysis/pareto-analysis.component';
import { SprintScheduleComponent } from './pages/sprint-schedule/sprint-schedule.component';
import { DisciplinesSheetComponent } from './pages/disciplines-sheet/disciplines-sheet.component';
import { EditaisCatalogComponent } from './pages/editais-catalog/editais-catalog.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { PomodoroComponent } from './pages/pomodoro/pomodoro.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'student', component: StudentDashboardComponent },
  { path: 'pareto/:id', component: ParetoAnalysisComponent },
  { path: 'sprints/:id', component: SprintScheduleComponent },
  { path: 'disciplinas/:id', component: DisciplinesSheetComponent },
  { path: 'editais-catalog', component: EditaisCatalogComponent },
  { path: 'pomodoro', component: PomodoroComponent },
  { path: 'pomodoro/:editalId', component: PomodoroComponent },
  { path: '**', redirectTo: '' }
];





