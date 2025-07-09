import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Supplement {
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

@Injectable({
  providedIn: 'root',
})
export class SupplementService {
  private apiUrl = environment.baseApiUrl + '/supplement';

  constructor(private http: HttpClient) { }

  getSupplements(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { responseType: 'json' });
  }

  updateSupplement(supplement: Supplement): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}?usId=${supplement.usId}`, supplement);
  }

  addSupplement(supplement: Supplement, usId: number): Observable<Supplement> {
    // Inclure l'`usId` dans l'URL de la requête comme paramètre de requête
    const url = `${this.apiUrl}?usId=${usId}`;
    return this.http.post<Supplement>(url, supplement);
  }
  deleteSupplement(idSup: number): Observable<string> {
    const url = `${this.apiUrl}/${idSup}`;
    // Ajouter 'responseType: text' pour indiquer que la réponse est en texte brut
    return this.http.delete<string>(url, { responseType: 'text' as 'json' });
  }
}