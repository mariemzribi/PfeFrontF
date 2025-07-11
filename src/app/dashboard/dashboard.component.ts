import { Component, OnInit, ViewChild, AfterViewInit, ElementRef, inject } from '@angular/core';
import { JiraService } from '../../app/shared/services/jira.service';
import { ActivatedRoute } from '@angular/router';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SupplementService } from '../../app/shared/services/supplement.service';
import { MatDialog } from '@angular/material/dialog';
import { TaskComponent } from '../task/task.component';
import { TaskCSComponent } from '../task-cs/task-cs.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule ,ReactiveFormsModule} from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { catchError } from 'rxjs/operators';
import { MatSpinner } from '@angular/material/progress-spinner';
import { JiraSignalrService } from '../../app/shared/services/jira-signalr.service';
import { MatTableDataSource } from '@angular/material/table';
import { TokenService  } from '../shared/services/token.service';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';



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
  regPackageId?: string; // string au lieu de number
  comment?: string;
  qaExecution?: string; // Ajouté si besoin
  timeNeededForTcCreation?: Date; // Time
  timeNeededToTest?: Date; // Time
  bugsRaised?: number;
  nbTc?: number; // int
  nbTcModified?: number; // int
}
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    MatSelectModule,
    MatCardModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})


export class DashboardComponent implements OnInit {
  spinnerMode: 'determinate' | 'indeterminate' | 'buffer' | 'query' = 'indeterminate';//sort 
  bugsRaised: number = 0;//bug raised
  bugsByScrum: { [scrumName: string]: number } = {};
  
  private _liveAnnouncer = inject(LiveAnnouncer);


  TestCaseStatus: any[] = [];
  projects: any[] = []; // Tableau original des projets
  projectDictionary: { [key: string]: string } = {}; // Dictionnaire id -> name
  selectedProject: any = null; // Projet sélectionné
  tasks: any[] = [];
  subtasks: any[] = [];
  allTasks: any[] = [];
  supplements: any[] = [];
  filteredTasks: any[] = [];

//
statusList: string[] = [];
epicList: string[] = [];
assigneeList: string[] = [];
sprintList: string[] = [];
reporterList: string[] = [];
issueTypeList: string[] = [];
selectedStatuses: string[] = [];
selectedEpics: string[] = [];
selectedIssueTypes: string[] = [];
selectedSprints: string[] = [];
selectedAssignees: string[] = [];
selectedReporters: string[] = [];
  sortedData: any[] = [];
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  projectSearchTerm: string = '';
  filteredProjectIds: string[] = [];
  // Vous pouvez ajouter des propriétés pour contrôler le spinner
  isLoading: boolean = true; // Affiche le spinner quand true
  spinnerColor: string = 'primary';

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
  //
  @ViewChild(MatSort) sort!: MatSort;

  statusColorMap: { [key: string]: string } = {
    'To Do': '#FFEFA7',       // Orange
    'À faire': '#FFEFA7',     // Orange
    'In Progress': '#C7E7DE',   // Jaune
    'En cours': '#C7E7DE',
    'In Development': '#C7E7DE',       // Jaune
    'Done': '#C9FBAC',         // Vert
    'Terminé(e)': '#C9FBAC'     // Vert
  };
  summaries: string[] = [];
  // Tableau des tâches du projet sélectionné
  errorMessage: string = ''; // Message d'erreur
  displayedColumns: string[] = [
    'key', 'summary', 'epic', 'issuetype', 'status',
    'sprint', 'assignee','reporter', 'QA Test case execution', 'regPackage', 'Comment',
    'time_needed_for_tc_creation', 'time_needed_to_test', 'bugs_raised', 'nb_tc', 'Nb_tc_modified', 'action'
  ];

  constructor(
    private jiraService: JiraService,
    private route: ActivatedRoute,
    private router: Router,
    private supplementService: SupplementService,
    private dialog: MatDialog,
    private jiraSignalrService: JiraSignalrService,
    private tokenService: TokenService,
    private http: HttpClient // Ajout pour l'appel API
  ) {
    this.sortedData = this.filteredTasks.slice();
  }


  //
  ngOnInit(): void {
    this.isLoading = true;
    this.filteredTasks = [...this.tasks];
    // const email = this.route.snapshot.queryParamMap.get('email');
    // const token = this.route.snapshot.queryParamMap.get('token');
    // const domaine = this.route.snapshot.queryParamMap.get('domaine');
    const email = this.tokenService.getEmail();
const token = this.tokenService.getToken();
const domaine = this.tokenService.getDomaine();
//Observable = le facteur qui va te livrer du courrier, mais ça peut prendre un moment.

//subscribe() = c’est toi qui dis au facteur : « Hey, préviens-moi dès que j’ai du courrier ! »

//next = c’est ce qui se passe quand le facteur arrive et te donne ton courrier (la donnée).

    if (email && token && domaine) {
      this.jiraService.getJiraProjects(email, token, domaine).subscribe({
        next: (data: any) => {
          this.projects = data;
          this.createProjectDictionary(data);

          // ✅ Priorité : ID après reload
          //On récupère dans le stockage local du navigateur un id de projet sauvegardé après un rechargement de page.
          const storedIdAfterReload = localStorage.getItem('selectedProjectIdAfterReload');
          if (storedIdAfterReload) {
            //On met à jour la variable selectedProjectId avec cet id.
            this.selectedProjectId = storedIdAfterReload;
            this.selectProject(storedIdAfterReload);
            localStorage.removeItem('selectedProjectIdAfterReload');
           // Les données restent uniquement pendant la session du navigateur.
            sessionStorage.removeItem('hasReloaded');
            return; // ⛔ Stop ici pour éviter le deuxième selectProject()
          }

          // Sinon, on utilise l’ID normal
          const storedId = localStorage.getItem('selectedProjectId');
          if (storedId) {
            this.selectedProjectId = storedId;
            this.selectProject(storedId);
            this.isLoading = false;

          }
        },
        error: (error: any) => {
          this.errorMessage = 'Error while fetching Jira projects.';
          console.error(error);
          this.isLoading = false; // Cache le spinner en cas d'erreur

        },
      });
    } else {
      this.errorMessage = 'Missing email or token or domain.';
    }

    this.fetchSupplements();
    setTimeout(() => {
      this.mergeTasksWithSupplements();
    }, 50000);
    // Appel de la nouvelle API pour bugs par scrum
    this.fetchBugsByScrum();
  }




  // Méthode pour créer le dictionnaire
  fetchSupplements(): void {
    this.supplementService.getSupplements().subscribe({
      next: (data) => {
        this.supplements = data;
        console.log("supplements", this.supplements)

      },
      error: (err) => {
        console.error('Erreur lors de la récupération des supplements', err);
      }
    });
  }
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
//Les données restent même après la fermeture du navigateur.
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
    // const email = this.route.snapshot.queryParamMap.get('email');
    // const token = this.route.snapshot.queryParamMap.get('token');
    // const domaine = this.route.snapshot.queryParamMap.get('domaine');
    const email = this.tokenService.getEmail();
  const token = this.tokenService.getToken();
   const domaine = this.tokenService.getDomaine();

    if (!email || !token || !domaine) {
      console.error('Paramètres manquants : email, token ou domaine');
      return; // on quitte la fonction proprement
    }
    //
   

//
    this.jiraSignalrService.startConnection(email, token, projectId, domaine)
      .then(() => {
        console.log('Connexion SignalR établie');

        this.jiraSignalrService.issuesReceived$.subscribe({
          next: (data: any) => {
            console.log('Données complètes reçues:', data);
              // 👉 Récupérer bugsRaised depuis l'API
             this.bugsRaised = data?.bugsRaised ?? 0;

            const issues = data?.issues || [];
            console.log('Issues extraites:', issues);

            // Stockage de toutes les tâches reçues
            this.allTasks = issues;

            // Filtrage des tâches selon leur type
            this.tasks = issues.filter((task: any) =>
              ['Story', 'User Story', 'Bug'].includes(task.fields?.issuetype?.name)
            );
            this.mergeTasksWithSupplements();
            console.log('Tâches après filtrage:', this.tasks);
            this.filteredTasks = [...this.tasks];
            this.statusList = Array.from(new Set(this.tasks.map(t => t.fields.status?.name).filter(Boolean)));
             this.epicList = Array.from(new Set(this.tasks.map(t => t.fields.parent?.key).filter(Boolean)));
           this.issueTypeList = Array.from(new Set(this.tasks.map(t => t.fields.issuetype?.name).filter(Boolean)));
           this.sprintList = Array.from(new Set(this.tasks.map(t => t.fields.customfield_10020?.[0]?.name).filter(Boolean)));
           this.assigneeList = Array.from( new Set( this.tasks.map(t => t.fields.assignee?.displayName).filter((name): name is string => !!name)));
this.reporterList = Array.from(new Set(this.tasks.map(t => t.fields.reporter?.displayName).filter((name): name is string => !!name)));


            // Fusionner les tâches filtrées avec des compléments

          },
          error: (error: any) => {
            this.errorMessage = 'Erreur lors de la récupération des tâches.';
            console.error('Erreur SignalR:', error);
          }
        });

      })
      .catch((error: any) => {
        console.error('Erreur de connexion SignalR', error);
      });
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
    // this.calculateBugsBySprint(); // <-- Ajout du calcul après la fusion
  }
  // Ajouté pour le total des bugs par sprint
  // bugsBySprint: { [sprintName: string]: number } = {};

  // calculateBugsBySprint(): void {
  //   this.bugsBySprint = {};
  //   this.tasks.forEach(task => {
  //     const sprintName = task.fields?.customfield_10020?.[0]?.name || 'Aucun sprint';
  //     const bugs = Number(task.bugsRaised) || 0;
  //     if (!this.bugsBySprint[sprintName]) {
  //       this.bugsBySprint[sprintName] = 0;
  //     }
  //     this.bugsBySprint[sprintName] += bugs;
  //   });
  // }
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
        (sub: any) => sub.fields.summary.toLowerCase().includes('execution')
        // (sub: any) => sub.fields.summary === 'QA Test case execution'
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
      regPackageId: task.regPackageId,
      timeNeededForTcCreation: task.timeNeededForTcCreation,
      timeNeededToTest: task.timeNeededToTest,
      bugsRaised: task.bugsRaised,
      nbTc: task.nbTc,
      nbTcModified: task.nbTcModified
    };

    const dialogRef = this.dialog.open(TaskComponent, {
      width: '400px',
      data: supplementData
    });

    dialogRef.afterClosed().subscribe(updatedData => {
      if (updatedData) {
        this.supplementService.updateSupplement(updatedData).pipe(
          catchError(err => {
            console.error('Erreur lors de la mise à jour du supplément :', err);
            return of(null); // évite de casser l’appli
          })
        ).subscribe({
          next: () => {
            this.fetchSupplements(); // actualiser la liste
            window.location.reload(); // si nécessaire
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour du supplément :', err);
          }
        });
      }
    });
  }



  onAjoutSup(task: any): void {
    const supplementData: Supplement = {
      usId: task.id,  // Utilisation de l'ID de la tâche pour lier l'utilisateur
      comment: '',  // Commentaire vide par défaut, car on ajoute un supplément
      regPackageId: task.regPackage,  // RegPackage vide, car il sera ajouté
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
        const usId = parseInt(newSupplement.usId, 10);
        this.supplementService.addSupplement(newSupplement, usId).pipe(
          catchError(err => {
            console.error('Erreur lors de l’ajout du supplément :', err);
            return of(null);  // Retourne une valeur "vide" en cas d'erreur
          })
        ).subscribe({
          next: () => {
            this.fetchSupplements(); // Mise à jour des données affichées
            window.location.reload(); // Rechargement de la page après succès
          },
          error: (err) => {
            console.error('Erreur lors de l’ajout du supplément :', err);
          }
        });
      }
    });
  }

  onDelete(task: any): void {
    if (confirm('Are you sure you want to delete this task? ')) {
      this.supplementService.deleteSupplement(task.idSup).subscribe({
        next: (response) => {
          // La réponse ici est du texte, vous pouvez l'afficher si nécessaire
          console.log('Réponse de la suppression :', response); // Par exemple : "Supplement deleted successfully."
          // Rafraîchir la liste des tâches après la suppression
          this.fetchSupplements();
          // Rechargement de la page après la suppression
          window.location.reload();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de la tâche :', err);
        }
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
  applyFilter(event: Event, column: string) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (filterValue) {
      this.filteredTasks = this.tasks.filter(task => task[column]?.toString().toLowerCase().includes(filterValue));
    } else {
      this.filteredTasks = [...this.tasks]; // Si aucun filtre n'est appliqué, on rétablit les données d'origine
    }
  }
  applyFilter1(event: Event, field: string) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (filterValue) {
      this.filteredTasks = this.tasks.filter(task =>
        task.fields[field]?.toString().toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredTasks = [...this.tasks];
    }
  }
  applyFilter2(event: Event, field: string) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (filterValue) {
      this.filteredTasks = this.tasks.filter(task =>
        task.fields[field]?.toString().toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredTasks = [...this.tasks];
    }
  }
  applyFilterEpic(event: Event, field: string) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (filterValue) {
      this.filteredTasks = this.tasks.filter(task => {
        if (field === 'id') {
          return task.id?.toString().toLowerCase().includes(filterValue);
        } else if (field === 'epic') {
          return task.fields.parent?.key?.toString().toLowerCase().includes(filterValue);
        } else {
          return task.fields[field]?.toString().toLowerCase().includes(filterValue);
        }
      });
    } else {
      this.filteredTasks = [...this.tasks];
    }
  }

  applyFilterType(event: Event, field: string) {
  let filterValue: string = '';
  let filterValues: string[] = [];

  if (Array.isArray(event)) {
    // Cas du dropdown multiple
    filterValues = event.map(v => v.toLowerCase());
  } else {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (filterValue) {
      this.filteredTasks = this.tasks.filter(task => {

         if (field === 'status') {
      const statusName = task.fields.status?.name?.toLowerCase();
      if (filterValues.length > 0) {
        return filterValues.includes(statusName);
      } else {
        return statusName?.includes(filterValue);
      }
    }

    if (!filterValue) return true;
        if (field === 'id') {
          return task.id?.toString().toLowerCase().includes(filterValue);
        } else if (field === 'epic') {
          return task.fields.parent?.key?.toLowerCase().includes(filterValue);
        } else if (field === 'issuetype') {
          return task.fields.issuetype?.name?.toLowerCase().includes(filterValue);
        // } else if (field === 'status') {
        //   return task.fields.status?.name?.toLowerCase().includes(filterValue);
        } else if (field === 'sprint') {
          // Filtrer par Sprint
          const sprintName = task.fields.customfield_10020 && task.fields.customfield_10020[0]?.name;
          return sprintName?.toLowerCase().includes(filterValue);

        }
        else if (field === 'reporter') {
          // Filtrer par Sprint
          const reporterName = task.fields.reporter?.displayName || '';
           return reporterName.toLowerCase().includes(filterValue);
        }
        else if (field === 'assignee') {
          // Filtrer par Assignee
          const assigneeName = task.fields.assignee?.displayName;
          return assigneeName?.toLowerCase().includes(filterValue);
        } else if (field.startsWith('fields.')) {
          const fieldName = field.split('.')[1];
          return task.fields[fieldName]?.toLowerCase().includes(filterValue);
        }
        else if (field === 'qaCreation') {
          return (task.qaCreationStatus || '').toLowerCase().includes(filterValue);

        } else {
          return false;
        }
      });
    } else {
      this.filteredTasks = [...this.tasks];
    }
  }
}
applyMultiSelectFilterStatus(selectedValues: string[], field: string): void {
  const filterValues = selectedValues.map(v => v.toLowerCase());

  this.filteredTasks = this.tasks.filter(task => {
    if (field === 'status') {
      const statusName = task.fields.status?.name?.toLowerCase();
      return filterValues.length === 0 || filterValues.includes(statusName);
    }
    return true;
  });
}
applyMultiSelectFilterEpic(selectedValues: string[], field: string): void {
  const filterValues = selectedValues.map(v => v.toLowerCase());

  this.filteredTasks = this.tasks.filter(task => {
    if (field === 'epic') {
      const epicKey = task.fields.parent?.key?.toLowerCase();
      return filterValues.length === 0 || filterValues.includes(epicKey);
    }
    return true;
  });
}
 applyMultiSelectFilterType(selectedValues: string[]): void {
    const filterValues = selectedValues.map(v => v.toLowerCase());
    this.filteredTasks = this.tasks.filter(task => {
      const name = task.fields.issuetype?.name?.toLowerCase();
      return filterValues.length === 0 || filterValues.includes(name);
    });
  }

applyMultiSelectFilterSprint(selectedValues: string[]): void {
  const filterValues = selectedValues.map(v => v.toLowerCase());

  this.filteredTasks = this.tasks.filter(task => {
    const sprintName = task.fields.customfield_10020?.[0]?.name?.toLowerCase();
    return filterValues.length === 0 || filterValues.includes(sprintName);
  });
}

applyMultiSelectFilterAssignee(selectedValues: string[], field: string): void {
  const filterValues = selectedValues.map(v => v.toLowerCase());

  this.filteredTasks = this.tasks.filter(task => {
    if (field === 'assignee') {
      const assigneeName = task.fields.assignee?.displayName?.toLowerCase();
      return filterValues.length === 0 || filterValues.includes(assigneeName);
    }
    return true;
  });
}
applyMultiSelectFilterReporter(selectedValues: string[], field: string): void {
  const filterValues = selectedValues.map(v => v.toLowerCase());

  this.filteredTasks = this.tasks.filter(task => {
    if (field === 'reporter') {
      const reporterName = task.fields.reporter?.displayName?.toLowerCase();
      return filterValues.length === 0 || filterValues.includes(reporterName);
    }
    return true;
  });
}


  navigateToBi() {
    console.log('Clic sur le bouton Bi');
    this.router.navigate(['/Bi']);
  }
  // ngAfterViewInit(): void {

  //       this.filteredTasks.sort = this.sort;

  //   }


  //
  sortData(sort: Sort) {
    const data = [...this.filteredTasks]; // Copie sécurisée des données
    // debugger
//     console.log(...this.filteredTasks)
// fields.issuetype.name
    if (!sort.active || sort.direction === '') {
      this.filteredTasks = data;
      return;
    }

    this.filteredTasks = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'status':
    const statusA = a.fields?.status?.name ?? '';
    const statusB = b.fields?.status?.name ?? '';
    return this.compare(statusA, statusB, isAsc);
        case 'issuetype':
          return this.compare(a.fields.issuetype.name ?? '', b.fields.issuetype.name ?? '', isAsc);
          case 'key':
                return this.compare(a.key ?? '', b.key ?? '', isAsc);
        case 'id':
                return this.compare(a.id ?? '', b.id ?? '', isAsc);
         case 'summary':
          return this.compare(a.fields.summary ?? '', b.fields.summary ?? '', isAsc);

          case 'sprint':
                const sprintA = a.fields.customfield_10020?.[0]?.name ?? '';
                const sprintB = b.fields.customfield_10020?.[0]?.name ?? '';
                return this.compare(sprintA, sprintB, isAsc);
          case 'assignee':
                const assigneeA = a.fields.assignee?.displayName?.toLowerCase() ?? '';
                const assigneeB = b.fields.assignee?.displayName?.toLowerCase() ?? '';
                return this.compare(assigneeA, assigneeB, isAsc);
                case 'reporter':
                const reporterA = a.fields.reporter?.displayName?.toLowerCase() ?? '';
                const reporterB = b.fields.reporter?.displayName?.toLowerCase() ?? '';
                return this.compare(reporterA,reporterB, isAsc);
        case 'epic':
                const epicA = a.fields.parent?.key ?? '';
                const epicB = b.fields.parent?.key ?? '';
                return this.compare(epicA, epicB, isAsc);
        case 'qaReview':
        return this.compare(a.qaReviewStatus, b.qaReviewStatus, isAsc);
          case 'qaCreation':
        return this.compare(a.qaCreationStatus, b.qaCreationStatus, isAsc);  
        case 'QA Test case execution':
        return this.compare(a.executionStatus, b.executionStatus, isAsc);
        case 'Regression Test Case Creation':
        return this.compare(a.executionStatus, b.executionStatus, isAsc);
        case 'Regression Test Case Review':
        return this.compare(a.executionStatus, b.executionStatus, isAsc);   
          case 'regPackage':
                return this.compare(a.regPackage, b.regPackage, isAsc);
         case 'Comment':
                return this.compare(a.Comment, b.Comment, isAsc);
        case 'time_needed_for_tc_creation':
                return this.compare(a.time_needed_for_tc_creation, b.time_needed_for_tc_creation, isAsc);
        case 'time_needed_to_test':
                return this.compare(a.time_needed_to_test, b.time_needed_to_test, isAsc);
        case 'bugs_raised':
                return this.compare(a.bugs_raised, b.bugs_raised, isAsc);
        case 'nb_tc':
                return this.compare(a.nb_tc, b.nb_tc, isAsc);
         case 'Nb_tc_modified':
                return this.compare(a.Nb_tc_modified, b.Nb_tc_modified, isAsc);


        default:
          return 0;
      }
    });
  }

  private compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  fetchBugsByScrum(): void {
    const domaine = this.tokenService.getDomaine();
    const projectName = this.selectedProject?.key || this.selectedProjectId;
    const token = this.tokenService.getToken();
    if (!domaine || !projectName || !token) return;
    const url = `/api/jira/bugs-by-scrum?domaine=${domaine}&projectName=${projectName}&token=${token}`;
    this.http.get<{ [scrum: string]: number }>(url).subscribe({
      next: (data) => {
        this.bugsByScrum = data;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des bugs par scrum', err);
      }
    });
  }
}


