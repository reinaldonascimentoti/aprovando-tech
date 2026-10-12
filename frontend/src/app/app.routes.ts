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
import { LegislacaoListComponent } from './pages/legislacao/legislacao-list.component';
import { LegislacaoNewComponent } from './pages/legislacao/legislacao-new.component';
import { LegislacaoDetailComponent } from './pages/legislacao/legislacao-detail.component';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'student', component: StudentDashboardComponent, canActivate: [authGuard] },
  { path: 'pareto/:id', component: ParetoAnalysisComponent, canActivate: [authGuard] },
  { path: 'sprints/:id', component: SprintScheduleComponent, canActivate: [authGuard] },
  { path: 'disciplinas/:id', component: DisciplinesSheetComponent, canActivate: [authGuard] },
  { path: 'editais-catalog', component: EditaisCatalogComponent, canActivate: [authGuard] },
  { path: 'pomodoro', component: PomodoroComponent, canActivate: [authGuard] },
  { path: 'pomodoro/:editalId', component: PomodoroComponent, canActivate: [authGuard] },
  { path: 'legislacao', component: LegislacaoListComponent, canActivate: [authGuard] },
  { path: 'legislacao/nova', component: LegislacaoNewComponent, canActivate: [authGuard] },
  { path: 'legislacao/:id', component: LegislacaoDetailComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];






