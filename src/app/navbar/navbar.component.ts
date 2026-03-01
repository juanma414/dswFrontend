import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ProjectSprintService } from '../services/project-sprint.service';
import { Project, Sprint } from '../model/project';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  projects: Project[] = [];
  sprints: Sprint[] = [];
  selectedProject: Project | null = null;
  selectedSprint: Sprint | null = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    private projectSprintService: ProjectSprintService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadProjects();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.userName} ${user.userLastName}` : '';
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user && user.userRol === 'administrator';
  }

  goToUserManagement(): void {
    this.router.navigate(['/admin/users']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToBacklog(): void {
    this.router.navigate(['/admin/backlog']);
  }

  // Cargar proyectos disponibles
  loadProjects(): void {
    this.apiService.getProjects().subscribe({
      next: (response) => {
        console.log('Proyectos cargados desde API:', response);
        this.projects = response.projectsClasses || response.projects || response.data || response;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        // Si hay error, usar datos de ejemplo
        this.projects = [
          { idProject: 1, description: 'Sistema de Gestión de Tareas' },
          { idProject: 2, description: 'Portal de Clientes' },
          { idProject: 3, description: 'API Backend' }
        ];
      }
    });
  }

  // Cargar sprints del proyecto seleccionado
  loadSprints(projectId: number): void {
    this.apiService.getSprintsByProject(projectId).subscribe({
      next: (response) => {
        console.log('Sprints cargados desde API:', response);
        this.sprints = response.sprintsClasses || response.sprints || response.data || response;
      },
      error: (error) => {
        console.error('Error loading sprints:', error);
        // Si hay error, usar datos de ejemplo
        this.sprints = [
          { 
            idSprint: 1, 
            nroSprint: 1, 
            startDate: new Date('2026-02-01'), 
            endDate: new Date('2026-02-14'), 
            description: 'Sprint inicial',
            idProject: projectId
          },
          { 
            idSprint: 2, 
            nroSprint: 2, 
            startDate: new Date('2026-02-15'), 
            endDate: new Date('2026-02-28'), 
            description: 'Mejoras UI',
            idProject: projectId
          },
          { 
            idSprint: 3, 
            nroSprint: 3, 
            startDate: new Date('2026-03-01'), 
            endDate: new Date('2026-03-14'), 
            description: 'Optimización',
            idProject: projectId
          }
        ];
      }
    });
  }

  // Cuando cambia el proyecto seleccionado
  onProjectChange(): void {
    this.selectedSprint = null;
    this.sprints = [];
    
    if (this.selectedProject) {
      this.loadSprints(this.selectedProject.idProject);
      this.projectSprintService.setSelectedProject(this.selectedProject);
    } else {
      this.projectSprintService.setSelectedProject(null);
    }
  }

  // Cuando cambia el sprint seleccionado
  onSprintChange(): void {
    this.projectSprintService.setSelectedSprint(this.selectedSprint);
  }

}
