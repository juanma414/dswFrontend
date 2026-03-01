import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Project, Sprint } from '../model/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectSprintService {
  private selectedProjectSubject = new BehaviorSubject<Project | null>(null);
  private selectedSprintSubject = new BehaviorSubject<Sprint | null>(null);

  selectedProject$ = this.selectedProjectSubject.asObservable();
  selectedSprint$ = this.selectedSprintSubject.asObservable();

  constructor() {}

  setSelectedProject(project: Project | null): void {
    this.selectedProjectSubject.next(project);
    // Al cambiar de proyecto, resetear el sprint
    this.selectedSprintSubject.next(null);
  }

  setSelectedSprint(sprint: Sprint | null): void {
    this.selectedSprintSubject.next(sprint);
  }

  getSelectedProject(): Project | null {
    return this.selectedProjectSubject.value;
  }

  getSelectedSprint(): Sprint | null {
    return this.selectedSprintSubject.value;
  }

  clearSelection(): void {
    this.selectedProjectSubject.next(null);
    this.selectedSprintSubject.next(null);
  }
}
