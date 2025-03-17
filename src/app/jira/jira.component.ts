import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-jira',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule], // Assurez-vous d'inclure CommonModule ici
  templateUrl: './jira.component.html',
  styleUrls: []
})
export class JiraComponent {
  form: FormGroup;
  statusMessage: string | null = null;
  filePath: string | null = null; // Déclare la variable filePath

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    // Initialisation du formulaire avec des validateurs
    this.form = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]], // Champ email avec validation
      token: ['', Validators.required] // Champ token avec validation
    });
  }

  // Méthode pour vérifier si un champ a une erreur affichable
  hasDisplayableError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return control?.invalid && (control?.dirty || control?.touched) ? true : false;
  }

  // Méthode appelée lors de la soumission du formulaire
  onSubmit() {
    if (this.form.valid) {
      const email = this.form.value.username;
      const token = this.form.value.token;

      // Appel à l'API backend pour récupérer les projets Jira
      this.http.get('https://localhost:7104/api/jira/projects', {
        params: { email: email, apiToken: token },
        responseType: 'json'
      })
      .subscribe({
        next: (response: any) => {
          this.statusMessage = 'Fichier JSON créé avec succès.';
          // Rediriger vers le tableau de bord avec les paramètres email et token
          this.router.navigate(['/dashboard'], { queryParams: { email: email, token: token } });
        },
        error: () => {
          this.statusMessage = 'Erreur lors de la connexion à Jira.';
        }
      });
    } else {
      this.statusMessage = 'Le formulaire est invalide.';
    }
  }
}