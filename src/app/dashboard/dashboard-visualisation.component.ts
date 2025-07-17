import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TokenService } from '../shared/services/token.service';
import { StatsService } from '../shared/services/stats.service';
import { ChartsModule } from '../shared/charts.module';
import { ChartConfiguration, ChartType, ChartOptions, ChartData } from 'chart.js';
import { DashboardDataService } from '../shared/services/dashboard-data.service';

interface DashboardIndicators {
  totalBugs: number;
  averageTestTimeHours: number;
  storiesInProgress: number;
  criticalBugs: number;
  bugsByPriority?: { [priority: string]: number };
}

@Component({
  selector: 'app-dashboard-visualisation',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, DecimalPipe, ChartsModule],
  templateUrl: './dashboard-visualisation.component.html',
  styleUrls: ['./dashboard-visualisation.component.css'],
  providers: [DecimalPipe]
})
export class DashboardVisualisationComponent implements OnInit {
  indicators: DashboardIndicators | null = null;
  isLoading = true;
  error: string = '';

  // Charts data
  bugsByUserData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  bugsOverTimeData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  bugsByPriorityData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  testTimeByFeatureData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  // Mini-charts pour chaque indicateur clé
  miniPieDataTotalBugs = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [45, 17, 38],
        backgroundColor: ['#ff6f6f', '#e0e0e0', '#1cc7d0'],
        borderWidth: 0
      }
    ]
  };
  miniPieDataTestTime = {
    labels: ['Rapide', 'Moyen', 'Lent'],
    datasets: [
      {
        data: [60, 25, 15],
        backgroundColor: ['#fbbf24', '#fde68a', '#fef9c3'],
        borderWidth: 0
      }
    ]
  };
  miniPieDataStories = {
    labels: ['En cours', 'Terminées', 'À faire'],
    datasets: [
      {
        data: [10, 5, 3],
        backgroundColor: ['#ef4444', '#22c55e', '#e0e0e0'],
        borderWidth: 0
      }
    ]
  };
  miniPieDataCriticalBugs = {
    labels: ['Critique', 'Non critique'],
    datasets: [
      {
        data: [2, 8],
        backgroundColor: ['#7c3aed', '#e0e0e0'],
        borderWidth: 0
      }
    ]
  };
  miniPieOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '60%',
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: { enabled: true }
    }
  };

  private tokenService = inject(TokenService);

  constructor(private dashboardDataService: DashboardDataService) {}

  ngOnInit(): void {
    // Récupère les données partagées
    this.indicators = this.dashboardDataService.indicators;
    // Si les données sont vides, on initialise avec des exemples vides pour forcer l'affichage des charts
    this.bugsByUserData = {
      labels: this.dashboardDataService.bugsByUser.length ? this.dashboardDataService.bugsByUser.map((d: any) => d.User) : ['Aucun'],
      datasets: [{ data: this.dashboardDataService.bugsByUser.length ? this.dashboardDataService.bugsByUser.map((d: any) => d.BugCount) : [0], label: 'Bugs' }]
    };
    this.bugsOverTimeData = {
      labels: this.dashboardDataService.bugsOverTime.length ? this.dashboardDataService.bugsOverTime.map((d: any) => d.YearMonth) : ['Aucun'],
      datasets: [{ data: this.dashboardDataService.bugsOverTime.length ? this.dashboardDataService.bugsOverTime.map((d: any) => d.BugCount) : [0], label: 'Bugs Over Time', borderColor: '#3f51b5' }]
    };
    this.bugsByPriorityData = {
      labels: this.dashboardDataService.bugsByPriority.length ? this.dashboardDataService.bugsByPriority.map((d: any) => d.Priority) : ['Aucun'],
      datasets: [{ data: this.dashboardDataService.bugsByPriority.length ? this.dashboardDataService.bugsByPriority.map((d: any) => d.BugCount) : [0], label: 'Bugs par priorité' }]
    };
    this.testTimeByFeatureData = {
      labels: this.dashboardDataService.testTimeByFeature.length ? this.dashboardDataService.testTimeByFeature.map((d: any) => d.FeatureId) : ['Aucun'],
      datasets: [{ data: this.dashboardDataService.testTimeByFeature.length ? this.dashboardDataService.testTimeByFeature.map((d: any) => d.TotalTestTime) : [0], label: 'Temps de test (h)' }]
    };
    this.isLoading = false;
  }
} 