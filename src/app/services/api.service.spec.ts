import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { IComment } from '../model/comment';

// Mock de AuthService para simular usuario autenticado
class MockAuthService {
  private currentUser: any = {
    userId: 1,
    userRol: 'administrator',
    userName: 'Test',
    userLastName: 'User'
  };

  getCurrentUser(): any {
    return this.currentUser;
  }

  setCurrentUser(user: any): void {
    this.currentUser = user;
  }
}

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController; // Controla las peticiones HTTP falsas
  let authService: MockAuthService;

  // beforeEach: se ejecuta ANTES de cada test
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Importa el módulo de testing HTTP
      providers: [
        ApiService,
        { provide: AuthService, useClass: MockAuthService } // Usa nuestro Mock en lugar del servicio real
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  // afterEach: se ejecuta DESPUÉS de cada test
  // Verifica que todas las peticiones HTTP hayan sido consumidas
  afterEach(() => {
    httpMock.verify();
  });

  // ====== TEST 1: Verificar que el servicio se crea correctamente
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ====== TEST 2: Verificar que getIssues() envía parámetros del usuario actual
  describe('getIssues()', () => {
    it('should send user role and id as query parameters', () => {
      authService.setCurrentUser({ userId: 42, userRol: 'developer' });

      service.getIssues().subscribe();

      // Esperamos una petición GET a esta URL (con o sin parámetros)
      const req = httpMock.expectOne(req => req.url === `${environment.apiUrl}/issue`);
      
      // Verificamos que sea GET
      expect(req.request.method).toBe('GET');
      
      // Verificamos que incluya los parámetros del usuario
      expect(req.request.params.get('userId')).toBe('42');
      expect(req.request.params.get('userRole')).toBe('developer');
      
      // Respondemos la petición con datos vacíos
      req.flush([]);
    });
  });

  // ====== TEST 3: Verificar que getProjects() mapea la respuesta correctamente
  describe('getProjects()', () => {
    it('should map backend response to frontend format', () => {
      authService.setCurrentUser({ userId: 1, userRol: 'administrator' });
      let result: any;

      service.getProjects().subscribe(response => {
        result = response;
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/project`);
      
      // Simulamos la respuesta del backend
      req.flush({
        projectClass: [
          { projectId: 7, projectDescription: 'Proyecto Alpha' },
          { projectId: 9, projectDescription: 'Proyecto Beta' }
        ]
      });

      // Verificamos que los datos fueron mapeados correctamente
      expect(result.projectsClasses).toEqual([
        { idProject: 7, description: 'Proyecto Alpha' },
        { idProject: 9, description: 'Proyecto Beta' }
      ]);
    });
  });

  // ====== TEST 4: Verificar que createComment() envía el comentario correctamente
  describe('createComment()', () => {
    it('should POST a new comment with correct payload', () => {
      const comment: IComment = {
        description: 'Este es mi comentario',
        user: 5,
        issue: 11
      };

      service.createComment(comment).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/comment`);
      
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(comment);
      
      // Simulamos respuesta del backend
      req.flush({ ...comment, idComment: 1, createDate: new Date() });
    });
  });

  // ====== TEST 5: Verificar actualización de estado de issue
  describe('updateIssueStatus()', () => {
    it('should PATCH the issue status to the correct endpoint', () => {
      const issueId = 15;
      const newStatus = 'completed';

      service.updateIssueStatus(issueId, newStatus).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/issue/${issueId}/status`);
      
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: newStatus });
      
      req.flush({ success: true });
    });
  });
});
