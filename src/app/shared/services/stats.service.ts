import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatsService {
  constructor(private http: HttpClient) {}

  getBugsByUserJira(email: string, token: string, domaine: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/stats/bugs-by-user-jira`, { params: { email, token, domaine } });
  }

  getBugsOverTimeJira(email: string, token: string, domaine: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/stats/bugs-over-time-jira`, { params: { email, token, domaine } });
  }

  getBugsByPriorityJira(email: string, token: string, domaine: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/stats/bugs-by-priority-jira`, { params: { email, token, domaine } });
  }

  getTestTimeByFeatureJira(email: string, token: string, domaine: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/stats/test-time-by-feature-jira`, { params: { email, token, domaine } });
  }
} 