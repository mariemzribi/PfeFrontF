import { Component, OnInit, ViewChild } from '@angular/core';
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
import { Router } from '@angular/router'; 
import { Observable, of } from 'rxjs';
import { SupplementService } from '../../app/shared/services/supplement.service';
import { MatDialog } from '@angular/material/dialog';
import { TaskComponent } from '../task/task.component';
import { TaskCSComponent } from '../task-cs/task-cs.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSpinner } from '@angular/material/progress-spinner'; // Assurez-vous d'importer cela
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';

interface Subtask {
  fields: {
    summary: string;
    status: {
      name: string;
    };
  };
}
interface Supplement {
  idSup?: number;
  usId: number;
  regPackageId?: number;
  comment?: string;
  timeNeededForTcCreation?: number;
  timeNeededToTest?: number;
  bugsRaised?: number;
  nbTc?: number;
  nbTcModified?: number;
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
    MatToolbarModule, MatMenuModule,MatProgressSpinnerModule,MatSpinner,MatInputModule,MatFormFieldModule,FormsModule,MatSelectModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'] // Si vous utilisez un fichier CSS
})
export class DashboardComponent implements OnInit {
  TestCaseStatus: any[] = [];
  projects: any[] = []; // Tableau original des projets
  projectDictionary: { [key: string]: string } = {}; // Dictionnaire id -> name
  selectedProject: any = null; // Projet sélectionné
  tasks: any[] = [];
  subtasks: any[] = [];
  allTasks: any[] = [];
  supplements: any[] = [];
  qaCreation: any[]= [];

  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
 
  projectSearchTerm: string = '';
  filteredProjectIds: string[] = [];
   // Vous pouvez ajouter des propriétés pour contrôler le spinner
   isLoading: boolean = true; // Affiche le spinner quand true
  spinnerColor: string = 'primary';
  spinnerMode: string = 'indeterminate';
  spinnerDiameter: number = 50;

  //nouvelle 
  // Variables nécessaires
searchTerm: string = '';
//selectedProjectId: string | null = null;
selectedProjectId: string = '';

  simulateLoading() {
    setTimeout(() => {
      this.isLoading = false; // Cache le spinner après 3 secondes
    }, 3000);
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  statusColorMap: { [key: string]: string } = {
    'To Do': '#FFCF79',       // Orange
    'À faire': '#FFCF79',     // Orange
    'In Progress': '#B4D8E7',   // Jaune
    'En cours': '#B4D8E7',      // Jaune
    'Done': '#B0E57C',         // Vert
    'Terminé(e)': '#B0E57C'     // Vert
  };
  summaries: string[] = [];
 // Tableau des tâches du projet sélectionné
  errorMessage: string = ''; // Message d'erreur
  displayedColumns: string[] = [
    'id', 'key', 'summary', 'epic', 'issuetype', 'status', 
    'sprint', 'assignee', 'qaCreation', 'qaReview','QA Test case execution','Regression Test Case Creation','Regression Test Case Review','regPackage', 'Comment',
    'time_needed_for_tc_creation','time_needed_to_test','bugs_raised','nb_tc','Nb_tc_modified','action'
  ];
  
  constructor(
    private jiraService: JiraService,
    private route: ActivatedRoute,
    private router: Router,
    private supplementService: SupplementService,
    private dialog :MatDialog,
  ) { }
  
  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');
    const domaine = this.route.snapshot.queryParamMap.get('domaine');
  
    if (email && token && domaine) {
      this.jiraService.getJiraProjects(email, token, domaine).subscribe({
        next: (data: any) => {
          this.projects = data;
          this.createProjectDictionary(data);
  
          // ✅ Priorité : ID après reload
          const storedIdAfterReload = localStorage.getItem('selectedProjectIdAfterReload');
          if (storedIdAfterReload) {
            this.selectedProjectId = storedIdAfterReload;
            this.selectProject(storedIdAfterReload);
            localStorage.removeItem('selectedProjectIdAfterReload');
            sessionStorage.removeItem('hasReloaded');
            return; // ⛔ Stop ici pour éviter le deuxième selectProject()
          }
  
          // Sinon, on utilise l’ID normal
          const storedId = localStorage.getItem('selectedProjectId');
          if (storedId) {
            this.selectedProjectId = storedId;
            this.selectProject(storedId);
          }
        },
        error: (error: any) => {
          this.errorMessage = 'Erreur lors de la récupération des projets Jira.';
          console.error(error);
        },
      });
    } else {
      this.errorMessage = 'Email ou token ou domaine manquant.';
    }
  
    this.fetchSupplements();
    setTimeout(() => {
      this.mergeTasksWithSupplements();
    }, 10000);
  }
  
  // ngAfterViewInit(): void {  
  //   if (this.paginator && this.sort) {  
  //     this.tasks.paginator = this.paginator;  
  //     this.tasks.sort = this.sort;  
  //   }  
  // }  

  // Méthode pour créer le dictionnaire
  fetchSupplements(): void {
    this.supplementService.getSupplements().subscribe({
      next: (data) => {
        this.supplements = data;
        console.log("supplements" ,this.supplements)
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des supplements', err);
      }
    });}
  createProjectDictionary(projects: any[]): void {
    this.projectDictionary = {}; // Réinitialisez le dictionnaire
    projects.forEach(project => {
      this.projectDictionary[project.id] = project.name; // Ajoutez chaque projet au dictionnaire
    });
    this.filteredProjectIds = this.getProjectIds();

  }
//

  // Méthode pour récupérer les clés du dictionnaire
  getProjectIds(): string[] {
    return Object.keys(this.projectDictionary);
  }
  // Méthode pour sélectionner un projet et charger ses tâches
  selectProject(id: string): void {
    this.selectedProject = this.projects.find(project => project.id === id);
    if (this.selectedProject) {
      this.loadJiraTasks(this.selectedProject.id); 
      this.loadSupplements(this.selectedProject.id); 
  
      console.log(`Projet sélectionné : ${this.selectedProject.name}`);
  
      localStorage.setItem('selectedProjectId', this.selectedProject.id);
    }
  }
  loadSupplements(projectId: string): void {
    this.supplementService.getSupplements().subscribe({
      next: (data: any[]) => {
        this.supplements = data;
        this.mergeTasksWithSupplements(); // C’est ici qu’il faut le faire
      },
      error: (error) => {
        console.error("Erreur lors du chargement des suppléments :", error);
      }
    });
  }
    
  //nouvelle 
  filterProjects(): void {
    const allIds = this.getProjectIds();
    
    if (!this.searchTerm) {
      this.filteredProjectIds = allIds;
      return;
    }
  
    const term = this.searchTerm.toLowerCase();
    this.filteredProjectIds = allIds.filter(id => 
      this.projectDictionary[id].toLowerCase().includes(term)
    );
  }
  
  onProjectSelected(): void {
    if (this.selectedProjectId) {
      this.selectProject(this.selectedProjectId);
      localStorage.setItem('selectedProjectIdAfterReload', this.selectedProjectId);
    
    // ✅ Autoriser le prochain reload automatique
    sessionStorage.removeItem('hasReloaded');
    
    // 🔁 Forcer le reload maintenant
    window.location.reload();
    }
    
  }
  
  // Méthode pour charger les tâches du projet sélectionné
  loadJiraTasks(projectId: string): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');
    const domaine = this.route.snapshot.queryParamMap.get('domaine');
    if (email && token && domaine) {
      this.jiraService.getJiraTasks(email, token, projectId , domaine).subscribe({
        next: (data: any) => {
          this.allTasks = data.issues; 
          this.tasks = data.issues;
          console.log("ttt",this.tasks);

          this.tasks = this.tasks.filter(task =>
            ['Story', 'User Story', 'Bug'].includes(task.fields.issuetype.name)
          );
          this.tasks.forEach((task, i) => {
            
          });
        },
        error: (error: any) => {
          this.errorMessage = 'Erreur lors de la récupération des tâches.';
          console.error(error);
        },
      });
    }
  }
  mergeTasksWithSupplements(): void {
    // Vérification initiale pour voir si les suppléments existent
    console.log("Supplements:", this.supplements);
    console.log("Tasks:", this.tasks);
    // Vérification des correspondances
    this.tasks.forEach(task => {
        const taskIdParsed = parseInt(task.id);
        const matchingSupplement = this.supplements.find(supp => parseInt(supp.usId) === taskIdParsed);
        console.log('Task ID:', taskIdParsed, 'Matching Supplement:', matchingSupplement);
    });
    // Mise à jour des tâches avec les informations des suppléments
    this.tasks = this.tasks.map(task => {
        const taskIdParsed = parseInt(task.id);
        const matchingSupplement = this.supplements.find(supp => parseInt(supp.usId) === taskIdParsed);
        // Fusionner les propriétés de task et de matchingSupplement (si trouvé)
        const updatedTask = matchingSupplement ? { ...task, ...matchingSupplement } : task;

        console.log("Tâche mise à jour:", updatedTask);
        return updatedTask;
    });
 // Vérification finale des tâches après fusion
    console.log("Tâches après fusion:", this.tasks);

    this.tasks.forEach(updatedTask => {
      console.log("comment de la tâche:", updatedTask.comment);
})
}
  getTaskStatusCreation(task: any): Observable<string> {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find(
        (sub: any) => sub.fields.summary === 'QA Test case creation'
      );

      if (subtask) {
        const keyToFind = subtask.key;
        const taskQaCreation = this.allTasks.find((t: any) => t.key === keyToFind);

        if (taskQaCreation) {
          const assigneeDisplayName = taskQaCreation.fields.assignee?.displayName || 'Non assigné';
          return of(`${subtask.fields?.status?.name || 'Statut inconnu'} (${assigneeDisplayName})`);
        } else {
          return of('Tâche non trouvée');
        }
      } else {
        return of('N/A');
      }
    } else {
      return of('Statut non disponible');
    }
  }
  getTaskStatusReview(task: any): Observable<string> {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find(
        (sub: any) => sub.fields.summary === 'QA Test case review'
      );
      if (subtask) {
        const keyToFind = subtask.key;
        const taskQaCreation = this.allTasks.find((t: any) => t.key === keyToFind);

        if (taskQaCreation) {
          const assigneeDisplayName = taskQaCreation.fields.assignee?.displayName || 'Non assigné';
          return of(`${subtask.fields?.status?.name || 'Statut inconnu'} (${assigneeDisplayName})`);
        } else {
          return of('Tâche non trouvée');
        }
      } else {
        return of('N/A');
      }
    } else {
      return of('Statut non disponible');
    }
  }
  getTaskStatusExecution(task: any): Observable<string> {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find(
        (sub: any) => sub.fields.summary === 'QA Test case execution'
      );

      if (subtask) {
        const keyToFind = subtask.key;
        const taskQaCreation = this.allTasks.find((t: any) => t.key === keyToFind);

        if (taskQaCreation) {
          const assigneeDisplayName = taskQaCreation.fields.assignee?.displayName || 'Non assigné';
          return of(`${subtask.fields?.status?.name || 'Statut inconnu'} (${assigneeDisplayName})`);
        } else {
          return of('Tâche non trouvée');
        }
      } else {
        return of('N/A');
      }
    } else {
      return of('Statut non disponible');
    }
  }
  getTaskStatusRview(task: any): Observable<string> {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find(
        (sub: any) => sub.fields.summary === 'Regression Test Case Review'
      );

      if (subtask) {
        const keyToFind = subtask.key;
        const taskQaCreation = this.allTasks.find((t: any) => t.key === keyToFind);

        if (taskQaCreation) {
          const assigneeDisplayName = taskQaCreation.fields.assignee?.displayName || 'Non assigné';
          return of(`${subtask.fields?.status?.name || 'Statut inconnu'} (${assigneeDisplayName})`);
        } else {
          return of('Tâche non trouvée');
        }
      } else {
        return of('N/A');
      }
    } else {
      return of('Statut non disponible');
    }
  }
  getTaskStatusRCreation(task: any): Observable<string> {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find(
        (sub: any) => sub.fields.summary === 'Regression Test Case Creation'
      );

      if (subtask) {
        const keyToFind = subtask.key;
        const taskQaCreation = this.allTasks.find((t: any) => t.key === keyToFind);

        if (taskQaCreation) {
          const assigneeDisplayName = taskQaCreation.fields.assignee?.displayName || 'Non assigné';
          return of(`${subtask.fields?.status?.name || 'Statut inconnu'} (${assigneeDisplayName})`);
        } else {
          return of('Tâche non trouvée');
        }
      } else {
        return of('N/A');
      }
    } else {
      return of('Statut non disponible');
    }
  }
  logout(): void {
    // Supprime le token et redirige vers la page de connexion
    localStorage.removeItem('token');
    this.router.navigate(['/signin']);
  }
  getTaskColor(task: any, subtaskSummary: string): string {
    if (task.fields.subtasks && Array.isArray(task.fields.subtasks)) {
      const subtask = task.fields.subtasks.find((sub: any) => sub.fields.summary === subtaskSummary);
      if (subtask) {
        const statusName = subtask.fields.status.name;
        return this.statusColorMap[statusName] || 'transparent'; 
      }
    }
    return 'transparent';
  }
  openUpdateDialog(task: any): void {
    const supplementData: Supplement = {
      usId: task.id,
      comment: task.comment,
      regPackageId : task.regPackage,
      timeNeededForTcCreation: task.time_needed_for_tc_creation,
      timeNeededToTest:task.time_needed_to_test,
      bugsRaised : task.bugs_raised,
      nbTc : task.nbTc,
      nbTcModified : task.nbTcModified
    };
    const dialogRef = this.dialog.open(TaskComponent, {
      width: '400px',
      data: supplementData
    });
    dialogRef.afterClosed().subscribe(updatedData => {
      if (updatedData) {
        this.supplementService.updateSupplement(updatedData).subscribe(() => {
          this.fetchSupplements(); // Rafraîchir les données
        });
      }
    });
  }
  onAjoutSup(task: any): void {
    const supplementData: Supplement = {
      usId: task.id,  // Utilisation de l'ID de la tâche pour lier l'utilisateur
      comment: '',  // Commentaire vide par défaut, car on ajoute un supplément
      regPackageId: task.regPackage ,  // RegPackage vide, car il sera ajouté
      timeNeededForTcCreation: task.time_needed_for_tc_creation,  // Temps de création de TC vide
      timeNeededToTest: task.time_needed_to_test,  // Temps pour tester vide
      bugsRaised: task.bugs_raised,  // Bugs trouvés vide
      nbTc: task.nb_tc,  // Nombre de TC vide
      nbTcModified: task.Nb_tc_modified  // Nombre de TC modifiés vide
    };
  
    // Ouvrir le dialogue d'ajout de supplément avec les données initiales
    const dialogRef = this.dialog.open(TaskCSComponent, {
      width: '400px',
      data: supplementData
    });
  
    dialogRef.afterClosed().subscribe(newSupplement => {
      if (newSupplement) {
        const usId = newSupplement.usId;
        console.log(usId); 
        console.log(typeof usId); 
        const usIdInt = parseInt(usId, 10); 
        console.log(usIdInt);
        console.log(typeof usIdInt);// Une fois que l'utilisateur a rempli le formulaire, on l'ajoute via le service
        this.supplementService.addSupplement(newSupplement ,usId).subscribe(() => {
          this.fetchSupplements(); // Rafraîchir la liste des suppléments
        });
      }
    });
  }

  onDelete(task: any): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.supplementService.deleteSupplement(task.idSup).subscribe(() => {
        // Rafraîchir la liste des tâches après la suppression
        this.fetchSupplements();
      });
    }
  }
  applyButtonVisibility(task: any): boolean {
    console.log("Task:", task);

    const requiredColumns = [
        'RegPackage',
        'Comment',
        'time_needed_for_tc_creation',
        'time_needed_to_test',
        'bugs_raised',
        'nb_tc',
        'Nb_tc_modified'
    ];

    const hasValues = requiredColumns.some(column => {
        console.log(`Checking column: "${column}" | Exists: ${task.hasOwnProperty(column)} | Value:`, task[column]);
        return task[column] !== undefined && task[column] !== null && task[column] !== "";
    });

    console.log("applyButtonVisibility(task):", hasValues);
    return hasValues;
}
}