import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  searchForm!: FormGroup;
  allIssues: any[] = [];
  filteredIssues: any[] = [];
  userStats: any[] = [];
  dateStats: any = {};

  // Filtros
  searchText: string = '';
  selectedDateRange: { start: Date | null; end: Date | null } = {
    start: null,
    end: null,
  };
  selectedUser: string = '';

  // Nuevos: Proyectos y Sprints
  availableProjects: any[] = [];
  availableSprints: any[] = [];
  selectedProject: number | null = null;
  selectedSprint: number | null = null;

  // Usuarios para mapear IDs a nombres
  availableUsers: any[] = [];

  // Estados para gráficos
  issuesByStatus: any = {};
  issuesByPriority: any = {};

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Verificar que sea administrador
    if (!this.isAdmin()) {
      alert('Acceso denegado. Solo administradores pueden ver el dashboard.');
      return;
    }

    this.initializeForm();

    // Cargar datos - usuarios primero, luego el resto
    this.loadUsersAndThenData();
  }

  initializeForm(): void {
    this.searchForm = this.fb.group({
      searchText: [''],
      startDate: [''],
      endDate: [''],
      userFilter: [''],
      projectFilter: [''],
      sprintFilter: [''],
    });

    // Suscribirse a cambios en el formulario para filtrado en tiempo real
    this.searchForm.valueChanges.subscribe((values) => {
      this.applyFilters(values);
    });
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user ? user.userRol === 'administrator' : false;
  }

  loadAllData(): void {
    // Cargar proyectos
    this.loadProjects();

    // Cargar todos los issues sin filtros para el dashboard
    this.apiService.getIssues().subscribe({
      next: (issues) => {
        console.log('Dashboard - Issues cargados:', issues);
        // MikroORM devuelve las relaciones como objetos, necesitamos extraer los IDs y normalizar los datos
        this.allIssues = issues.map((issue: any) => {
          // Extraer datos del usuario relacionado - probar supervisorData primero (es lo que devuelve el backend)
          const user =
            issue.supervisorData || issue.supervisor || issue.user || {};
          let userName = user.userName || '';
          let userLastName = user.userLastName || '';

          // Si solo tenemos el nombre (sin apellido), buscar en availableUsers para obtener datos completos
          if (!userLastName && user.userId && this.availableUsers.length > 0) {
            const fullUser = this.availableUsers.find(
              (u) => u.userId === user.userId,
            );
            if (fullUser) {
              userName = fullUser.userName || '';
              userLastName = fullUser.userLastName || '';
              console.log('✓ Datos completos encontrados en availableUsers:', {
                userName,
                userLastName,
              });
            }
          }

          const fullName = (userName + ' ' + userLastName).trim();

          return {
            ...issue,
            idProject: issue.project?.projectId || issue.idProject,
            idSprint: issue.sprint?.idSprint || issue.idSprint,
            // Normalizar título y descripción
            title:
              issue.title || issue.issueTitle || issue.issueDescription || '',
            description: issue.description || issue.issueDescription || '',
            // Normalizar supervisor - extraer el ID si es un objeto User
            issueSupervisor: user.userId || issue.issueSupervisor,
            // Guardar el nombre completo del usuario (userName + userLastName) para búsqueda
            supervisorName: fullName || 'Sin Asignar',
          };
        });
        this.filteredIssues = [...this.allIssues];

        this.calculateStatistics();
        this.calculateUserStats();
        this.calculateDateStats();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      },
    });
  }

  // Cargar usuarios primero, luego los demás datos
  loadUsersAndThenData(): void {
    this.apiService.getUsers().subscribe({
      next: (users) => {
        console.log('Dashboard - Usuarios cargados:', users);

        if (Array.isArray(users) && users.length > 0) {
          this.availableUsers = users;
        } else {
          this.availableUsers = [];
        }

        console.log(
          'Dashboard - availableUsers poblado con',
          this.availableUsers.length,
          'usuarios',
        );

        // Ahora cargar el resto de datos
        this.loadAllData();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.availableUsers = [];
        // Seguir cargando datos de todas formas
        this.loadAllData();
      },
    });
  }

  calculateStatistics(): void {
    // Estadísticas por estado (incluyendo closed) - usar filteredIssues
    this.issuesByStatus = this.filteredIssues.reduce((acc, issue) => {
      const status = issue.issueStataus || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Estadísticas por prioridad - usar filteredIssues
    this.issuesByPriority = this.filteredIssues.reduce((acc, issue) => {
      const priority = issue.issuePriority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    console.log('Stats by status:', this.issuesByStatus);
    console.log('Stats by priority:', this.issuesByPriority);
  }

  calculateUserStats(): void {
    const userMap = this.filteredIssues.reduce((acc, issue) => {
      // Usar el supervisorName que ya viene mapeado (userName + userLastName)
      // o 'Sin Asignar' si no hay supervisor
      const displayName = issue.supervisorName || 'Sin Asignar';

      if (!acc[displayName]) {
        acc[displayName] = {
          userName: displayName,
          totalIssues: 0,
          todoIssues: 0,
          inProgressIssues: 0,
          closedIssues: 0,
        };
      }

      acc[displayName].totalIssues++;

      switch (issue.issueStataus) {
        case 'todo':
          acc[displayName].todoIssues++;
          break;
        case 'inprogress':
          acc[displayName].inProgressIssues++;
          break;
        case 'closed':
          acc[displayName].closedIssues++;
          break;
      }

      return acc;
    }, {});

    this.userStats = Object.values(userMap).sort(
      (a: any, b: any) => b.totalIssues - a.totalIssues,
    );
    console.log('User stats:', this.userStats);
  }

  calculateDateStats(): void {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    this.dateStats = {
      today: this.allIssues.filter((issue) => {
        const createDate = new Date(issue.issueCreateDate);
        return createDate.toDateString() === today.toDateString();
      }).length,
      lastWeek: this.allIssues.filter((issue) => {
        const createDate = new Date(issue.issueCreateDate);
        return createDate >= lastWeek;
      }).length,
      lastMonth: this.allIssues.filter((issue) => {
        const createDate = new Date(issue.issueCreateDate);
        return createDate >= lastMonth;
      }).length,
      total: this.allIssues.length,
    };

    console.log('Date stats:', this.dateStats);
  }

  applyFilters(filterValues: any): void {
    console.log('🔍 Aplicando filtros:', filterValues);

    this.filteredIssues = this.allIssues.filter((issue) => {
      let passesFilter = true;

      // Filtro por texto (título, descripción o nombre del usuario asignado)
      if (filterValues.searchText) {
        const searchLower = filterValues.searchText.toLowerCase();
        const titleMatch = (issue.title || '')
          .toLowerCase()
          .includes(searchLower);
        const descMatch = (issue.description || '')
          .toLowerCase()
          .includes(searchLower);
        // Buscar en el nombre completo del supervisor (userName + userLastName)
        const supervisorNameMatch = (issue.supervisorName || '')
          .toLowerCase()
          .includes(searchLower);

        console.log(
          `Issue: ${issue.title} | Supervisor: ${issue.supervisorName} | Match: ${supervisorNameMatch}`,
        );

        passesFilter =
          passesFilter && (titleMatch || descMatch || supervisorNameMatch);
      }

      //Filtros con las fechas
      const issueDate = new Date(issue.issueCreateDate);
      const taskEndDate = issue.issueEndDate
        ? new Date(issue.issueEndDate)
        : null;

      if (filterValues.startDate) {
        const start = new Date(filterValues.startDate);
        start.setHours(0, 0, 0, 0);
        passesFilter = passesFilter && issueDate >= start;
      }

      if (filterValues.endDate) {
        const filterEnd = new Date(filterValues.endDate);

        if (!taskEndDate) {
          // Si la tarea no está terminada, no pasa ningún filtro de "Fin"
          passesFilter = false;
        } else {
          if (filterValues.startDate) {
            // MODO RANGO: Si hay fecha de inicio, comparamos que esté antes del fin del día elegido
            filterEnd.setHours(23, 59, 59, 999);
            passesFilter = passesFilter && taskEndDate <= filterEnd;
          } else {
            // MODO DÍA EXACTO: Si NO hay fecha de inicio, buscamos coincidencia exacta de calendario
            const isSameDay =
              taskEndDate.getDate() === filterEnd.getDate() &&
              taskEndDate.getMonth() === filterEnd.getMonth() &&
              taskEndDate.getFullYear() === filterEnd.getFullYear();

            passesFilter = passesFilter && isSameDay;
          }
        }
      }

      // Filtro por usuario
      if (filterValues.userFilter) {
        const userFilterLower = filterValues.userFilter.toLowerCase();
        const supervisorNameMatch = (issue.supervisorName || '')
          .toLowerCase()
          .includes(userFilterLower);
        passesFilter = passesFilter && supervisorNameMatch;

        if (filterValues.userFilter && supervisorNameMatch) {
          console.log(`✓ Usuario encontrado: ${issue.supervisorName}`);
        }
      }

      // Filtro por proyecto
      if (filterValues.projectFilter) {
        const projectId = parseInt(filterValues.projectFilter);
        passesFilter = passesFilter && issue.idProject === projectId;
      }

      // Filtro por sprint
      if (filterValues.sprintFilter) {
        const sprintId = parseInt(filterValues.sprintFilter);
        passesFilter = passesFilter && issue.idSprint === sprintId;
      }

      return passesFilter;
    });

    console.log(
      `✓ Filtro aplicado: ${this.filteredIssues.length} de ${this.allIssues.length} issues`,
    );

    // Recalcular estadísticas con los issues filtrados
    this.calculateStatistics();
    this.calculateUserStats();
  }

  loadProjects(): void {
    this.apiService.getProjects().subscribe({
      next: (response) => {
        this.availableProjects = response.projectsClasses || [];
        console.log(
          'Dashboard - Proyectos cargados:',
          this.availableProjects.length,
        );
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      },
    });
  }

  loadUsers(): void {
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.availableUsers = users;
        console.log(
          'Dashboard - Usuarios cargados:',
          this.availableUsers.length,
        );
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.availableUsers = [];
      },
    });
  }

  getUserDisplayName(supervisorId: string | undefined): string {
    if (!supervisorId) {
      return 'Sin Asignar';
    }

    // Verificar si es un número (userId)
    const userId = parseInt(supervisorId);
    if (!isNaN(userId) && userId.toString() === supervisorId) {
      // Buscar en la lista de usuarios
      const user = this.availableUsers.find((u) => u.userId === userId);
      if (user) {
        return `${user.userName} ${user.userLastName}`;
      }
      return `Usuario #${userId}`;
    }

    // Si no es un número, devolver el valor tal cual
    return supervisorId;
  }

  loadSprintsByProject(projectId: number): void {
    if (!projectId) {
      this.availableSprints = [];
      this.searchForm.patchValue({ sprintFilter: '' });
      return;
    }

    this.apiService.getSprintsByProject(projectId).subscribe({
      next: (response) => {
        this.availableSprints = response.sprintsClasses || [];
        console.log(
          'Dashboard - Sprints cargados:',
          this.availableSprints.length,
        );
      },
      error: (error) => {
        console.error('Error loading sprints:', error);
        this.availableSprints = [];
      },
    });
  }

  onProjectChange(event: any): void {
    const projectId = event.value;
    if (projectId) {
      this.loadSprintsByProject(projectId);
    } else {
      this.availableSprints = [];
      this.searchForm.patchValue({ sprintFilter: '' });
    }
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.availableSprints = [];
    this.filteredIssues = [...this.allIssues];
    this.calculateStatistics();
    this.calculateUserStats();
  }

  goBack(): void {
    this.router.navigate(['/todo']);
  }

  exportToExcel(): void {
    if (this.filteredIssues.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Definir las columnas que queremos en el Excel
    const headers = [
      'ID',
      'Titulo',
      'Descripcion',
      'Estado',
      'Prioridad',
      'Asignado a',
      'Fecha Creacion',
    ];

    // Mapear los datos de filteredIssues a filas
    const data = this.filteredIssues.map((issue) => [
      issue.issueId,
      `"${issue.title || issue.issueDescription || ''}"`, // Comillas para evitar errores con comas internas
      `"${issue.description || issue.issueDescription || ''}"`,
      this.getStatusLabel(issue.issueStataus),
      this.getPriorityLabel(issue.issuePriority),
      issue.supervisorName || 'Sin asignar',
      new Date(issue.issueCreateDate).toLocaleDateString(),
    ]);

    // Unir encabezados y datos con punto y coma (mejor para Excel en español)
    const csvContent = [
      headers.join(';'),
      ...data.map((row) => row.join(';')),
    ].join('\n');

    //Obtenemos la fecha actual en formato DD-MM-YYYY
    const fecha = new Date()
      .toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '-'); // Cambiamos / por - para que sea un nombre de archivo válido

    //Armamos el nombre lindo
    const nombreArchivo = `Informe Issue ${fecha}.csv`;

    //Llamamos a la descarga
    this.downloadCSV('\ufeff' + csvContent, nombreArchivo);
  }

  private downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      todo: 'Pendiente',
      inprogress: 'En Progreso',
      done: 'Completado',
      deleted: 'Eliminado',
    };
    return statusMap[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
    };
    return priorityMap[priority] || priority;
  }

  getStatusArray(): any[] {
    return Object.keys(this.issuesByStatus).map((key) => ({
      key: key,
      value: this.issuesByStatus[key],
      label: this.getStatusLabel(key),
    }));
  }

  getPriorityArray(): any[] {
    return Object.keys(this.issuesByPriority).map((key) => ({
      key: key,
      value: this.issuesByPriority[key],
      label: this.getPriorityLabel(key),
    }));
  }
}
