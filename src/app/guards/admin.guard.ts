import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      if (user && user.userRol === 'administrator') {
        return true;
      } else {
        this.router.navigate(['/todo']);
        return false;
      }
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
