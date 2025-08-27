import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      userEmail: ['', [Validators.required, Validators.email]],
      userPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Si ya está logueado, redirigir al tablero
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/todo']);
    }
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          
          // Guardar usuario en el AuthService
          if (response.data) {
            this.authService.setCurrentUser(response.data);
          }
          
          this.router.navigate(['/todo']);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error en login:', error);
          alert('Error: ' + (error.error?.message || 'Error al iniciar sesión'));
          this.isLoading = false;
        }
      });
    } else {
      alert('Por favor completa todos los campos correctamente');
    }
  }
}
