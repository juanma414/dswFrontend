import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = 'http://localhost:3000/api/issue';
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener todos los issues (filtrados por usuario si no es admin)
  public getIssues(): Observable<any> { 
    const currentUser = this.authService.getCurrentUser();
    
    let params = new HttpParams();
    if (currentUser) {
      params = params.set('userRole', currentUser.userRol);
      params = params.set('userId', currentUser.userId.toString());
    }
    
    return this.http.get(this.url, { params });
  }

  // Crear nuevo issue (con información del usuario)
  public createIssue(issue: any): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    const issueData = {
      ...issue,
      userId: currentUser?.userId,
      issueSupervisor: currentUser?.userId // Se asigna automáticamente al usuario actual
    };
    
    return this.http.post(this.url, issueData);
  }

  // Actualizar issue completo
  public updateIssue(id: number, issue: any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, issue);
  }

  // Cambiar solo el status del issue
  public updateIssueStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.url}/${id}/status`, { status });
  }

  // Eliminar issue (solo administradores)
  public deleteIssue(id: number): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    const deleteData = {
      userRole: currentUser?.userRol
    };
    
    return this.http.delete(`${this.url}/${id}`, { body: deleteData });
  }

  // Obtener issues eliminados
  public getDeletedIssues(): Observable<any> {
    return this.http.get(`${this.url}/deleted`);
  }

  // Obtener issues completados
  public getCompletedIssues(): Observable<any> {
    return this.http.get(`${this.url}/completed`);
  }

  // Marcar issue como completado (con fecha de finalización)
  public completeIssue(id: number): Observable<any> {
    return this.http.patch(`${this.url}/${id}/complete`, {});
  }

  // Obtener todos los usuarios disponibles (para asignación)
  public getUsers(): Observable<any> {
    return this.http.get('http://localhost:3000/api/user');
  }

  // Actualizar asignación de issue (solo administradores)
  public updateIssueAssignment(id: number, supervisorName: string): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    const updateData = {
      issueSupervisor: supervisorName,
      userRole: currentUser?.userRol
    };
    
    return this.http.put(`${this.url}/${id}`, updateData);
  }
}
