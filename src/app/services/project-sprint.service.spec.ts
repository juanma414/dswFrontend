import { TestBed } from '@angular/core/testing';

import { ProjectSprintService } from './project-sprint.service';
import { Project, Sprint } from '../model/project';

describe('ProjectSprintService', () => {
  let service: ProjectSprintService;

  // Datos de prueba que usaremos en los tests
  const mockProject: Project = { 
    idProject: 1, 
    description: 'Proyecto Demo' 
  };

  const mockSprint: Sprint = {
    idSprint: 10,
    nroSprint: 1,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-15'),
    description: 'Sprint inicial'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectSprintService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ====== TEST 1: Al seleccionar proyecto, resetear sprint
  describe('setSelectedProject()', () => {
    it('should update selected project and clear sprint', () => {
      // Primero establecemos un sprint
      service.setSelectedSprint(mockSprint);
      expect(service.getSelectedSprint()).toEqual(mockSprint);

      // Luego establecemos un proyecto
      service.setSelectedProject(mockProject);

      // Verificamos que el proyecto se actualizó
      expect(service.getSelectedProject()).toEqual(mockProject);
      
      // Y que el sprint se limpió (es null ahora)
      expect(service.getSelectedSprint()).toBeNull();
    });
  });

  // ====== TEST 2: El Observable debe emitir cuando cambia el sprint
  describe('selectedSprint$ observable', () => {
    it('should emit new sprint when setSelectedSprint is called', (done) => {
      // done() DEBE llamarse para indicar que el test terminó
      // Esto es importante en tests asincronos

      service.selectedSprint$.subscribe((selectedSprint) => {
        // Este código se ejecuta cada vez que el Observable emite
        
        if (selectedSprint) {
          // Verificamos que el sprint emitido es el que esperábamos
          expect(selectedSprint).toEqual(mockSprint);
          
          // Indicamos que el test terminó exitosamente
          done();
        }
      });

      // Disparamos el cambio
      service.setSelectedSprint(mockSprint);
    });
  });

  // ====== TEST 3: El Observable debe emitir cuando cambia el proyecto
  describe('selectedProject$ observable', () => {
    it('should emit new project when setSelectedProject is called', (done) => {
      service.selectedProject$.subscribe((selectedProject) => {
        if (selectedProject) {
          expect(selectedProject).toEqual(mockProject);
          done();
        }
      });

      service.setSelectedProject(mockProject);
    });
  });

  // ====== TEST 4: clearSelection() debe poner todo en null
  describe('clearSelection()', () => {
    it('should clear both project and sprint selections', () => {
      // Establecemos ambos
      service.setSelectedProject(mockProject);
      service.setSelectedSprint(mockSprint);

      // Verificamos que se establecieron
      expect(service.getSelectedProject()).toEqual(mockProject);
      expect(service.getSelectedSprint()).toEqual(mockSprint);

      // Limpiamos
      service.clearSelection();

      // Verificamos que ambos son null
      expect(service.getSelectedProject()).toBeNull();
      expect(service.getSelectedSprint()).toBeNull();
    });
  });

  // ====== TEST 5: getSelectedProject() debe retornar el valor actual
  describe('getSelectedProject()', () => {
    it('should return the currently selected project', () => {
      service.setSelectedProject(mockProject);
      
      const selected = service.getSelectedProject();
      
      expect(selected).toEqual(mockProject);
      expect(selected?.idProject).toBe(1);
      expect(selected?.description).toBe('Proyecto Demo');
    });
  });
});
