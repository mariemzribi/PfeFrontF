import { Routes } from '@angular/router';
import { UserComponent } from './user/user.component';
import { RegistrationComponent } from './user/registration/registration.component';
import { LoginComponent } from './user/login/login.component';
import {JiraComponent } from './jira/jira.component';
import { DashboardComponent } from './dashboard/dashboard.component';
export const routes: Routes = [
  { path: '', redirectTo: '/signin', pathMatch: 'full' },
  {
    path: '', component: UserComponent,
    children: [
      { path: 'signin', component: LoginComponent },
      { path: 'signup', component: RegistrationComponent },
      
    ]
  },
  { path: 'jira', component: JiraComponent },
  { path: 'dashboard', component: DashboardComponent }
];