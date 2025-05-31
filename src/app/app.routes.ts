import { Routes } from '@angular/router';
import { UserComponent } from './user/user.component';
import { RegistrationComponent } from './user/registration/registration.component';
import { LoginComponent } from './user/login/login.component';
import {JiraComponent } from './jira/jira.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BiComponent} from './bi/bi.component';    
import { AuthGuard } from './auth.guard';
export const routes: Routes = [
  { path: '', redirectTo: '/signin', pathMatch: 'full' },
  {
    path: '', component: UserComponent,
    children: [
      { path: 'signin', component: LoginComponent },
      { path: 'signup', component: RegistrationComponent },
      
    ]
  },
  
  { path: 'jira', component: JiraComponent ,canActivate: [AuthGuard]},
  { path: 'dashboard', component: DashboardComponent ,canActivate: [AuthGuard] },
  {path: 'Bi', component : BiComponent ,canActivate: [AuthGuard]}
];