import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirstKeyPipe } from '../../shared/pipes/first-key.pipe';
import { AuthService } from '../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FirstKeyPipe],
  templateUrl: './registration.component.html',
  styles: ``
})
export class RegistrationComponent {

  private formBuilder = inject(FormBuilder);
  private service = inject(AuthService);
  private toastr = inject(ToastrService);

  isSubmitted: boolean = false;

  // Validator pour vérifier que password et confirmPassword sont identiques
  passwordMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  };

  // Formulaire d'inscription
  form = this.formBuilder.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/(?=.*[^a-zA-Z0-9 ])/)
    ]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  // Lors de la soumission du formulaire
  onSubmit() {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.service.createUser(this.form.value).subscribe({
        next: (res: any) => {
          if (res.succeeded) {
            this.form.reset();
            this.isSubmitted = false;
            this.toastr.success('Nouvel utilisateur créé avec succès !', 'Inscription réussie');
          }
        },
        error: err => {
          this.handleError(err);
        }
      });
    }
  }

  // Gestion des erreurs
  handleError(err: any) {
    if (Array.isArray(err.error)) {
      let foundSpecificError = false;
  
      err.error.forEach((errorItem: any) => {
        if (errorItem.code === 'DuplicateEmail') {
          this.toastr.error('Cet email est déjà utilisé.', 'Erreur');
          foundSpecificError = true;
       
        }
      });
      if (this.form.hasError('passwordMismatch')) {
        this.toastr.error('Les mots de passe ne correspondent pas.', 'Erreur');
        foundSpecificError = true;
      }
  
      if (!foundSpecificError) {
        this.toastr.error('Une erreur est survenue. Veuillez réessayer.', 'Erreur');
        console.error('Erreurs inattendues:', err.error);
      }
  
    } else {
      this.toastr.error('Erreur serveur. Veuillez réessayer plus tard.', 'Erreur');
      console.error('Erreur serveur:', err);
    }
  }
  
  
  
  // Vérifie si un champ a une erreur à afficher
  hasDisplayableError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control?.invalid) &&
      (this.isSubmitted || Boolean(control?.touched) || Boolean(control?.dirty));
  }
}