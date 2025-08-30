import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  
  searchForm!: FormGroup;
  allIssues: any[] = [];
  filteredIssues: any[] = [];
  userStats: any[] = [];
  dateStats: any = {};
  
  // Filtros
  searchText: string = '';
  selectedDateRange: { start: Date | null, end: Date | null } = { start: null, end: null };
  selectedUser: string = '';
  
  // Estados para gráficos
  issuesByStatus: any = {};
  issuesByPriority: any = {};
  
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar que sea administrador
    if (!this.isAdmin()) {
      alert('Acceso denegado. Solo administradores pueden ver el dashboard.');
      return;
    }

    this.initializeForm();
    this.loadAllData();
  }

  initializeForm(): void {
    this.searchForm = this.fb.group({
      searchText: [''],
      startDate: [''],
      endDate: [''],
      userFilter: ['']
    });

    // Suscribirse a cambios en el formulario para filtrado en tiempo real
    this.searchForm.valueChanges.subscribe(values => {
      this.applyFilters(values);
    });
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user && user.userRol === 'administrator';
  }

  loadAllData(): void {
    // Cargar todos los issues sin filtros para el dashboard
    this.apiService.getIssues().subscribe({
      next: (response) => {
        console.log('Dashboard - Issues cargados:', response);
        this.allIssues = response.issueClass || response.data || response;
        this.filteredIssues = [...this.allIssues];
        
        this.calculateStatistics();
        this.calculateUserStats();
        this.calculateDateStats();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  calculateStatistics(): void {
    // Estadísticas por estado (incluyendo closed)
    this.issuesByStatus = this.allIssues.reduce((acc, issue) => {
      const status = issue.issueStataus || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Estadísticas por prioridad
    this.issuesByPriority = this.allIssues.reduce((acc, issue) => {
      const priority = issue.issuePriority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    console.log('Stats by status:', this.issuesByStatus);
    console.log('Stats by priority:', this.issuesByPriority);
  }

  calculateUserStats(): void {
    const userMap = this.allIssues.reduce((acc, issue) => {
      const supervisor = issue.issueSupervisor || 'Sin Asignar';
      if (!acc[supervisor]) {
        acc[supervisor] = {
          userName: supervisor,
          totalIssues: 0,
          todoIssues: 0,
          inProgressIssues: 0,
          closedIssues: 0 // ahora contará closed
        };
      }

      acc[supervisor].totalIssues++;

      switch (issue.issueStataus) {
        case 'todo':
          acc[supervisor].todoIssues++;
          break;
        case 'inprogress':
          acc[supervisor].inProgressIssues++;
          break;
        case 'closed':
          acc[supervisor].closedIssues++;
          break;
      }

      return acc;
    }, {});

    this.userStats = Object.values(userMap).sort((a: any, b: any) => b.totalIssues - a.totalIssues);
    console.log('User stats:', this.userStats);
  }

  calculateDateStats(): void {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    this.dateStats = {
      today: this.allIssues.filter(issue => {
        const createDate = new Date(issue.issueCreateDate);
        return createDate.toDateString() === today.toDateString();
      }).length,
      lastWeek: this.allIssues.filter(issue => {
        const createDate = new Date(issue.issueCreateDate);
        return createDate >= lastWeek;
      }).length,
      lastMonth: this.allIssues.filter(issue => {
        const createDate = new Date(issue.issueCreateDate);
        return createDate >= lastMonth;
      }).length,
      total: this.allIssues.length
    };

    console.log('Date stats:', this.dateStats);
  }

  applyFilters(filterValues: any): void {
    this.filteredIssues = this.allIssues.filter(issue => {
      let passesFilter = true;

      // Filtro por texto (título o descripción)
      if (filterValues.searchText) {
        const searchLower = filterValues.searchText.toLowerCase();
        const titleMatch = (issue.title || issue.issueDescription || '').toLowerCase().includes(searchLower);
        const descMatch = (issue.description || issue.issueDescription || '').toLowerCase().includes(searchLower);
        passesFilter = passesFilter && (titleMatch || descMatch);
      }

      // Filtro por fecha de inicio
      if (filterValues.startDate) {
        const startDate = new Date(filterValues.startDate);
        const issueDate = new Date(issue.issueCreateDate);
        passesFilter = passesFilter && issueDate >= startDate;
      }

      // Filtro por fecha de fin
      if (filterValues.endDate) {
        const endDate = new Date(filterValues.endDate);
        const issueDate = new Date(issue.issueCreateDate);
        passesFilter = passesFilter && issueDate <= endDate;
      }

      // Filtro por usuario
      if (filterValues.userFilter) {
        passesFilter = passesFilter && (issue.issueSupervisor || '').includes(filterValues.userFilter);
      }

      return passesFilter;
    });

    console.log('Filtered issues:', this.filteredIssues.length, 'of', this.allIssues.length);
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.filteredIssues = [...this.allIssues];
  }

  goBack(): void {
    this.router.navigate(['/todo']);
  }

  exportToCsv(): void {
    const csvData = this.filteredIssues.map(issue => ({
      'ID': issue.issueId,
      'Título': issue.title || issue.issueDescription,
      'Descripción': issue.description || issue.issueDescription,
      'Estado': issue.issueStataus,
      'Prioridad': issue.issuePriority,
      'Asignado a': issue.issueSupervisor,
      'Fecha Creación': new Date(issue.issueCreateDate).toLocaleDateString(),
      'Fecha Finalización': issue.issueEndDate ? new Date(issue.issueEndDate).toLocaleDateString() : 'N/A'
    }));

    const csvContent = this.convertToCSV(csvData);
    this.downloadCSV(csvContent, 'issues-report.csv');
  }

  private convertToCSV(objArray: any[]): string {
    const array = [Object.keys(objArray[0])].concat(objArray);
    return array.map(row => {
      return Object.values(row).map(value => `"${value}"`).join(',');
    }).join('\n');
  }

  private downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'todo': 'Pendiente',
      'inprogress': 'En Progreso',
      'done': 'Completado',
      'deleted': 'Eliminado'
    };
    return statusMap[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta'
    };
    return priorityMap[priority] || priority;
  }

  getStatusArray(): any[] {
    return Object.keys(this.issuesByStatus).map(key => ({
      key: key,
      value: this.issuesByStatus[key],
      label: this.getStatusLabel(key)
    }));
  }

  getPriorityArray(): any[] {
    return Object.keys(this.issuesByPriority).map(key => ({
      key: key,
      value: this.issuesByPriority[key],
      label: this.getPriorityLabel(key)
    }));
  }
}
