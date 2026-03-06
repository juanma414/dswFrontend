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

    // Cargar datos - usuarios primero, luego el resto
    this.loadUsersAndThenIssues();
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
      next: (issues) => {
        console.log('=== Cargando issues desde API ===');
        console.log('Total de issues:', issues?.length || 0);
        
        if (issues && Array.isArray(issues)) {
          // Inspeccionar estructura completa del primer issue
          if (issues.length > 0) {
            console.log('\n📋 ESTRUCTURA DEL PRIMER ISSUE:');
            console.log('Keys disponibles:', Object.keys(issues[0]));
            console.log('JSON completo:', JSON.stringify(issues[0], null, 2));
          }

          // Mapear campos del backend al frontend
          this.allIssues = issues.map((issue: any, index: number) => {
            console.log(`\n--- Issue ${index + 1} ---`);
            
            // El backend devuelve issueDescription como el contenido principal
            // Si contiene ':', dividirlo en título y descripción
            const fullDescription = issue.issueDescription || issue.title || 'Sin título';
            let title = 'Sin título';
            let description = 'Sin descripción';
            
            if (fullDescription.includes(':')) {
              const parts = fullDescription.split(':');
              title = parts[0].trim();
              description = parts.slice(1).join(':').trim();
            } else {
              title = fullDescription;
            }
            
            // Extraer supervisor - probar TODAS las posibilidades
            let supervisorId: any = null;
            let supervisorName = '';
            
            console.log('🔍 Buscando supervisor en issue...');
            console.log('  - issue.supervisorData:', issue.supervisorData);
            console.log('  - issue.issueSupervisor:', issue.issueSupervisor);
            
            // 1. Si viene en supervisorData (nueva estructura)
            if (issue.supervisorData && typeof issue.supervisorData === 'object') {
              supervisorId = issue.supervisorData.userId;
              supervisorName = `${issue.supervisorData.userName || ''} ${issue.supervisorData.userLastName || ''}`.trim();
              
              // Si solo tenemos el nombre (sin apellido), buscar en availableUsers para obtener datos completos
              if (!issue.supervisorData.userLastName && supervisorId && this.availableUsers.length > 0) {
                const fullUser = this.availableUsers.find(u => u.userId === supervisorId);
                if (fullUser) {
                  supervisorName = `${fullUser.userName || ''} ${fullUser.userLastName || ''}`.trim();
                  console.log('✓ Nombre completo encontrado en availableUsers:', supervisorName);
                }
              }
              
              console.log('✓ Supervisor encontrado en issue.supervisorData:', { supervisorId, supervisorName });
            } 
            // 2. Si en la relación viene el usuario completo (issue.supervisor)
            else if (issue.supervisor && typeof issue.supervisor === 'object') {
              supervisorId = issue.supervisor.userId;
              supervisorName = `${issue.supervisor.userName || ''} ${issue.supervisor.userLastName || ''}`.trim();
              console.log('✓ Supervisor encontrado en issue.supervisor:', { supervisorId, supervisorName });
            } 
            // 3. Si viene en issue.user
            else if (issue.user && typeof issue.user === 'object') {
              supervisorId = issue.user.userId;
              supervisorName = `${issue.user.userName || ''} ${issue.user.userLastName || ''}`.trim();
              console.log('✓ Supervisor encontrado en issue.user:', { supervisorId, supervisorName });
            }
            // 4. Si viene en issue.assignedTo
            else if (issue.assignedTo && typeof issue.assignedTo === 'object') {
              supervisorId = issue.assignedTo.userId;
              supervisorName = `${issue.assignedTo.userName || ''} ${issue.assignedTo.userLastName || ''}`.trim();
              console.log('✓ Supervisor encontrado en issue.assignedTo:', { supervisorId, supervisorName });
            }
            // 5. Si viene como issueSupervisor (solo ID)
            else if (issue.issueSupervisor) {
              supervisorId = issue.issueSupervisor;
              console.log('✓ Supervisor ID encontrado en issue.issueSupervisor:', supervisorId);
            }
            // 6. Si viene como idSupervisor (solo ID)
            else if (issue.idSupervisor) {
              supervisorId = issue.idSupervisor;
              console.log('✓ Supervisor ID encontrado en issue.idSupervisor:', supervisorId);
            }
            // 7. Si viene como supervisorId (solo ID)
            else if (issue.supervisorId) {
              supervisorId = issue.supervisorId;
              console.log('✓ Supervisor ID encontrado en issue.supervisorId:', supervisorId);
            }
            // 8. Si viene como userId (solo ID)
            else if (issue.userId) {
              supervisorId = issue.userId;
              console.log('✓ Supervisor ID encontrado en issue.userId:', supervisorId);
            }
            else {
              console.log('⚠️ NO se encontró supervisor en ningún campo');
            }
            
            return {
              issueId: issue.issueId,
              title: title,
              description: description,
              issueStataus: issue.issueStataus || issue.status,
              issueSupervisor: supervisorId,
              supervisorName: supervisorName, // Nombre completo si viene del backend
              issuePriority: issue.issuePriority || 'medium',
              idProject: issue.project?.projectId || issue.projectId || issue.idProject,
              idSprint: issue.sprint?.idSprint || issue.sprintId || issue.idSprint,
              typeIssueId: issue.typeIssueId || issue.typeIssue,
              typeIssueDescription: issue.typeIssueDescription
            };
          });

          this.applyFilters();
          console.log('\n=== Issues procesados correctamente ===');
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

    this.apiService.createIssue(newIssue as any).subscribe({
      next: (issue) => {
        console.log('Issue creado:', issue);
        
        // Mapear campos del backend al frontend
        const mappedIssue: ITask = {
          issueId: issue.issueId,
          title: this.todoForm.value.title,
          description: this.todoForm.value.description,
          issueStataus: issue.issueStataus || 'todo',
          issueSupervisor: issue.issueSupervisor,
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
      this.apiService.updateIssue(issueId, updatedIssue as any).subscribe({
        next: (issue) => {
          this.tasks[this.updateIndex].title = issue.title || issue.description;
          this.tasks[this.updateIndex].description = issue.description;
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
          next: (closedIssue) => {
            console.log('Issue cerrado:', closedIssue);
            const endDate = new Date(closedIssue.issueEndDate || new Date()).toLocaleString();
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
          next: (updatedIssue) => {
            transferArrayItem(
              event.previousContainer.data,
              event.container.data,
              event.previousIndex,
              event.currentIndex
            );
            // Actualizar el estado local
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
    return user ? user.userRol === 'administrator' : false;
  }

  // Cargar usuarios disponibles para asignación
  loadUsers(): void {
    console.log('DEBUG - Cargando usuarios desde loadUsers()...');
    this.apiService.getUsers().subscribe({
      next: (users) => {
        console.log('DEBUG - Usuarios cargados en todo.component:', users);
        console.log('DEBUG - Tipo de usuarios:', typeof users, 'Es array?', Array.isArray(users));
        console.log('DEBUG - Cantidad de usuarios:', users?.length || 0);
        
        if (Array.isArray(users) && users.length > 0) {
          this.availableUsers = users;
          console.log('DEBUG - Usuarios asignados a availableUsers:', this.availableUsers);
        } else {
          console.warn('DEBUG - Usuarios vacío o no es array');
          this.availableUsers = [];
        }
        
        console.log('DEBUG - availableUsers final:', this.availableUsers);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        console.error('Error details:', error.error, error.message);
        this.availableUsers = [];
        alert('Error al cargar usuarios: ' + (error.error?.message || error.message));
      }
    });
  }

  // Cargar usuarios primero, luego issues y tipos
  loadUsersAndThenIssues(): void {
    this.apiService.getUsers().subscribe({
      next: (users) => {
        console.log('DEBUG - Usuarios cargados, asignando a availableUsers...');
        
        if (Array.isArray(users) && users.length > 0) {
          this.availableUsers = users;
        } else {
          this.availableUsers = [];
        }
        
        console.log('DEBUG - availableUsers poblado con', this.availableUsers.length, 'usuarios');
        
        // Ahora cargar issues y tipos de issue
        this.loadTypeIssues();
        this.loadIssues();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.availableUsers = [];
        // Seguir cargando issues de todas formas
        this.loadTypeIssues();
        this.loadIssues();
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
    
    // Enviar el ID del usuario (userId), no el nombre
    this.apiService.updateIssueAssignment(this.editingIssue.issueId, userId).subscribe({
      next: (response) => {
        console.log('DEBUG - Asignación actualizada:', response);
        
        // Actualizar localmente con el ID (como string, porque el backend lo espera así) y el nombre
        this.editingIssue.issueSupervisor = userId.toString();
        this.editingIssue.supervisorName = fullName;
        
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
  getSupervisorDisplayName(issue: ITask | string | number | undefined): string {
    // Si recibe undefined o null
    if (!issue) {
      return 'Sin Asignar';
    }

    // Si recibe un objeto ITask
    if (typeof issue === 'object' && issue !== null) {
      const taskIssue = issue as ITask;
      
      // Retornar el nombre completo si está disponible (viene del backend)
      if (taskIssue.supervisorName && taskIssue.supervisorName.trim() && taskIssue.supervisorName !== 'Sin Asignar') {
        return taskIssue.supervisorName;
      }
      
      // Si no hay nombre pero hay ID, buscar en availableUsers
      if (taskIssue.issueSupervisor) {
        const userId = typeof taskIssue.issueSupervisor === 'string' 
          ? parseInt(taskIssue.issueSupervisor) 
          : (taskIssue.issueSupervisor as number);
        
        if (!isNaN(userId)) {
          const user = this.availableUsers.find(u => {
            const userIdNum = typeof u.userId === 'string' ? parseInt(u.userId) : u.userId;
            return userIdNum === userId;
          });
          
          if (user) {
            return `${user.userName || ''} ${user.userLastName || ''}`.trim();
          }
        }
      }
    }

    // Si recibe string o número, asumir que es solo el ID y buscar
    if (typeof issue === 'string' || typeof issue === 'number') {
      const userId = typeof issue === 'string' ? parseInt(issue) : (issue as number);
      
      if (!isNaN(userId)) {
        const user = this.availableUsers.find(u => {
          const userIdNum = typeof u.userId === 'string' ? parseInt(u.userId) : u.userId;
          return userIdNum === userId;
        });
        
        if (user) {
          return `${user.userName || ''} ${user.userLastName || ''}`.trim();
        }
      }
    }

    return 'Sin Asignar';
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
      next: (typeIssues) => {
        console.log('DEBUG - Tipos de issue cargados:', typeIssues);
        this.availableTypeIssues = typeIssues;
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