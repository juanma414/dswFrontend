import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITask } from '../model/task';
import { IComment } from '../model/comment';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-issue-detail-dialog',
  templateUrl: './issue-detail-dialog.component.html',
  styleUrls: ['./issue-detail-dialog.component.scss']
})
export class IssueDetailDialogComponent implements OnInit {
  commentForm!: FormGroup;
  comments: IComment[] = [];
  isLoadingComments = false;
  supervisorName = '';

  constructor(
    public dialogRef: MatDialogRef<IssueDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { issue: ITask },
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      commentText: ['', Validators.required]
    });

    this.loadComments();
    this.loadSupervisorName();
  }

  // Cargar nombre del supervisor
  loadSupervisorName(): void {
    const supervisor = this.data.issue.issueSupervisor;
    
    // Si supervisor está vacío o undefined
    if (!supervisor) {
      this.supervisorName = 'Sin asignar';
      return;
    }

    // Verificar si es un número (userId)
    const userId = parseInt(supervisor);
    if (!isNaN(userId) && userId.toString() === supervisor) {
      // Es un ID de usuario, cargar el nombre desde el API
      this.userService.getUserById(userId).subscribe({
        next: (response) => {
          const user = response.data || response;
          if (user && user.userName && user.userLastName) {
            this.supervisorName = `${user.userName} ${user.userLastName}`;
          } else {
            this.supervisorName = `Usuario #${userId}`;
          }
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.supervisorName = `Usuario #${userId}`;
        }
      });
    } else {
      // Ya es un nombre, usarlo directamente
      this.supervisorName = supervisor;
    }
  }

  // Cargar comentarios del issue
  loadComments(): void {
    if (!this.data.issue.issueId) return;

    this.isLoadingComments = true;
    this.apiService.getCommentsByIssue(this.data.issue.issueId).subscribe({
      next: (response) => {
        const comments = response.data || response.comments || response || [];
        // Mapear comentarios del backend al frontend
        this.comments = comments.map((comment: any) => ({
          ...comment,
          userName: comment.user ? `${comment.user.userName} ${comment.user.userLastName}` : 'Usuario'
        }));
        this.isLoadingComments = false;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.comments = [];
        this.isLoadingComments = false;
      }
    });
  }

  // Agregar nuevo comentario
  addComment(): void {
    if (this.commentForm.invalid || !this.data.issue.issueId) return;

    const currentUser = this.authService.getCurrentUser();
    const newComment = {
      description: this.commentForm.value.commentText,
      user: currentUser.userId,  // MikroORM usa el nombre de la relación
      issue: this.data.issue.issueId  // MikroORM usa el nombre de la relación
    };

    this.apiService.createComment(newComment as any).subscribe({
      next: (response) => {
        const comment = response.data || response;
        // Agregar nombre del usuario para la UI
        const commentWithUser = {
          ...comment,
          userName: `${currentUser.userName} ${currentUser.userLastName}`
        };
        this.comments.push(commentWithUser);
        this.commentForm.reset();
      },
      error: (error) => {
        console.error('Error creating comment:', error);
        alert('Error al agregar el comentario: ' + (error.error?.message || error.message));
      }
    });
  }

  // Cerrar diálogo
  close(): void {
    this.dialogRef.close();
  }

  // Obtener label de prioridad
  getPriorityLabel(priority: string | undefined): string {
    const priorityMap: { [key: string]: string } = {
      'low': '🟢 Baja',
      'medium': '🟡 Media',
      'high': '🔴 Alta'
    };
    return priorityMap[priority || 'medium'] || '🟡 Media';
  }

  // Obtener clase CSS de prioridad
  getPriorityClass(priority: string | undefined): string {
    return `priority-${priority || 'medium'}`;
  }

  // Formatear fecha
  formatDate(date: Date | undefined): string {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
