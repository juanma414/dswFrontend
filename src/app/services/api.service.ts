import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = 'http://localhost:3000/api/issue';
  constructor(private http: HttpClient) { }

  public getIssues() : Observable<any> { 
    return this.http.get(this.url);
  }
}
