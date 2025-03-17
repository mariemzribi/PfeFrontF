import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JiraService {
  private apiUrl = 'https://localhost:7104/api/jira'; 

  constructor(private http: HttpClient) {}

  getJiraProjects(email: string, token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/projects`, {
      params: { email: email, apiToken: token },
      responseType: 'json',
    });
  }
  getJiraTasks(email: string, token: string, projectId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/issues`, {
      params: {
        email: email,
        apiToken: token,
        projectName: `${projectId}` // Filtrer les tâches du projet
      },
      responseType: 'json',
    });
  }
  
}