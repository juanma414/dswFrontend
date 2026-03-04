import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { IssueDetailDialogComponent } from './issue-detail-dialog.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ITask } from '../model/task';

// ===== ESPÍAS (MOCKS) DE LOS SERVICIOS =====
// Los spies son objetos falsos que simulan los servicios reales
// Nos permiten verificar que se llamaron correctamente y controlamos qué retornan

describe('IssueDetailDialogComponent', () => {
  let component: IssueDetailDialogComponent;
  let fixture: ComponentFixture<IssueDetailDialogComponent>;
  
  // Creamos espías de los servicios
  let apiService: jasmine.SpyObj<ApiService>;
  let authService: jasmine.SpyObj<AuthService>;
  let userService: jasmine.SpyObj<UserService>;

  // Datos de prueba: un issue de ejemplo
  const mockIssue: ITask = {
    issueId: 25,                           // ID único del issue
    title: 'Bug en login',                 // Título
    description: 'El login falla en Firefox',  // Descripción
    issueSupervisor: '3',                  // ID del supervisor (como string)
    issuePriority: 'medium',               // Prioridad: low, medium, high
    issueStataus: 'todo',                  // Typo en el backend: "issueStataus" 
    issueCreateDate: new Date('2024-03-01') // Fecha de creación
  };

  // beforeEach: configura el entorno de prueba ANTES de CADA test
  beforeEach(async () => {
    // Creamos espías (mocks) de los servicios
    apiService = jasmine.createSpyObj<ApiService>('ApiService', [
      'getCommentsByIssue',  // Método que queremos simular
      'createComment'        // Método que queremos simular
    ]);

    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser']);
    userService = jasmine.createSpyObj<UserService>('UserService', ['getUserById']);

    // Configuramos TestBed (el "laboratorio" de Angular para tests)
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule], // Importamos módulo de formularios reactivos
      declarations: [IssueDetailDialogComponent], // Declaramos el componente a testear
      providers: [
        // Reemplazamos los servicios reales con nuestros espías
        { provide: ApiService, useValue: apiService },
        { provide: AuthService, useValue: authService },
        { provide: UserService, useValue: userService },
        // Datos que recibe el diálogo del componente que lo abrió
        { provide: MAT_DIALOG_DATA, useValue: { issue: { ...mockIssue } } },
        // Referencia al diálogo para cerrarlo
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } }
      ],
      // NO_ERRORS_SCHEMA ignora errores de componentes que no declaramos (MatDialog, etc)
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  // Este beforeEach se ejecuta DESPUÉS del anterior (después del compilar)
  // Aquí creamos la instancia del componente
  beforeEach(() => {
    // Configuramos qué retornan los espías por defecto
    apiService.getCommentsByIssue.and.returnValue(of([])); // Retorna array vacío
    authService.getCurrentUser.and.returnValue({
      userId: 4,
      userName: 'Jane',
      userLastName: 'Doe'
    } as any);
    // Simulamos que el usuario #3 es Alan Turing
    userService.getUserById.and.returnValue(
      of({ data: { userName: 'Alan', userLastName: 'Turing' } })
    );

    // Creamos la instancia del componente
    fixture = TestBed.createComponent(IssueDetailDialogComponent);
    component = fixture.componentInstance;
  });

  // ====== TEST 1: El componente debe crearse
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ====== TEST 2: Al iniciar, debe cargar los comentarios
  describe('ngOnInit()', () => {
    it('should load and map comments with author names', () => {
      // Simulamos que el backend retorna comentarios
      apiService.getCommentsByIssue.and.returnValue(
        of([
          {
            idComment: 1,
            description: 'Primer comentario',
            user: { userName: 'Ana', userLastName: 'Gomez' },
            createDate: new Date()
          }
        ])
      );

      // Ejecutamos ngOnInit
      fixture.detectChanges();

      // Verificaciones:
      // 1. Se llamó al API correctamente
      expect(apiService.getCommentsByIssue).toHaveBeenCalledWith(25);
      
      // 2. Los comentarios se cargaron en el componente
      expect(component.comments.length).toBe(1);
      
      // 3. El nombre del usuario se mapeó correctamente
      expect(component.comments[0].userName).toBe('Ana Gomez');
      
      // 4. Ya no está en estado "cargando"
      expect(component.isLoadingComments).toBeFalse();
    });
  });

  // ====== TEST 3: Debe resolver el nombre del supervisor cuando es un ID
  describe('loadSupervisorName()', () => {
    it('should fetch supervisor name from UserService when supervisor is a user id', () => {
      fixture.detectChanges();

      // Verificas que se llamó al UserService con el ID del supervisor
      expect(userService.getUserById).toHaveBeenCalledWith(3);
      
      // El nombre debe resolverse a "Alan Turing"
      expect(component.supervisorName).toBe('Alan Turing');
    });

    it('should display "Sin asignar" when supervisor is empty', () => {
      // Modificamos el issue para que no tenga supervisor
      component.data.issue.issueSupervisor = '';

      // Llamamos al método
      component.loadSupervisorName();

      // Debe mostrar "Sin asignar"
      expect(component.supervisorName).toBe('Sin asignar');
      
      // No debe llamar al UserService
      expect(userService.getUserById).not.toHaveBeenCalled();
    });
  });

  // ====== TEST 4: Debe crear un comentario nuevo correctamente
  describe('addComment()', () => {
    it('should create a new comment and add it to the list', () => {
      // Simulamos la respuesta del backend al crear un comentario
      const newCommentResponse = {
        idComment: 99,
        description: 'Nuevo comentario test',
        user: { userId: 4, userName: 'Jane', userLastName: 'Doe' },
        createDate: new Date()
      };
      apiService.createComment.and.returnValue(of(newCommentResponse));

      // Inicializamos el componente
      fixture.detectChanges();

      // Verificamos que el array de comentarios está vacío al inicio
      expect(component.comments.length).toBe(0);

      // Rellenamos el formulario con un comentario
      component.commentForm.setValue({ commentText: 'Nuevo comentario test' });

      // Llamamos a addComment
      component.addComment();

      // Verificaciones:
      // 1. Se llamó al API con el comentario correcto
      expect(apiService.createComment).toHaveBeenCalledWith(
        jasmine.objectContaining({
          description: 'Nuevo comentario test',
          user: 4,               // ID del usuario actual
          issue: 25              // ID del issue
        })
      );

      // 2. El comentario se agregó al array
      expect(component.comments.length).toBe(1);
      expect(component.comments[0].description).toBe('Nuevo comentario test');

      // 3. El nombre del usuario se mapeó correctamente
      expect(component.comments[0].userName).toBe('Jane Doe');

      // 4. El formulario se limpió (se resetó)
      expect(component.commentForm.get('commentText')?.value).toBeNull();
    });

    it('should not create a comment if the form is invalid', () => {
      fixture.detectChanges();

      // Dejamos el formulario vacío (inválido)
      component.commentForm.setValue({ commentText: '' });

      // Intentamos crear comentario
      component.addComment();

      // El API no debe ser llamado
      expect(apiService.createComment).not.toHaveBeenCalled();
    });
  });

  // ====== TEST 5: Las funciones de formato deben retornar valores correctos
  describe('Helper methods', () => {
    it('getPriorityLabel() should return the correct label', () => {
      expect(component.getPriorityLabel('low')).toBe('🟢 Baja');
      expect(component.getPriorityLabel('medium')).toBe('🟡 Media');
      expect(component.getPriorityLabel('high')).toBe('🔴 Alta');
      expect(component.getPriorityLabel(undefined)).toBe('🟡 Media');
    });

    it('getPriorityClass() should return the correct CSS class', () => {
      expect(component.getPriorityClass('low')).toBe('priority-low');
      expect(component.getPriorityClass('high')).toBe('priority-high');
      expect(component.getPriorityClass(undefined)).toBe('priority-medium');
    });

    it('formatDate() should format dates correctly', () => {
      const testDate = new Date('2024-03-15T10:30:00');
      const formatted = component.formatDate(testDate);

      // Debe contener el día, mes, año
      expect(formatted).toContain('15');
      expect(formatted).toContain('03');
    });

    it('formatDate() should return "Sin fecha" for undefined', () => {
      expect(component.formatDate(undefined)).toBe('Sin fecha');
    });
  });

  // ====== TEST 6: El diálogo debe cerrarse correctamente
  describe('close()', () => {
    it('should close the dialog', () => {
      fixture.detectChanges();

      component.close();

      // Verifica que se llamó a close() en la referencia del diálogo
      expect(component.dialogRef.close).toHaveBeenCalled();
    });
  });
});
