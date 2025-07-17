import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  indicators: any = null;
  bugsByUser: any[] = [];
  bugsOverTime: any[] = [];
  bugsByPriority: any[] = [];
  testTimeByFeature: any[] = [];
} 