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
  styleUrls: ['./issue-detail-dialog.component.scss'],
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
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      commentText: ['', Validators.required],
    });

    this.loadComments();
    this.loadSupervisorName();
  }

  // Cargar nombre del supervisor
  loadSupervisorName(): void {
    const supervisor = this.data.issue.issueSupervisor;
    const supervisorName = this.data.issue.supervisorName;

    // Si viene supervisorName del mapeo del backend, usarlo directamente
    if (supervisorName && supervisorName.trim()) {
      this.supervisorName = supervisorName;
      console.log('DEBUG - Usando supervisorName del backend:', supervisorName);
      return;
    }

    // Si supervisor está vacío o undefined
    if (!supervisor) {
      this.supervisorName = 'Sin asignar';
      return;
    }

    // Convertir a string para procesamiento
    const supervisorStr =
      typeof supervisor === 'string' ? supervisor : supervisor.toString();

    // Verificar si es un número (userId)
    const userId = parseInt(supervisorStr);
    if (!isNaN(userId) && userId.toString() === supervisorStr) {
      // Es un ID de usuario, cargar el nombre desde el API
      this.userService.getUserById(userId).subscribe({
        next: (user) => {
          if (user && user.userName) {
            this.supervisorName = user.userLastName
              ? `${user.userName} ${user.userLastName}`
              : user.userName;
          } else {
            this.supervisorName = `Usuario #${userId}`;
          }
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.supervisorName = `Usuario #${userId}`;
        },
      });
    } else {
      // Ya es un nombre, usarlo directamente
      this.supervisorName = supervisorStr;
    }
  }

  // Cargar comentarios del issue
  loadComments(): void {
    if (!this.data.issue.issueId) return;

    this.isLoadingComments = true;
    this.apiService.getCommentsByIssue(this.data.issue.issueId).subscribe({
      next: (comments) => {
        // Mapear comentarios del backend al frontend
        this.comments = comments.map((comment: any) => ({
          ...comment,
          // Ajustamos para que coincida con lo que el backend realmente envía
          userName: comment.user?.userName
            ? `${comment.user.userName} ${comment.user.userLastName || ''}`.trim()
            : comment.userName || 'Usuario',
        }));

        this.isLoadingComments = false;
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.comments = [];
        this.isLoadingComments = false;
      },
    });
  }

  // Agregar nuevo comentario
  addComment(): void {
    if (this.commentForm.invalid || !this.data.issue.issueId) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      alert('No hay usuario logueado');
      return;
    }

    const newComment: any = {
      // Usamos any para evitar líos de tipos momentáneos
      description: this.commentForm.value.commentText,
      idUser: currentUser.userId,
      idIssue: this.data.issue.issueId,
      user: currentUser.userId,
      issue: this.data.issue.issueId,
    };

    this.apiService.createComment(newComment).subscribe({
      next: (responseFromServer) => {
        // En lugar de hacer push y luego load, vamos a llamar solo a load para que el backend nos de la versión "oficial"
        this.loadComments();
        this.commentForm.reset();
      },
      error: (error) => {
        console.error('Error creating comment:', error);
        alert(
          'Error al agregar el comentario: ' +
            (error.error?.message || error.message),
        );
      },
    });
  }

  // Cerrar diálogo
  close(): void {
    this.dialogRef.close();
  }

  // Obtener label de prioridad
  getPriorityLabel(priority: string | undefined): string {
    const priorityMap: { [key: string]: string } = {
      low: '🟢 Baja',
      medium: '🟡 Media',
      high: '🔴 Alta',
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
      minute: '2-digit',
    });
  }
}
