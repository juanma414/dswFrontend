import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import { ITask } from '../model/task';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ProjectSprintService } from '../services/project-sprint.service';
import { Project, Sprint } from '../model/project';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IssueDetailDialogComponent } from './issue-detail-dialog.component';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.scss']
})
export class TodoComponent implements OnInit, OnDestroy {

  todoForm !: FormGroup;
  tasks : ITask [] = [];
  inprogress: ITask [] = [];
  done: ITask [] = [];
  updateIndex!:any;
  isEditEnabled:boolean = false;

  issues : any[] = [];
  allIssues: ITask[] = []; // Todos los issues sin filtrar
  
  // Propiedades para asignación de usuarios
  availableUsers: any[] = [];
  editingIssue: any = null;
  isAssignmentModalOpen: boolean = false;
  
  // Tipos de issue disponibles
  availableTypeIssues: any[] = [];

  // Filtros de proyecto y sprint
  selectedProject: Project | null = null;
  selectedSprint: Sprint | null = null;
  private projectSubscription?: Subscription;
  private sprintSubscription?: Subscription;

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService,
    private authService: AuthService,
    private projectSprintService: ProjectSprintService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void{
    // Cargar usuarios primero, luego los issues
    this.loadUsers();
    this.loadTypeIssues();
    this.loadIssues();
    
    this.todoForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['medium', Validators.required], // Valor por defecto: media
      typeIssue: ['', Validators.required] // Tipo de issue es obligatorio
    });

    // Suscribirse a cambios de proyecto
    this.projectSubscription = this.projectSprintService.selectedProject$.subscribe(
      (project) => {
        this.selectedProject = project;
        this.applyFilters();
      }
    );

    // Suscribirse a cambios de sprint
    this.sprintSubscription = this.projectSprintService.selectedSprint$.subscribe(
      (sprint) => {
        this.selectedSprint = sprint;
        this.applyFilters();
      }
    );
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
    if (this.sprintSubscription) {
      this.sprintSubscription.unsubscribe();
    }
  }

  // Cargar todos los issues desde la API
  loadIssues(){
    this.apiService.getIssues().subscribe({
      next: (response) => {
        console.log('Respuesta completa del backend:', response);
        
        // El backend devuelve { messge: "...", issueClass: [...] }
        const issues = response.issueClass || response.data || response;
        console.log('Issues extraídos:', issues);
        
        if (issues && Array.isArray(issues)) {
          // Mapear campos del backend al frontend
          this.allIssues = issues.map((issue: any) => {
            console.log('Issue individual del backend:', issue);
            return {
              issueId: issue.issueId,
              title: issue.title || issue.issueDescription || 'Sin título',
              description: issue.issueDescription || issue.description || 'Sin descripción',
              issueStataus: issue.issueStataus,
              issueSupervisor: issue.issueSupervisor,
              issuePriority: issue.issuePriority || 'medium',
              // MikroORM devuelve las relaciones como objetos, extraer los IDs
              idProject: issue.project?.projectId || issue.idProject,
              idSprint: issue.sprint?.idSprint || issue.idSprint,
              typeIssueId: issue.typeIssue?.typeIssueId, // ID del tipo de issue
              typeIssueDescription: issue.typeIssue?.typeIssueDescription // Descripción del tipo
            };
          });

          // Aplicar filtros iniciales
          this.applyFilters();
          
          console.log('All issues cargados:', this.allIssues);
          console.log('Tasks filtradas:', this.tasks);
          console.log('In Progress filtradas:', this.inprogress);
          console.log('Done filtradas:', this.done);
        } else {
          console.error('Issues no es un array:', issues);
        }
      },
      error: (error) => {
        console.error('Error loading issues:', error);
      }
    });
  }

  // Aplicar filtros de proyecto y sprint
  applyFilters(): void {
    let filtered = [...this.allIssues];

    console.log('=== APLICANDO FILTROS ===');
    console.log('Total de issues:', filtered.length);
    console.log('Proyecto seleccionado:', this.selectedProject);
    console.log('Sprint seleccionado:', this.selectedSprint);

    // Filtrar por proyecto si está seleccionado
    if (this.selectedProject) {
      console.log('Filtrando por proyecto ID:', this.selectedProject.idProject);
      filtered = filtered.filter(issue => {
        console.log(`Issue ${issue.issueId}: idProject=${issue.idProject}, match=${issue.idProject === this.selectedProject!.idProject}`);
        return issue.idProject === this.selectedProject!.idProject;
      });
      console.log('Issues después de filtrar por proyecto:', filtered.length);
    }

    // Filtrar por sprint si está seleccionado
    if (this.selectedSprint) {
      console.log('Filtrando por sprint ID:', this.selectedSprint.idSprint);
      filtered = filtered.filter(issue => {
        console.log(`Issue ${issue.issueId}: idSprint=${issue.idSprint}, match=${issue.idSprint === this.selectedSprint!.idSprint}`);
        return issue.idSprint === this.selectedSprint!.idSprint;
      });
      console.log('Issues después de filtrar por sprint:', filtered.length);
    }

    // Separar por estado
    this.tasks = filtered.filter((issue: any) => issue.issueStataus === 'todo');
    this.inprogress = filtered.filter((issue: any) => issue.issueStataus === 'inprogress');
    this.done = filtered.filter((issue: any) => issue.issueStataus === 'done');

    console.log('Resultado final - TODO:', this.tasks.length, 'IN PROGRESS:', this.inprogress.length, 'DONE:', this.done.length);
    console.log('=== FIN FILTROS ===');
  }

  // Agregar nuevo issue
  addTask(){
    console.log('Método addTask() llamado');
    console.log('Valores del formulario:', this.todoForm.value);
    console.log('Estado del formulario - válido:', this.todoForm.valid);
    console.log('Estado del formulario - inválido:', this.todoForm.invalid);

    // Verificar que el formulario sea válido
    if (this.todoForm.invalid) {
      console.log('Formulario inválido');
      alert('Por favor completa todos los campos');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const newIssue = {
      issueDescription: `${this.todoForm.value.title}: ${this.todoForm.value.description}`,
      issueStataus: 'todo',
      issueCreateDate: new Date(),
      issuePriority: this.todoForm.value.priority || 'medium',
      issueSupervisor: currentUser?.userId?.toString() || 'Usuario',
      typeIssue: parseInt(this.todoForm.value.typeIssue) // ID del tipo de issue seleccionado
    };

    console.log('Enviando nuevo issue:', newIssue);

    this.apiService.createIssue(newIssue).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        const issue = response.data || response;
        console.log('Issue creado:', issue);
        
        // Mapear campos del backend al frontend
        const mappedIssue = {
          issueId: issue.issueId,
          title: this.todoForm.value.title,
          description: this.todoForm.value.description,
          issueStataus: issue.issueStataus || 'todo',
          issueSupervisor: issue.issueSupervisor || 'Usuario', // ¡AGREGAR ESTE CAMPO!
          issuePriority: issue.issuePriority || this.todoForm.value.priority || 'medium'
        };
        
        console.log('Issue mapeado:', mappedIssue);
        this.tasks.push(mappedIssue);
        this.todoForm.reset();
        
        alert('Issue creado exitosamente!');
      },
      error: (error) => {
        console.error('Error creating issue:', error);
        alert('Error al crear el issue: ' + (error.error?.message || error.message));
      }
    });
  }
  // Editar issue
  onEdit(item: ITask, i:number){
    this.todoForm.controls['title'].setValue(item.title);
    this.todoForm.controls['description'].setValue(item.description);
    this.todoForm.controls['priority'].setValue(item.issuePriority || 'medium');
    this.todoForm.controls['typeIssue'].setValue(item.typeIssueId || '');
    this.updateIndex = i;
    this.isEditEnabled = true;
  }

  // Actualizar issue
  updateTask(){
    const updatedIssue = {
      title: this.todoForm.value.title,
      issueDescription: this.todoForm.value.description,
      issuePriority: this.todoForm.value.priority,
      issueStataus: this.tasks[this.updateIndex].issueStataus,
      typeIssue: parseInt(this.todoForm.value.typeIssue)
    };

    const issueId = this.tasks[this.updateIndex].issueId;
    if (issueId) {
      this.apiService.updateIssue(issueId, updatedIssue).subscribe({
        next: (response) => {
          const issue = response.data || response;
          this.tasks[this.updateIndex].title = issue.title || issue.issueDescription;
          this.tasks[this.updateIndex].description = issue.issueDescription;
          this.tasks[this.updateIndex].issuePriority = issue.issuePriority;
          this.todoForm.reset();
          this.updateIndex = undefined;
          this.isEditEnabled = false;
        },
        error: (error) => {
          console.error('Error updating issue:', error);
        }
      });
    }
  }

  // Eliminar issue de To Do (solo administradores)
  deleteTask(i:number){
    // Verificar si es administrador
    if (!this.isAdmin()) {
      alert('Solo los administradores pueden eliminar issues');
      return;
    }
    
    const issue = this.tasks[i];
    
    // Confirmación antes de eliminar
    if (confirm('¿Estás seguro de que quieres eliminar este issue?')) {
      if (issue.issueId) {
        this.apiService.deleteIssue(issue.issueId).subscribe({
          next: () => {
            // Remover de la vista (ya no aparecerá en futuras cargas)
            this.tasks.splice(i, 1);
            console.log('Issue marcado como eliminado');
          },
          error: (error) => {
            console.error('Error deleting issue:', error);
            alert('Error: ' + (error.error?.message || 'Error al eliminar el issue'));
          }
        });
      }
    }
  }

  // Eliminar issue de In Progress (solo administradores)
  deleteInProgressTask(i:number){
    // Verificar si es administrador
    if (!this.isAdmin()) {
      alert('Solo los administradores pueden eliminar issues');
      return;
    }
    
    const issue = this.inprogress[i];
    
    if (confirm('¿Estás seguro de que quieres eliminar este issue?')) {
      if (issue.issueId) {
        this.apiService.deleteIssue(issue.issueId).subscribe({
          next: () => {
            this.inprogress.splice(i, 1);
            console.log('Issue marcado como eliminado');
          },
          error: (error) => {
            console.error('Error deleting issue:', error);
            alert('Error: ' + (error.error?.message || 'Error al eliminar el issue'));
          }
        });
      }
    }
  }

  // Eliminar issue de Done (solo administradores)
  deleteDoneTask(i:number){
    // Verificar si es administrador
    if (!this.isAdmin()) {
      alert('Solo los administradores pueden eliminar issues');
      return;
    }
    
    const issue = this.done[i];
    
    if (confirm('¿Estás seguro de que quieres eliminar este issue?')) {
      if (issue.issueId) {
        this.apiService.deleteIssue(issue.issueId).subscribe({
          next: () => {
            this.done.splice(i, 1);
            console.log('Issue marcado como eliminado');
          },
          error: (error) => {
            console.error('Error deleting issue:', error);
            alert('Error: ' + (error.error?.message || 'Error al eliminar el issue'));
          }
        });
      }
    }
  }

  // Marcar issue como completado (botón check)
  completeIssue(i: number) {
    const issue = this.done[i];
    if (confirm('¿Marcar este issue como cerrado? Desaparecerá del tablero y se registrará la fecha de cierre.')) {
      if (issue.issueId) {
        this.apiService.updateIssueStatus(issue.issueId, 'closed').subscribe({
          next: (response) => {
            console.log('Issue cerrado:', response);
            const closedIssue = response.data || response;
            const endDate = new Date(closedIssue.issueEndDate).toLocaleString();
            this.done.splice(i, 1);
            console.log('Issue marcado como cerrado con fecha:', endDate);
            alert(`Issue cerrado exitosamente!\nFecha de cierre: ${endDate}`);
          },
          error: (error) => {
            console.error('Error cerrando issue:', error);
            alert('Error al cerrar el issue: ' + (error.error?.message || error.message));
          }
        });
      }
    }
  }

  // Drag and Drop con actualización en backend
  drop(event: CdkDragDrop<ITask[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const issue = event.previousContainer.data[event.previousIndex];
      let newStatus = '';

      // Determinar el nuevo estado basado en el contenedor de destino
      if (event.container.data === this.tasks) {
        newStatus = 'todo';
      } else if (event.container.data === this.inprogress) {
        newStatus = 'inprogress';
      } else if (event.container.data === this.done) {
        newStatus = 'done';
      }

      // Actualizar el estado en la API
      if (issue.issueId) {
        this.apiService.updateIssueStatus(issue.issueId, newStatus).subscribe({
          next: (response) => {
            transferArrayItem(
              event.previousContainer.data,
              event.container.data,
              event.previousIndex,
              event.currentIndex
            );
            // Actualizar el estado local
            const updatedIssue = response.data || response;
            event.container.data[event.currentIndex].issueStataus = updatedIssue.issueStataus;
          },
          error: (error) => {
            console.error('Error updating issue status:', error);
            alert('No se pudo cambiar el estado del issue');
          }
        });
      }
    }
  }

  // Verificar si el usuario actual es administrador
  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user && user.userRol === 'administrator';
  }

  // Cargar usuarios disponibles para asignación
  loadUsers(): void {
    console.log('DEBUG - Cargando usuarios...');
    this.apiService.getUsers().subscribe({
      next: (response) => {
        console.log('DEBUG - Respuesta de usuarios:', response);
        this.availableUsers = response.usersClasses || response.data || response;
        console.log('DEBUG - Usuarios procesados:', this.availableUsers);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        alert('Error al cargar usuarios: ' + (error.error?.message || error.message));
      }
    });
  }

  // Abrir modal de asignación
  openAssignmentModal(issue: any): void {
    console.log('DEBUG - Abriendo modal para issue:', issue);
    console.log('DEBUG - Es admin?', this.isAdmin());
    console.log('DEBUG - Usuarios disponibles:', this.availableUsers);
    
    if (!this.isAdmin()) {
      alert('Solo los administradores pueden cambiar asignaciones');
      return;
    }
    
    this.editingIssue = issue;
    this.isAssignmentModalOpen = true;
    console.log('DEBUG - Modal abierto, editingIssue:', this.editingIssue);
  }

  // Cerrar modal de asignación
  closeAssignmentModal(): void {
    this.editingIssue = null;
    this.isAssignmentModalOpen = false;
  }

  // Asignar issue a un usuario
  assignIssueToUser(userId: number, userName: string, userLastName: string): void {
    console.log('DEBUG - Asignando issue a usuario:', { userId, userName, userLastName });
    console.log('DEBUG - Issue a editar:', this.editingIssue);
    
    if (!this.editingIssue) {
      console.error('No hay issue para editar');
      return;
    }

    const fullName = `${userName} ${userLastName}`;
    console.log('DEBUG - Nombre completo:', fullName);
    
    this.apiService.updateIssueAssignment(this.editingIssue.issueId, fullName).subscribe({
      next: (response) => {
        console.log('DEBUG - Asignación actualizada:', response);
        
        // Actualizar localmente
        this.editingIssue.issueSupervisor = fullName;
        
        // Recargar issues para asegurar consistencia
        this.loadIssues();
        
        this.closeAssignmentModal();
        alert(`Issue asignado a ${fullName} exitosamente`);
      },
      error: (error) => {
        console.error('Error updating assignment:', error);
        alert('Error al cambiar la asignación: ' + (error.error?.message || error.message));
      }
    });
  }

  // Obtener información del usuario actual
  getCurrentUser(): any {
    return this.authService.getCurrentUser();
  }

  // Mapear issueSupervisor a nombre legible
  getSupervisorDisplayName(issueSupervisor: string | undefined): string {
    console.log('DEBUG - issueSupervisor recibido:', issueSupervisor, 'tipo:', typeof issueSupervisor);
    
    if (!issueSupervisor) {
      console.log('DEBUG - issueSupervisor está vacío o undefined');
      return 'Sin Asignar';
    }

    // Verificar si es un número (userId)
    const userId = parseInt(issueSupervisor);
    if (!isNaN(userId) && userId.toString() === issueSupervisor) {
      // Es un ID de usuario, buscar en la lista de usuarios disponibles
      console.log('DEBUG - Buscando usuario con ID:', userId, 'en', this.availableUsers.length, 'usuarios');
      
      const user = this.availableUsers.find(u => u.userId === userId);
      if (user) {
        const fullName = `${user.userName} ${user.userLastName}`;
        console.log('DEBUG - Usuario encontrado:', fullName);
        return fullName;
      }
      
      // Si no se encuentra en availableUsers, verificar si es el usuario actual
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.userId === userId) {
        return `${currentUser.userName} ${currentUser.userLastName}`;
      }
      
      // Si no se encuentra, mostrar mensaje genérico
      console.log('DEBUG - Usuario no encontrado con ID:', userId);
      return `Usuario #${userId}`;
    }

    // Mapeo de nombres conocidos para compatibilidad con datos anteriores
    const nameMap: { [key: string]: string } = {
      'Admin': 'Administrador',
      'Juan Perez': 'Juan Pérez',
      'Designer': 'Diseñador UI/UX',
      'Backend Dev': 'Desarrollador Backend',
      'Usuario': 'Usuario General'
    };

    const result = nameMap[issueSupervisor] || issueSupervisor;
    console.log('DEBUG - resultado final:', result);
    return result;
  }

  // Mapear prioridad a etiqueta legible
  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': '🟢 Baja',
      'medium': '🟡 Media',
      'high': '🔴 Alta'
    };
    return priorityMap[priority] || '🟡 Media';
  }

  // Abrir diálogo con detalles del issue
  openIssueDetail(issue: ITask): void {
    const dialogRef = this.dialog.open(IssueDetailDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { issue }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Opcional: recargar issues si es necesario
      // this.loadIssues();
    });
  }

  // Cargar tipos de issue disponibles
  loadTypeIssues(): void {
    console.log('DEBUG - Cargando tipos de issue...');
    this.apiService.getTypeIssues().subscribe({
      next: (response) => {
        console.log('DEBUG - Respuesta de tipos de issue:', response);
        this.availableTypeIssues = response.data || response;
        console.log('DEBUG - Tipos de issue procesados:', this.availableTypeIssues);
        
        // Si no hay tipos de issue, crear uno por defecto
        if (this.availableTypeIssues.length === 0) {
          console.warn('No hay tipos de issue disponibles');
          this.availableTypeIssues = [{ typeIssueId: 1, typeIssueDescription: 'Tarea' }];
        }
      },
      error: (error) => {
        console.error('Error loading type issues:', error);
        // Usar un tipo de issue por defecto en caso de error
        this.availableTypeIssues = [{ typeIssueId: 1, typeIssueDescription: 'Tarea' }];
      }
    });
  }
}