import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');

    // Si existe el token, agregar el header Authorization
    if (token) {
      console.log('[JwtInterceptor] Token encontrado, agregando al header');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.log('[JwtInterceptor] No hay token en localStorage');
    }

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          console.log('[JwtInterceptor] Response exitosa', event.status);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('[JwtInterceptor] Error HTTP:', error.status, error.error);
        
        // Manejar errores de autenticación
        if (error.status === 401) {
          console.warn('[JwtInterceptor] Token inválido o expirado - logout');
          // Token inválido o expirado
          this.authService.logout();
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          // Acceso denegado - sin permisos necesarios
          console.error('[JwtInterceptor] Acceso denegado:', error.error?.message);
        }

        return throwError(() => error);
      })
    );
  }
}
