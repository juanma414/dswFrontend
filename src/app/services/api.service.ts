import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Project, Sprint } from '../model/project';
import { IComment } from '../model/comment';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = `${environment.apiUrl}/issue`;
  private projectUrl = `${environment.apiUrl}/project`;
  private sprintUrl = `${environment.apiUrl}/sprint`;
  private commentUrl = `${environment.apiUrl}/comment`;
  private userUrl = `${environment.apiUrl}/user`;
  private typeIssueUrl = `${environment.apiUrl}/typeIssue`;
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtener todos los issues (filtrados por usuario si no es admin)
  public getIssues(): Observable<any> { 
    const currentUser = this.authService.getCurrentUser();
    
    let params = new HttpParams();
    if (currentUser) {
      params = params.set('userRole', currentUser.userRol);
      params = params.set('userId', currentUser.userId.toString());
    }
    
    return this.http.get(this.url, { params });
  }

  // Crear nuevo issue (con información del usuario)
  public createIssue(issue: any): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    const issueData = {
      ...issue,
      userId: currentUser?.userId,
      issueSupervisor: currentUser?.userId // Se asigna automáticamente al usuario actual
    };
    
    return this.http.post(this.url, issueData);
  }

  // Actualizar issue completo
  public updateIssue(id: number, issue: any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, issue);
  }

  // Cambiar solo el status del issue
  public updateIssueStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`${this.url}/${id}/status`, { status });
  }

  // Eliminar issue (solo administradores)
  public deleteIssue(id: number): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    const deleteData = {
      userRole: currentUser?.userRol
    };
    
    return this.http.delete(`${this.url}/${id}`, { body: deleteData });
  }

  // Obtener issues eliminados
  public getDeletedIssues(): Observable<any> {
    return this.http.get(`${this.url}/deleted`);
  }

  // Obtener issues completados
  public getCompletedIssues(): Observable<any> {
    return this.http.get(`${this.url}/completed`);
  }

  // Marcar issue como completado (con fecha de finalización)
  public completeIssue(id: number): Observable<any> {
    return this.http.patch(`${this.url}/${id}/complete`, {});
  }

  // Obtener todos los usuarios disponibles (para asignación)
  public getUsers(): Observable<any> {
    return this.http.get(this.userUrl);
  }

  // Actualizar asignación de issue (solo administradores)
  public updateIssueAssignment(id: number, supervisorName: string): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    const updateData = {
      issueSupervisor: supervisorName,
      userRole: currentUser?.userRol
    };
    
    return this.http.put(`${this.url}/${id}`, updateData);
  }

  // ============ PROYECTOS ============
  
  // Obtener todos los proyectos (admin) o proyectos del usuario
  public getProjects(): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    let params = new HttpParams();
    if (currentUser && currentUser.userRol !== 'administrator') {
      params = params.set('userId', currentUser.userId.toString());
    }
    
    return this.http.get(this.projectUrl, { params }).pipe(
      map((response: any) => {
        // Mapear projectClass del backend a formato del frontend
        const projects = response.projectClass || response.data || response;
        
        // Mapear projectDescription a description
        const mappedProjects = projects.map((project: any) => ({
          idProject: project.projectId,
          description: project.projectDescription
        }));
        
        return { projectsClasses: mappedProjects };
      })
    );
  }

  // Crear nuevo proyecto
  public createProject(project: any): Observable<any> {
    return this.http.post(this.projectUrl, project).pipe(
      map((response: any) => {
        // Mapear la respuesta del backend
        if (response && response.projectId) {
          return {
            idProject: response.projectId,
            description: response.projectDescription
          };
        }
        return response;
      })
    );
  }

  // Actualizar proyecto
  public updateProject(id: number, project: Project): Observable<any> {
    return this.http.put(`${this.projectUrl}/${id}`, project);
  }

  // Eliminar proyecto
  public deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.projectUrl}/${id}`);
  }

  // ============ SPRINTS ============
  
  // Obtener sprints de un proyecto
  public getSprintsByProject(projectId: number): Observable<any> {
    return this.http.get(`${this.sprintUrl}/project/${projectId}`).pipe(
      map((response: any) => {
        const sprints = response.data || response;
        
        // Mapear campos del backend al frontend si es necesario
        const mappedSprints = Array.isArray(sprints) ? sprints.map((sprint: any) => ({
          idSprint: sprint.idSprint,
          nroSprint: sprint.nroSprint || sprint.idSprint, // Si no tiene nroSprint, usar el id
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          description: sprint.description,
          idProject: projectId
        })) : [];
        
        return { sprintsClasses: mappedSprints };
      })
    );
  }

  // Obtener todos los sprints (solo admin)
  public getAllSprints(): Observable<any> {
    return this.http.get(this.sprintUrl);
  }

  // Crear nuevo sprint
  public createSprint(sprint: any): Observable<any> {
    return this.http.post(this.sprintUrl, sprint).pipe(
      map((response: any) => {
        // Mapear la respuesta del backend si es necesario
        if (response && response.idSprint) {
          return {
            idSprint: response.idSprint,
            nroSprint: response.nroSprint || response.idSprint,
            startDate: response.startDate,
            endDate: response.endDate,
            description: response.description,
            idProject: response.project?.projectId || sprint.project
          };
        }
        return response;
      })
    );
  }

  // Actualizar sprint
  public updateSprint(id: number, sprint: Sprint): Observable<any> {
    return this.http.put(`${this.sprintUrl}/${id}`, sprint);
  }

  // Eliminar sprint
  public deleteSprint(id: number): Observable<any> {
    return this.http.delete(`${this.sprintUrl}/${id}`);
  }

  // ============ ISSUES CON FILTROS ============
  
  // Obtener issues filtrados por proyecto y/o sprint
  public getIssuesByProjectAndSprint(projectId?: number, sprintId?: number): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    let params = new HttpParams();
    if (currentUser) {
      params = params.set('userRole', currentUser.userRol);
      params = params.set('userId', currentUser.userId.toString());
    }
    
    if (projectId) {
      params = params.set('projectId', projectId.toString());
    }
    
    if (sprintId) {
      params = params.set('sprintId', sprintId.toString());
    }
    
    return this.http.get(this.url, { params });
  }

  // ============ COMENTARIOS ============
  
  // Obtener comentarios de un issue
  public getCommentsByIssue(issueId: number): Observable<any> {
    return this.http.get(`${this.commentUrl}/issue/${issueId}`);
  }

  // Crear nuevo comentario
  public createComment(comment: IComment): Observable<any> {
    return this.http.post(this.commentUrl, comment);
  }

  // Actualizar comentario
  public updateComment(commentId: number, comment: IComment): Observable<any> {
    return this.http.put(`${this.commentUrl}/${commentId}`, comment);
  }

  // Eliminar comentario
  public deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.commentUrl}/${commentId}`);
  }

  // ============ TIPOS DE ISSUE ============
  
  // Obtener todos los tipos de issue
  public getTypeIssues(): Observable<any> {
    return this.http.get(this.typeIssueUrl);
  }
}
