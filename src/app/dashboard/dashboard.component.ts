import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { JiraService } from '../../app/shared/services/jira.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
interface Subtask {
  fields: {
    summary: string;
    status: {
      name: string;
    };
  };
}
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule, MatMenuModule],
  templateUrl: './dashboard.component.html',
  styleUrls: [] // Si vous utilisez un fichier CSS
})
export class DashboardComponent implements OnInit {
  TestCaseStatus: any[] = [];
  projects: any[] = []; // Tableau original des projets
  projectDictionary: { [key: string]: string } = {}; // Dictionnaire id -> name
  selectedProject: any = null; // Projet sélectionné
  tasks: any[] = [];
  subtasks: any[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  summaries: string[] = [];
 // Tableau des tâches du projet sélectionné
  errorMessage: string = ''; // Message d'erreur
  displayedColumns: string[] = [
    'id', 'key', 'summary', 'epic', 'issuetype', 'status', 
    'sprint', 'assignee', 'qaCreation', 'qaReview','QA Test case execution','Regression Test Case Creation','Regression Test Case Review', 'status test','regPackage', 'Comment'
  ];
  constructor(
    private jiraService: JiraService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (email && token) {
      this.jiraService.getJiraProjects(email, token).subscribe({
        next: (data: any) => {
          this.projects = data; // Conservez le tableau original si nécessaire
          this.createProjectDictionary(data); // Créez le dictionnaire
        },
        error: (error: any) => {
          this.errorMessage = 'Erreur lors de la récupération des projets Jira.';
          console.error(error);
        },
      });
    } else {
      this.errorMessage = 'Email ou token manquant.';
    }
  }
  // ngAfterViewInit(): void {  
  //   if (this.paginator && this.sort) {  
  //     this.tasks.paginator = this.paginator;  
  //     this.tasks.sort = this.sort;  
  //   }  
  // }  

  // Méthode pour créer le dictionnaire
  createProjectDictionary(projects: any[]): void {
    this.projectDictionary = {}; // Réinitialisez le dictionnaire
    projects.forEach(project => {
      this.projectDictionary[project.id] = project.name; // Ajoutez chaque projet au dictionnaire
    });
  }

  // Méthode pour récupérer les clés du dictionnaire
  getProjectIds(): string[] {
    return Object.keys(this.projectDictionary);
  }
  // Méthode pour sélectionner un projet et charger ses tâches
  selectProject(id: string): void {
    this.selectedProject = this.projects.find(project => project.id === id);
    if (this.selectedProject) {
      this.loadJiraTasks(this.selectedProject.id); // Charger les tâches pour le projet sélectionné
    }
  }
  // Méthode pour charger les tâches du projet sélectionné
  loadJiraTasks(projectId: string): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (email && token) {
      this.jiraService.getJiraTasks(email, token, projectId).subscribe({
        next: (data: any) => {
          this.tasks = data.issues;
          console.log(this.tasks);
          this.tasks = this.tasks.filter(task =>
            ['Story', 'User Story', 'Bug'].includes(task.fields.issuetype.name)
          );
          this.tasks.forEach((task, i) => {
            console.log('Task', i + 1); // Affiche le numéro de la tâche (i + 1)
            console.log('ID:', task.id);
            console.log('Key:', task.key);
            console.log('Summary:', task.fields.summary);
            console.log(task.fields.parent && task.fields.parent.key ? task.fields.parent.key : 'N/A');
            console.log('Issue Type:', task.fields.issuetype.name || 'N/A');
            console.log('Status:', task.fields.status.name || 'N/A');
            console.log('Sprint:', task.fields.status.name || 'N/A');
            console.log('Reg Package:', task.fields.regPackage || 'N/A');
            console.log('Customfield_10020:', task.fields.customfield_10020 && task.fields.customfield_10020[0] ? task.fields.customfield_10020[0].name : 'N/A');
            console.log('Assignee:', task.fields.assignee ? task.fields.assignee.displayName : 'N/A');
            console.log(); // Affichez dans la console pour vérifier
            //console.log('hh',task.fields.subtasks.fields.summary);  // Example: Accessing the summary of the first subtask
            console.log('QA Creation:', this.getTaskStatusCreation(task));
            console.log('QA Review:', this.getTaskStatusReview(task));
            // console.log('Regression Creation:', task.fields.regressionCreation || 'N/A');
            // console.log('Regression Review:', task.fields.regressionReview || 'N/A');
            // console.log('SIT Creation:', task.fields.sitCreation || 'N/A');
            // console.log('SIT Review:', task.fields.sitReview || 'N/A');
            // console.log('Deploy:', task.fields.deploy || 'N/A');
            // console.log('Assign to:', task.fields.assignee ? task.fields.assignee.displayName : 'N/A');
            console.log('Status Test:', task.fields.statusTest || 'N/A');
            console.log('Comment:', task.fields.comment || 'N/A');
          });
        },
        error: (error: any) => {
          this.errorMessage = 'Erreur lors de la récupération des tâches.';
          console.error(error);
        },
      });
    }

  }

  getTaskStatusCreation(task: any): string {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find((sub: any) => sub.fields.summary === 'QA Test case creation');
      if (subtask) {
        return subtask.fields.status.name || 'Statut inconnu';
      }
      console.log('Sous-tâche QA Test case creation non trouvée');
    }
    return 'Statut non disponible';
  }

  getTaskStatusReview(task: any): string {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find((sub: any) => sub.fields.summary === 'QA Test case review');
      if (subtask) {
        return subtask.fields.status.name || 'Statut inconnu';
      }
      console.log('Sous-tâche QA Test case review non trouvée');
    }
    return 'Statut non disponible';
  }

  getTaskStatusExecution(task: any): string {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find((sub: any) => sub.fields.summary === 'QA Test case execution');
      if (subtask) {
        return subtask.fields.status.name || 'Statut inconnu';
      }
      console.log('Sous-tâche QA Test case creation non trouvée');
    }
    return 'Statut non disponible';
  }

  getTaskStatusRview(task: any): string {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find((sub: any) => sub.fields.summary === 'Regression Test Case Review');
      if (subtask) {
        return subtask.fields.status.name || 'Statut inconnu';
      }
      console.log('Sous-tâche QA Test case creation non trouvée');
    }
    return 'Statut non disponible';
  }

  getTaskStatusRCreation(task: any): string {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find((sub: any) => sub.fields.summary === 'Regression Test Case Creation');
      if (subtask) {
        return subtask.fields.status.name || 'Statut inconnu';
      }
      console.log('Sous-tâche QA Test case creation non trouvée');
    }
    return 'Statut non disponible';
  }

}

//if TICKET = Sub task
//Find parent id 
