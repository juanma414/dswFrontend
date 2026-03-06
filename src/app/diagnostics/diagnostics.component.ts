import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-diagnostics',
  template: `
    <div style="position: fixed; bottom: 20px; right: 20px; background: white; border: 2px solid #333; padding: 15px; border-radius: 5px; font-size: 12px; max-width: 400px; z-index: 9999; max-height: 400px; overflow-y: auto; font-family: monospace;">
      <h3 style="margin: 0 0 10px 0;">🔧 Diagnostic Report</h3>
      
      <div style="margin: 5px 0; padding: 5px; background: #f5f5f5;">
        <strong>Token Status:</strong>
        <br/> {{ tokenExists ? '✅ Exists' : '❌ Missing' }}
        <br/> {{ tokenPreview }}
      </div>

      <div style="margin: 5px 0; padding: 5px; background: #f5f5f5;">
        <strong>User Data:</strong>
        <br/> {{ currentUser ? '✅ Loaded' : '❌ Not loaded' }}
        <br/> Name: {{ currentUser?.userName || 'N/A' }}
        <br/> Email: {{ currentUser?.userEmail || 'N/A' }}
        <br/> Role: {{ currentUser?.userRol || 'N/A' }}
      </div>

      <div style="margin: 5px 0; padding: 5px; background: #f5f5f5;">
        <strong>Auth Status:</strong>
        <br/> isLoggedIn(): {{ isLoggedIn ? '✅ true' : '❌ false' }}
      </div>

      <button (click)="clearToken()" style="padding: 5px 10px; margin-top: 10px; cursor: pointer;">
        Clear Token
      </button>
      
      <button (click)="copyDiagnostics()" style="padding: 5px 10px; margin-top: 10px; cursor: pointer;">
        Copy Full Diagnostics
      </button>
    </div>
  `,
  styles: []
})
export class DiagnosticsComponent {
  tokenExists = false;
  tokenPreview = 'N/A';
  currentUser: any = null;
  isLoggedIn = false;

  constructor(private authService: AuthService) {
    this.updateDiagnostics();
    setInterval(() => this.updateDiagnostics(), 1000);
  }

  updateDiagnostics(): void {
    const token = localStorage.getItem('token');
    this.tokenExists = !!token;
    this.tokenPreview = token ? token.substring(0, 30) + '...' : 'No token';
    this.currentUser = this.authService.getCurrentUser();
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  clearToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.authService.logout();
    this.updateDiagnostics();
  }

  copyDiagnostics(): void {
    const diag = {
      timestamp: new Date().toISOString(),
      tokenExists: this.tokenExists,
      currentUser: this.currentUser,
      isLoggedIn: this.isLoggedIn,
      localStorage: {
        token: localStorage.getItem('token')?.substring(0, 50) + '...' || 'N/A',
        currentUser: localStorage.getItem('currentUser') || 'N/A'
      }
    };
    
    console.log('📋 Full Diagnostics:', JSON.stringify(diag, null, 2));
    alert('Diagnostics copied to console. Press F12 to view.');
  }
}
