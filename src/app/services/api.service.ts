import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Project, Sprint } from '../model/project';
import { IComment } from '../model/comment';
import { ITask } from '../model/task';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  ApiListResponse,
  IUser,
  ITypeIssue,
  ProjectsResponse,
  SprintsResponse
} from '../model/api-response';

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
  public getIssues(): Observable<ITask[]> { 
    const currentUser = this.authService.getCurrentUser();
    
    let params = new HttpParams();
    if (currentUser) {
      params = params.set('userRole', currentUser.userRol);
      params = params.set('userId', currentUser.userId.toString());
    }
    
    return this.http.get<any>(this.url, { params }).pipe(
      map((response: any) => {
        console.log('[API Service] Raw response from /issue:', response);
        
        // Extraer el array del objeto devuelto por el backend
        let issues = response.issueClass || response.data || response;
        
        // Asegurarse de que es un array
        if (!Array.isArray(issues)) {
          console.warn('[API Service] Response is not an array, wrapping as single item:', issues);
          issues = issues ? [issues] : [];
        }
        
        console.log('[API Service] Mapped issues:', issues);
        return issues;
      })
    );
  }

  // Crear nuevo issue (con información del usuario)
  public createIssue(issue: ITask): Observable<ITask> {
    const currentUser = this.authService.getCurrentUser();
    
    const issueData = {
      ...issue,
      userId: currentUser?.userId,
      issueSupervisor: currentUser?.userId // Se asigna automáticamente al usuario actual
    };
    
    return this.http.post<ITask>(this.url, issueData);
  }

  // Actualizar issue completo
  public updateIssue(id: number, issue: Partial<ITask>): Observable<ITask> {
    return this.http.put<ITask>(`${this.url}/${id}`, issue);
  }

  // Cambiar solo el status del issue
  public updateIssueStatus(id: number, status: string): Observable<ITask> {
    return this.http.patch<ITask>(`${this.url}/${id}/status`, { status });
  }

  // Eliminar issue (solo administradores)
  public deleteIssue(id: number): Observable<ApiResponse<void>> {
    const currentUser = this.authService.getCurrentUser();
    
    const deleteData = {
      userRole: currentUser?.userRol
    };
    
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`, { body: deleteData });
  }

  // Obtener issues eliminados
  public getDeletedIssues(): Observable<ITask[]> {
    return this.http.get<any>(`${this.url}/deleted`).pipe(
      map((response: any) => {
        const issues = response.issueClass || response.data || response;
        return Array.isArray(issues) ? issues : [];
      })
    );
  }

  // Obtener issues completados
  public getCompletedIssues(): Observable<ITask[]> {
    return this.http.get<any>(`${this.url}/completed`).pipe(
      map((response: any) => {
        const issues = response.issueClass || response.data || response;
        return Array.isArray(issues) ? issues : [];
      })
    );
  }

  // Marcar issue como completado (con fecha de finalización)
  public completeIssue(id: number): Observable<ITask> {
    return this.http.patch<ITask>(`${this.url}/${id}/complete`, {});
  }

  // Obtener todos los usuarios disponibles (para asignación)
  public getUsers(): Observable<IUser[]> {
    return this.http.get<any>(this.userUrl).pipe(
      map((response: any) => {
        console.log('[API] Respuesta raw de usuarios:', response);
        
        // Intentar múltiples campos donde podría estar el array de usuarios
        let users = response.userClass || 
                   response.users || 
                   response.data || 
                   response;
        
        console.log('[API] Usuarios después de mapeo:', users);
        
        // Si es un array, devolverlo directamente
        if (Array.isArray(users)) {
          console.log(`[API] Usuarios es un array con ${users.length} elementos`);
          return users;
        }
        
        // Si es un objeto con una propiedad que es array, intentar obtenerlo
        if (users && typeof users === 'object') {
          // Buscar la primera propiedad que sea un array
          for (const key in users) {
            if (Array.isArray(users[key])) {
              console.log(`[API] Encontramos array en propiedad '${key}':`, users[key].length);
              return users[key];
            }
          }
        }
        
        console.warn('[API] No se pudo extraer array de usuarios, devolviendo array vacío');
        return [];
      })
    );
  }

  // Actualizar asignación de issue (solo administradores)
  public updateIssueAssignment(id: number, supervisorId: number): Observable<ITask> {
    const currentUser = this.authService.getCurrentUser();
    
    const updateData = {
      issueSupervisor: supervisorId.toString(), // Convertir a string como espera el backend
      userRole: currentUser?.userRol
    };
    
    return this.http.put<ITask>(`${this.url}/${id}`, updateData);
  }

  // ============ PROYECTOS ============
  
  // Obtener todos los proyectos (admin) o proyectos del usuario
  public getProjects(): Observable<ProjectsResponse> {
    const currentUser = this.authService.getCurrentUser();
    
    let params = new HttpParams();
    if (currentUser && currentUser.userRol !== 'administrator') {
      params = params.set('userId', currentUser.userId.toString());
    }
    
    return this.http.get<any>(this.projectUrl, { params }).pipe(
      map((response: any) => {
        // Mapear projectClass del backend a formato del frontend
        const projects = response.projectClass || response.data || response;
        
        // Mapear projectDescription a description
        const mappedProjects = projects.map((project: any) => ({
          idProject: project.projectId,
          description: project.projectDescription
        }));
        
        return { projectsClasses: mappedProjects } as ProjectsResponse;
      })
    );
  }

  // Crear nuevo proyecto
  public createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<any>(this.projectUrl, project).pipe(
      map((response: any) => {
        // Mapear la respuesta del backend
        if (response && response.projectId) {
          return {
            idProject: response.projectId,
            description: response.projectDescription
          } as Project;
        }
        return response;
      })
    );
  }

  // Actualizar proyecto
  public updateProject(id: number, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.projectUrl}/${id}`, project);
  }

  // Eliminar proyecto
  public deleteProject(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.projectUrl}/${id}`);
  }

  // ============ SPRINTS ============
  
  // Obtener sprints de un proyecto
  public getSprintsByProject(projectId: number): Observable<SprintsResponse> {
    return this.http.get<any>(`${this.sprintUrl}/project/${projectId}`).pipe(
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
        
        return { sprintsClasses: mappedSprints } as SprintsResponse;
      })
    );
  }

  // Obtener todos los sprints (solo admin)
  public getAllSprints(): Observable<Sprint[]> {
    return this.http.get<any>(this.sprintUrl).pipe(
      map((response: any) => {
        const sprints = response.sprintClass || response.data || response;
        return Array.isArray(sprints) ? sprints : [];
      })
    );
  }

  // Crear nuevo sprint
  public createSprint(sprint: Partial<Sprint>): Observable<Sprint> {
    return this.http.post<any>(this.sprintUrl, sprint).pipe(
      map((response: any) => {
        // Mapear la respuesta del backend si es necesario
        if (response && response.idSprint) {
          return {
            idSprint: response.idSprint,
            nroSprint: response.nroSprint || response.idSprint,
            startDate: response.startDate,
            endDate: response.endDate,
            description: response.description,
            idProject: response.project?.projectId || sprint.idProject
          } as Sprint;
        }
        return response;
      })
    );
  }

  // Actualizar sprint
  public updateSprint(id: number, sprint: Sprint): Observable<Sprint> {
    return this.http.put<Sprint>(`${this.sprintUrl}/${id}`, sprint);
  }

  // Eliminar sprint
  public deleteSprint(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.sprintUrl}/${id}`);
  }

  // ============ ISSUES CON FILTROS ============
  
  // Obtener issues filtrados por proyecto y/o sprint
  public getIssuesByProjectAndSprint(projectId?: number, sprintId?: number): Observable<ITask[]> {
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
    
    return this.http.get<any>(this.url, { params }).pipe(
      map((response: any) => {
        const issues = response.issueClass || response.data || response;
        return Array.isArray(issues) ? issues : [];
      })
    );
  }

  // ============ COMENTARIOS ============
  
  // Obtener comentarios de un issue
  public getCommentsByIssue(issueId: number): Observable<IComment[]> {
    return this.http.get<any>(`${this.commentUrl}/issue/${issueId}`).pipe(
      map((response: any) => {
        console.log('[API] Respuesta raw de comentarios:', response);
        
        let comments = response.commentClass || 
                      response.comments || 
                      response.data || 
                      response;
        
        if (Array.isArray(comments)) {
          console.log(`[API] Comentarios es un array con ${comments.length} elementos`);
          return comments;
        }
        
        if (comments && typeof comments === 'object') {
          for (const key in comments) {
            if (Array.isArray(comments[key])) {
              console.log(`[API] Encontramos array en propiedad '${key}':`, comments[key].length);
              return comments[key];
            }
          }
        }
        
        console.warn('[API] No se pudo extraer array de comentarios');
        return [];
      })
    );
  }

  // Crear nuevo comentario
  public createComment(comment: IComment): Observable<IComment> {
    return this.http.post<IComment>(this.commentUrl, comment);
  }

  // Actualizar comentario
  public updateComment(commentId: number, comment: IComment): Observable<IComment> {
    return this.http.put<IComment>(`${this.commentUrl}/${commentId}`, comment);
  }

  // Eliminar comentario
  public deleteComment(commentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.commentUrl}/${commentId}`);
  }

  // ============ TIPOS DE ISSUE ============
  
  // Obtener todos los tipos de issue
  public getTypeIssues(): Observable<ITypeIssue[]> {
    return this.http.get<any>(this.typeIssueUrl).pipe(
      map((response: any) => {
        console.log('[API] Respuesta raw de tipos de issue:', response);
        
        let types = response.typeIssueClass || 
                   response.typeIssues || 
                   response.types ||
                   response.data || 
                   response;
        
        if (Array.isArray(types)) {
          console.log(`[API] Tipos de issue es un array con ${types.length} elementos`);
          return types;
        }
        
        if (types && typeof types === 'object') {
          for (const key in types) {
            if (Array.isArray(types[key])) {
              console.log(`[API] Encontramos array en propiedad '${key}':`, types[key].length);
              return types[key];
            }
          }
        }
        
        console.warn('[API] No se pudo extraer array de tipos de issue');
        return [];
      })
    );
  }
}
