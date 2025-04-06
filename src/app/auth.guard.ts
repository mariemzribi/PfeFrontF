import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token'); // Vérifier si l'utilisateur est connecté
    if (!token) {
      this.router.navigate(['/signin']); // Rediriger vers la page de connexion si non connecté
      return false;
    }
    return true;
  }
}
