import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PomodoroWidgetComponent } from './components/pomodoro-widget/pomodoro-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PomodoroWidgetComponent],
  template: `
    <router-outlet></router-outlet>
    <app-pomodoro-widget />
  `
})
export class AppComponent {
  title = 'Aprovando Tech';
}
