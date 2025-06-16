import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../app/shared/services/token.service';
import { environment } from '../../environments/environment';
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
  baseUrl: string = environment.baseApiUrl;
  isReadOnly = true;

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router,
    private tokenService: TokenService
  ) {
    //Récupération de l'email depuis le localStorage
    const email = localStorage.getItem('email') || "";
    // Initialisation du formulaire avec des validateurs
    this.form = this.formBuilder.group({
      username: [email, [Validators.required, Validators.email]], // Champ email avec validation
      token: ['', Validators.required],
      domaine: ['', Validators.required] // Champ token avec validation
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
      const domaine = this.form.value.domaine;
      // Appel à l'API backend pour récupérer les projets Jira
      this.http.post(`${this.baseUrl}/jira/projects`, {
        email: email,
        apiToken: token,
        domaine: domaine
      })
        .subscribe({
          next: (response: any) => {
            this.statusMessage = 'Fichier JSON créé avec succès.';
            this.tokenService.setCredentials(email, token, domaine);
            // Rediriger vers le tableau de bord avec les paramètres email et token
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.statusMessage = 'Error while connecting to Jira.';
          }
        });
    } else {
      this.statusMessage = 'Invalid form.';
    }
  }
}