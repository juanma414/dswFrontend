import { TestBed } from '@angular/core/testing';

import { ProjectSprintService } from './project-sprint.service';

describe('ProjectSprintService', () => {
  let service: ProjectSprintService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectSprintService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
