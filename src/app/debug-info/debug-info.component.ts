import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-debug-info',
  template: `
    <div style="padding: 10px; background: #f0f0f0; border: 1px solid #ccc; margin: 10px; font-size: 12px; font-family: monospace;">
      <h4>🔍 Debug Info</h4>
      <p><strong>Token en localStorage:</strong> {{ tokenStatus }}</p>
      <p><strong>Usuario logueado:</strong> {{ currentUser?.userName || 'NO' }}</p>
      <p><strong>Email:</strong> {{ currentUser?.userEmail }}</p>
      <p><strong>Rol:</strong> {{ currentUser?.userRol }}</p>
      <p><strong>isLoggedIn():</strong> {{ isLoggedIn }}</p>
    </div>
  `,
  styles: []
})
export class DebugInfoComponent implements OnInit {
  tokenStatus = 'Cargando...';
  currentUser: any = null;
  isLoggedIn = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.updateDebugInfo();
    // Actualizar cada 2 segundos
    setInterval(() => this.updateDebugInfo(), 2000);
  }

  updateDebugInfo(): void {
    const token = localStorage.getItem('token');
    this.tokenStatus = token ? 'SÍ (' + token.substring(0, 20) + '...)' : 'NO';
    this.currentUser = this.authService.getCurrentUser();
    this.isLoggedIn = this.authService.isLoggedIn();
  }
}
