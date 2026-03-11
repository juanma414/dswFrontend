import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { UserManagementComponent } from './user-management.component';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, MatDialogModule],
      declarations: [UserManagementComponent],
      schemas: [NO_ERRORS_SCHEMA]
    });
    component = TestBed.createComponent(UserManagementComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});