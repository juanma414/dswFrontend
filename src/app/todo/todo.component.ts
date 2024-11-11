import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import { ITask } from '../model/task';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.scss']
})
export class TodoComponent {

  todoForm !: FormGroup;
  tasks : ITask [] = [];
  inprogress: ITask [] = [];
  done: ITask [] = [];
  updateIndex!:any;
  isEditEnabled:boolean = false;

  issues : any[] = [];

  constructor(private fb: FormBuilder, private apiService: ApiService) {}

  ngOnInit(): void{
    this.cargarIssues();
    this.todoForm = this.fb.group({
      item: ['', Validators.required]
    })
  }

  cargarIssues(){
    this.apiService.getIssues().subscribe(
      (issues) => {
        this.issues = issues;
        console.log(this.issues);
      },
      
    );
  }
  addTask(){
    this.tasks.push({
      description: this.todoForm.value.item,
      done: false
    });
    this.todoForm.reset();
  }
  onEdit(item: ITask, i:number){
    this.todoForm.controls['item'].setValue(item.description);
    this.updateIndex = i;
    this.isEditEnabled = true;
  }
  updateTask(){
    this.tasks[this.updateIndex].description = this.todoForm.value.item;
    this.tasks[this.updateIndex].done = false;
    this.todoForm.reset();
    this.updateIndex = undefined;
    this.isEditEnabled = false;
  }
  deleteTask(i:number){
    this.tasks.splice(i, 1);
  }
  deleteInProgressTask(i:number){
    this.inprogress.splice(i, 1);
  }
  deleteDoneTask(i:number){
    this.done.splice(i, 1);
  }
  drop(event: CdkDragDrop<ITask[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}