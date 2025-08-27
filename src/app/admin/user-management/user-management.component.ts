import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  userForm: FormGroup;
  editingUser: any = null;
  isLoading = false;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      userName: ['', Validators.required],
      userLastName: ['', Validators.required],
      userEmail: ['', [Validators.required, Validators.email]],
      userRol: ['', Validators.required],
      userPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        this.users = response.usersClasses || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;
      
      if (this.editingUser) {
        // Actualizar usuario existente
        this.userService.updateUser(this.editingUser.userId, this.userForm.value).subscribe({
          next: (response) => {
            console.log('Usuario actualizado:', response);
            this.loadUsers();
            this.resetForm();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error actualizando usuario:', error);
            alert('Error: ' + (error.error?.message || 'Error al actualizar usuario'));
            this.isLoading = false;
          }
        });
      } else {
        // Crear nuevo usuario
        this.userService.createUser(this.userForm.value).subscribe({
          next: (response) => {
            console.log('Usuario creado:', response);
            this.loadUsers();
            this.resetForm();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error creando usuario:', error);
            alert('Error: ' + (error.error?.message || 'Error al crear usuario'));
            this.isLoading = false;
          }
        });
      }
    }
  }

  editUser(user: any): void {
    this.editingUser = user;
    this.userForm.patchValue({
      userName: user.userName,
      userLastName: user.userLastName,
      userEmail: user.userEmail,
      userRol: user.userRol,
      userPassword: '' // No mostramos la contraseña actual
    });
  }

  deleteUser(user: any): void {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${user.userName} ${user.userLastName}?`)) {
      this.userService.deleteUser(user.userId).subscribe({
        next: (response) => {
          console.log('Usuario eliminado:', response);
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error eliminando usuario:', error);
          alert('Error: ' + (error.error?.message || 'Error al eliminar usuario'));
        }
      });
    }
  }

  resetForm(): void {
    this.editingUser = null;
    this.userForm.reset();
  }
}
