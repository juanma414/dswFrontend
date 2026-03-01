import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavbarComponent } from './navbar/navbar.component';
import { TodoComponent } from './todo/todo.component';

import {MatToolbarModule} from '@angular/material/toolbar'; 
import {MatCardModule} from '@angular/material/card'; 
import {MatFormFieldModule} from '@angular/material/form-field'; 
import {MatInputModule} from '@angular/material/input'; 
import {MatIconModule} from '@angular/material/icon'; 
import {MatSelectModule} from '@angular/material/select';
import {MatOptionModule} from '@angular/material/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {DragDropModule} from '@angular/cdk/drag-drop'; 
import {MatButtonModule} from '@angular/material/button';
import { LoginComponent } from './login/login.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BacklogComponent } from './backlog/backlog.component';
import {MatDatepickerModule} from '@angular/material/datepicker'; 
import {MatNativeDateModule} from '@angular/material/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner'; 
import {MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import { IssueDetailDialogComponent } from './todo/issue-detail-dialog.component'; 

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    TodoComponent,
    LoginComponent,
    UserManagementComponent,
    DashboardComponent,
    BacklogComponent,
    IssueDetailDialogComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    DragDropModule,
    MatButtonModule,
    HttpClientModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDividerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
