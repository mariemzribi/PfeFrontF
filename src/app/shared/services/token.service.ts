import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private emailKey = 'jira_email';
  private tokenKey = 'jira_token';
  private domaineKey = 'jira_domaine';

  setCredentials(email: string, token: string, domaine: string): void {
    sessionStorage.setItem(this.emailKey, email);
    sessionStorage.setItem(this.tokenKey, token);
    sessionStorage.setItem(this.domaineKey, domaine);
  }

  getEmail(): string | null {
    return sessionStorage.getItem(this.emailKey);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getDomaine(): string | null {
    return sessionStorage.getItem(this.domaineKey);
  }

  clear(): void {
    sessionStorage.removeItem(this.emailKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.domaineKey);
  }
}
