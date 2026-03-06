import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IUser, ApiResponse } from '../model/api-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) { }

  // Obtener todos los usuarios
  getAllUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}`);
  }

  // Obtener un usuario por ID
  getUserById(id: number): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/${id}`);
  }

  // Crear nuevo usuario (solo administradores)
  createUser(userData: Partial<IUser>): Observable<IUser> {
    return this.http.post<IUser>(`${this.apiUrl}`, userData);
  }

  // Actualizar usuario (solo administradores)
  updateUser(id: number, userData: Partial<IUser>): Observable<IUser> {
    return this.http.put<IUser>(`${this.apiUrl}/${id}`, userData);
  }

  // Eliminar usuario (solo administradores)
  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
