import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectSprintService } from '../services/project-sprint.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Project, Sprint } from '../model/project';
import { ITask } from '../model/task';
import { Subscription } from 'rxjs';

interface Issue {
  issueId?: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'backlog';
  createdAt?: Date;
  idProject?: number;
  idSprint?: number;
  typeIssueId?: number;
  typeIssueDescription?: string;
  issueSupervisor?: string;
}

@Component({
  selector: 'app-backlog',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit, OnDestroy {
  issues: Issue[] = [];
  allIssues: Issue[] = [];
  loading = false;
  formReady = false;
  
  newIssue: Issue = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'backlog'
  };

  // Datos para selectores
  availableTypeIssues: any[] = [];
  availableSprints: Sprint[] = [];
  availableProjects: Project[] = [];
  availableUsers: any[] = [];
  selectedTypeIssue: number | null = null;
  selectedSprintForNew: number | null = null;
  selectedProjectForNew: number | null = null;
  selectedUserForNew: number | null = null;

  // Filtro de proyecto
  selectedProject: Project | null = null;
  private projectSubscription?: Subscription;

  // Variable para el diálogo de asignación
  assigningIssue: Issue | null = null;
  selectedSprintForAssign: number | null = null;
  selectedProjectForAssign: number | null = null;
  selectedUserForAssign: number | null = null;
  showAssignDialog = false;

  // Variables para creación de proyecto
  showCreateProjectDialog = false;
  newProject = {
    description: ''
  };

  // Variables para creación de sprint
  showCreateSprintDialog = false;
  newSprint = {
    nroSprint: null as number | null,
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    idProject: null as number | null
  };

  constructor(
    private router: Router,
    private projectSprintService: ProjectSprintService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Cargar datos necesarios para el formulario
    Promise.all([
      this.loadTypeIssuesPromise(),
      this.loadProjectsPromise(),
      this.loadUsersPromise()
    ]).then(() => {
      this.formReady = true;
      console.log('Formulario listo - Types:', this.availableTypeIssues.length, 'Projects:', this.availableProjects.length, 'Users:', this.availableUsers.length);
    }).catch(error => {
      console.error('Error cargando datos del formulario:', error);
      this.formReady = true; // Mostrar formulario de todos modos
    });

    this.loadIssues();

    // Suscribirse a cambios de proyecto
    this.projectSubscription = this.projectSprintService.selectedProject$.subscribe(
      (project) => {
        this.selectedProject = project;
        if (project) {
          this.loadSprintsByProject(project.idProject);
          // Inicializar el selector de proyecto para nuevo issue con el proyecto actual
          if (!this.selectedProjectForNew) {
            this.selectedProjectForNew = project.idProject;
          }
        } else {
          this.availableSprints = [];
        }
        this.applyFilters();
      }
    );
  }

  ngOnDestroy(): void {
    // Limpiar suscripción
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
  }

  loadIssues(): void {
    this.loading = true;
    this.apiService.getIssues().subscribe({
      next: (response) => {
        const issues = response.issueClass || response.data || response;
        this.allIssues = issues
          .filter((issue: any) => issue.issueStataus === 'backlog')
          .map((issue: any) => ({
            issueId: issue.issueId,
            title: issue.issueDescription?.split(':')[0] || 'Sin título',
            description: issue.issueDescription || 'Sin descripción',
            priority: issue.issuePriority || 'medium',
            status: 'backlog',
            createdAt: issue.issueCreateDate,
            // MikroORM devuelve las relaciones como objetos, extraer los IDs
            idProject: issue.project?.projectId || issue.idProject,
            idSprint: issue.sprint?.idSprint || issue.idSprint,
            typeIssueId: issue.typeIssue?.typeIssueId,
            typeIssueDescription: issue.typeIssue?.typeIssueDescription,
            issueSupervisor: issue.issueSupervisor
          }));
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading issues:', error);
        this.loading = false;
      }
    });
  }

  loadTypeIssues(): void {
    this.apiService.getTypeIssues().subscribe({
      next: (response) => {
        this.availableTypeIssues = response.data || response;
        if (this.availableTypeIssues.length > 0) {
          this.selectedTypeIssue = this.availableTypeIssues[0].typeIssueId;
        }
      },
      error: (error) => {
        console.error('Error loading type issues:', error);
        this.availableTypeIssues = [];
      }
    });
  }

  loadTypeIssuesPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getTypeIssues().subscribe({
        next: (response) => {
          this.availableTypeIssues = response.data || response;
          if (this.availableTypeIssues.length > 0) {
            this.selectedTypeIssue = this.availableTypeIssues[0].typeIssueId;
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading type issues:', error);
          this.availableTypeIssues = [];
          resolve(); // Resolver de todos modos para no bloquear
        }
      });
    });
  }

  loadProjects(): void {
    this.apiService.getProjects().subscribe({
      next: (response) => {
        this.availableProjects = response.projectsClasses || response.data || [];
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.availableProjects = [];
      }
    });
  }

  loadProjectsPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getProjects().subscribe({
        next: (response) => {
          this.availableProjects = response.projectsClasses || response.data || [];
          resolve();
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.availableProjects = [];
          resolve(); // Resolver de todos modos para no bloquear
        }
      });
    });
  }

  loadUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (response) => {
        this.availableUsers = response.usersClasses || response.data || response.users || response || [];
        console.log('Usuarios disponibles:', this.availableUsers.length);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.availableUsers = [];
      }
    });
  }

  loadUsersPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getUsers().subscribe({
        next: (response) => {
          console.log('Respuesta de API usuarios:', response);
          // El backend retorna usersClasses
          this.availableUsers = response.usersClasses || response.data || response.users || [];
          console.log('Usuarios cargados:', this.availableUsers.length);
          if (this.availableUsers.length > 0) {
            console.log('Primer usuario:', this.availableUsers[0]);
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.availableUsers = [];
          resolve(); // Resolver de todos modos para no bloquear
        }
      });
    });
  }

  loadSprintsByProject(projectId: number): void {
    this.apiService.getSprintsByProject(projectId).subscribe({
      next: (response) => {
        this.availableSprints = response.sprintsClasses || response.data || [];
      },
      error: (error) => {
        console.error('Error loading sprints:', error);
        this.availableSprints = [];
      }
    });
  }

  applyFilters(): void {
    console.log('=== BACKLOG - APLICANDO FILTROS ===');
    console.log('Total de issues en backlog:', this.allIssues.length);
    console.log('Proyecto seleccionado:', this.selectedProject);
    
    if (this.selectedProject) {
      console.log('Filtrando por proyecto ID:', this.selectedProject.idProject);
      this.issues = this.allIssues.filter(issue => {
        console.log(`Issue ${issue.issueId}: idProject=${issue.idProject}, match=${issue.idProject === this.selectedProject!.idProject}`);
        return issue.idProject === this.selectedProject!.idProject;
      });
      console.log('Issues después de filtrar:', this.issues.length);
    } else {
      console.log('Sin filtro de proyecto, mostrando todos');
      this.issues = [...this.allIssues];
    }
    
    console.log('=== FIN FILTROS BACKLOG ===');
  }

  addIssue(): void {
    if (!this.newIssue.title || !this.newIssue.description || !this.selectedTypeIssue) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const projectId = this.selectedProjectForNew || this.selectedProject?.idProject;
    if (!projectId) {
      alert('Por favor selecciona un proyecto');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const newIssueData: any = {
      issueDescription: `${this.newIssue.title}: ${this.newIssue.description}`,
      issueStataus: 'backlog',
      issueCreateDate: new Date(),
      issuePriority: this.newIssue.priority,
      // Si hay un usuario seleccionado, usar ese, sino usar el usuario actual
      issueSupervisor: this.selectedUserForNew?.toString() || currentUser?.userId?.toString() || 'Usuario',
      typeIssue: this.selectedTypeIssue,
      project: projectId  // Backend espera 'project' (relación)
    };

    // Solo agregar sprint si está seleccionado
    if (this.selectedSprintForNew) {
      newIssueData.sprint = this.selectedSprintForNew;
    }

    this.apiService.createIssue(newIssueData).subscribe({
      next: (response) => {
        alert('Issue creado exitosamente en el backlog');
        this.loadIssues();
        
        // Resetear formulario
        this.newIssue = {
          title: '',
          description: '',
          priority: 'medium',
          status: 'backlog'
        };
        this.selectedTypeIssue = this.availableTypeIssues.length > 0 ? this.availableTypeIssues[0].typeIssueId : null;
        this.selectedSprintForNew = null;
        this.selectedProjectForNew = null;
        this.selectedUserForNew = null;
      },
      error: (error) => {
        console.error('Error creating issue:', error);
        alert('Error al crear el issue: ' + (error.error?.message || error.message));
      }
    });
  }

  moveToSprint(issue: Issue): void {
    this.assigningIssue = issue;
    this.selectedSprintForAssign = issue.idSprint || null;
    this.selectedProjectForAssign = issue.idProject || null;
    
    // Intentar obtener el userId actual del issue
    const supervisor = issue.issueSupervisor;
    const userId = supervisor ? parseInt(supervisor) : null;
    this.selectedUserForAssign = (!isNaN(userId!) && userId) ? userId : null;
    
    // Cargar sprints del proyecto seleccionado
    if (this.selectedProjectForAssign) {
      this.loadSprintsByProject(this.selectedProjectForAssign);
    }
    
    this.showAssignDialog = true;
  }

  onProjectChangeInAssign(): void {
    if (this.selectedProjectForAssign) {
      this.loadSprintsByProject(this.selectedProjectForAssign);
      this.selectedSprintForAssign = null; // Reset sprint selection
    }
  }

  confirmAssignToSprint(): void {
    if (!this.assigningIssue) {
      alert('Error: No hay issue seleccionado');
      return;
    }

    if (!this.selectedProjectForAssign) {
      alert('Por favor selecciona un proyecto');
      return;
    }

    const updateData: any = {
      issueStataus: 'todo',  // Siempre cambiar a 'todo' cuando se asigna desde backlog
      project: this.selectedProjectForAssign  // Backend espera 'project' (relación)
    };

    if (this.selectedSprintForAssign) {
      updateData.sprint = this.selectedSprintForAssign;  // Backend espera 'sprint' (relación)
    }

    if (this.selectedUserForAssign) {
      updateData.issueSupervisor = this.selectedUserForAssign.toString();
    }

    this.apiService.updateIssue(this.assigningIssue.issueId!, updateData).subscribe({
      next: (response) => {
        alert('Issue asignado al sprint exitosamente');
        this.loadIssues();
        this.closeAssignDialog();
      },
      error: (error) => {
        console.error('Error assigning issue to sprint:', error);
        alert('Error al asignar el issue: ' + (error.error?.message || error.message));
      }
    });
  }

  closeAssignDialog(): void {
    this.showAssignDialog = false;
    this.assigningIssue = null;
    this.selectedSprintForAssign = null;
    this.selectedProjectForAssign = null;
    this.selectedUserForAssign = null;
  }

  // Crear nuevo proyecto
  openCreateProjectDialog(): void {
    this.showCreateProjectDialog = true;
  }

  closeCreateProjectDialog(): void {
    this.showCreateProjectDialog = false;
    this.newProject = { description: '' };
  }

  confirmCreateProject(): void {
    if (!this.newProject.description) {
      alert('Por favor ingresa una descripción para el proyecto');
      return;
    }

    // Mapear el campo description a projectDescription para el backend
    const projectData = {
      projectDescription: this.newProject.description
    };

    this.apiService.createProject(projectData as any).subscribe({
      next: (response) => {
        alert('Proyecto creado exitosamente');
        this.loadProjects();
        this.closeCreateProjectDialog();
      },
      error: (error) => {
        console.error('Error creating project:', error);
        alert('Error al crear el proyecto: ' + (error.error?.message || error.message));
      }
    });
  }

  // Crear nuevo sprint
  openCreateSprintDialog(): void {
    if (this.availableProjects.length === 0) {
      alert('Primero debes crear un proyecto');
      return;
    }
    this.showCreateSprintDialog = true;
  }

  closeCreateSprintDialog(): void {
    this.showCreateSprintDialog = false;
    this.newSprint = {
      nroSprint: null,
      description: '',
      startDate: null,
      endDate: null,
      idProject: null
    };
  }

  confirmCreateSprint(): void {
    if (!this.newSprint.nroSprint || !this.newSprint.description || !this.newSprint.idProject) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (this.newSprint.startDate && this.newSprint.endDate && 
        this.newSprint.startDate > this.newSprint.endDate) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    // Mapear campos para el backend - usar 'project' en lugar de 'idProject'
    const sprintData = {
      nroSprint: this.newSprint.nroSprint,
      description: this.newSprint.description,
      startDate: this.newSprint.startDate || new Date(),
      endDate: this.newSprint.endDate || new Date(),
      project: this.newSprint.idProject  // Backend espera 'project' (relación)
    };

    this.apiService.createSprint(sprintData as any).subscribe({
      next: (response) => {
        alert('Sprint creado exitosamente');
        if (this.selectedProject?.idProject === this.newSprint.idProject) {
          this.loadSprintsByProject(this.newSprint.idProject!);
        }
        this.closeCreateSprintDialog();
      },
      error: (error) => {
        console.error('Error creating sprint:', error);
        alert('Error al crear el sprint: ' + (error.error?.message || error.message));
      }
    });
  }

  deleteIssue(issue: Issue): void {
    if (confirm(`¿Estás seguro de eliminar el issue "${issue.title}"?`)) {
      if (issue.issueId) {
        this.apiService.deleteIssue(issue.issueId).subscribe({
          next: () => {
            alert('Issue eliminado exitosamente');
            this.loadIssues();
          },
          error: (error) => {
            console.error('Error deleting issue:', error);
            alert('Error al eliminar el issue: ' + (error.error?.message || error.message));
          }
        });
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/todo']);
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': '🟢 Baja',
      'medium': '🟡 Media',
      'high': '🔴 Alta'
    };
    return priorityMap[priority] || '🟡 Media';
  }
}
