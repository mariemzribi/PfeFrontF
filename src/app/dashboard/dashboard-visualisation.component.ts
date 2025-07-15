import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TokenService } from '../shared/services/token.service';

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
  imports: [CommonModule, MatCardModule, MatIconModule, DecimalPipe],
  templateUrl: './dashboard-visualisation.component.html',
  styleUrls: ['./dashboard-visualisation.component.css'],
  providers: [DecimalPipe]
})
export class DashboardVisualisationComponent implements OnInit {
  indicators: DashboardIndicators | null = null;
  isLoading = true;
  error: string = '';

  private tokenService = inject(TokenService);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const email = this.tokenService.getEmail();
    const token = this.tokenService.getToken();
    const domaine = this.tokenService.getDomaine();
    if (!email || !token || !domaine) {
      this.error = 'Identifiants manquants';
      this.isLoading = false;
      return;
    }
    const url = `/api/dashboard/indicators?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&domaine=${encodeURIComponent(domaine)}`;
    this.http.get<DashboardIndicators>(url).subscribe({
      next: (data) => {
        this.indicators = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors de la récupération des indicateurs';
        this.isLoading = false;
      }
    });
  }
} 