import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }
  baseURL = environment.baseApiUrl;

  createUser(formData: any) {
    return this.http.post(this.baseURL + '/register', formData);
  }
  signin(formData: any) {
    return this.http.post(this.baseURL + '/singin', formData);
  }

}
