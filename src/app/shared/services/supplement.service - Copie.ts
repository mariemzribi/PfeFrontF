import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Supplement {
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

@Injectable({
  providedIn: 'root',
})
export class SupplementService {
  private apiUrl = environment.baseApiUrl;

  constructor(private http: HttpClient) { }

  getSupplements(): Observable<any> {
    return this.http.get<any>(this.apiUrl + "/supplement", { responseType: 'json' });
  }

  updateSupplement(supplement: Supplement): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}?usId=${supplement.usId}`, supplement);
  }

  addSupplement(supplement: Supplement, usId: number): Observable<Supplement> {
    // Inclure l'`usId` dans l'URL de la requête comme paramètre de requête
    const url = `${this.apiUrl}?usId=${usId}`;

    return this.http.post<Supplement>(url, supplement);
  }
  deleteSupplement(idSup: number): Observable<void> {
    // Construire l'URL avec l'ID du supplément à supprimer
    const url = `${this.apiUrl}/${idSup}`;

    // Effectuer la requête DELETE
    return this.http.delete<void>(url);
  }
}