import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  IUser
} from '../model/api-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/user`;
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Usar sessionStorage en lugar de localStorage
    // Así la sesión se limpia automáticamente al cerrar la pestaña o el navegador
    const token = sessionStorage.getItem('token');
    console.log('[AuthService] Constructor - Token en sessionStorage:', token ? 'SÍ' : 'NO');
    
    if (token) {
      try {
        console.log('[AuthService] Decodificando token al inicializar');
        const user = this.decodeToken(token);
        if (user) {
          console.log('[AuthService] Usuario restaurado:', user);
          this.currentUserSubject.next(user);
        } else {
          console.error('[AuthService] Token inválido, limpiando');
          sessionStorage.removeItem('token');
        }
      } catch (error) {
        console.error('[AuthService] Error decodificando token en constructor:', error);
        sessionStorage.removeItem('token');
      }
    }
  }

  // Login
  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('[AuthService] Iniciando login con:', credentials.userEmail);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: LoginResponse) => {
        console.log('[AuthService] Respuesta de login:', response);
        if (response.token) {
          console.log('[AuthService] Token recibido, guardando en sessionStorage');
          // Guardar el token en sessionStorage (se borra al cerrar la pestaña)
          sessionStorage.setItem('token', response.token);
          console.log('[AuthService] Token guardado:', sessionStorage.getItem('token')?.substring(0, 20) + '...');
          
          const user = this.decodeToken(response.token);
          console.log('[AuthService] Usuario decodificado:', user);
          if (user) {
            this.currentUserSubject.next(user);
            console.log('[AuthService] Usuario actualizado en currentUserSubject');
          } else {
            console.error('[AuthService] No se pudo decodificar el usuario');
          }
        } else {
          console.error('[AuthService] No hay token en la respuesta:', response);
        }
      })
    );
  }

  // Registrar usuario
  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(this.apiUrl, userData).pipe(
      tap((response: RegisterResponse) => {
        if (response.token) {
          sessionStorage.setItem('token', response.token);
          const user = this.decodeToken(response.token);
          if (user) {
            this.currentUserSubject.next(user);
          }
        }
      })
    );
  }

  // Decodificar JWT y extraer datos del usuario
  private decodeToken(token: string): IUser | null {
    try {
      const decoded: any = jwtDecode(token);
      console.log('[AuthService] Token decodificado con éxito:', decoded);
      
      const user: IUser = {
        userId: decoded.userId,
        userEmail: decoded.userEmail,
        userName: decoded.userName,
        userLastName: decoded.userLastName,
        userRol: decoded.userRol
      };
      
      console.log('[AuthService] Usuario extraído:', user);
      return user;
    } catch (error) {
      console.error('[AuthService] Error decodificando token:', error);
      return null;
    }
  }

  // Guardar usuario en sessionStorage y actualizar subject
  setCurrentUser(user: IUser): void {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Obtener usuario actual
  getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  // Verificar si está logueado
  isLoggedIn(): boolean {
    const loggedIn = !!this.getCurrentUser();
    console.log('[AuthService] isLoggedIn:', loggedIn, '- Usuario:', this.getCurrentUser());
    return loggedIn;
  }

  // Logout
  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}