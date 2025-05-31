import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JiraService {
  private apiUrl = 'https://localhost:7104/api/jira'; 

  constructor(private http: HttpClient) {}

 getJiraProjects(email: string, token: string, domaine: string): Observable<any> {
  const body = { email: email, apiToken: token, domaine: domaine };
  return this.http.post(`${this.apiUrl}/projects`, body, {
    responseType: 'json',
  });
}

  getJiraTasks(email: string, token: string, projectId: string , domaine:string): Observable<any> {
    console.log(projectId);
    return this.http.get(`${this.apiUrl}/issues`, {
      params: {
        email: email,
        apiToken: token,
        projectName: `${projectId}`,
        domaine: domaine // Filtrer les tâches du projet
      },
      responseType: 'json',
    });
  }
  
}