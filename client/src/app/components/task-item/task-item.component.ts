import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Task } from "../../core/models/task.model";
import { TaskStatus } from "../../core/models/status.enum";
import { TaskService } from "../../services/task.service";
import { MatSelectChange } from "@angular/material/select";
import { TaskStateService } from "../../share/state/task-state.service";
import { Store } from "@ngrx/store";
import { AppState } from "../../store/app.state";
import {
  deleteTask,
  patchTask,
  selectTask,
} from "../../store/task/task.actions";

@Component({
  selector: "app-task-item",
  standalone: false,
  templateUrl: "./task-item.component.html",
  styleUrl: "./task-item.component.scss",
})
export class TaskItemComponent {
  @Input() task!: Task; // отримуємо об'єкт завдання
  @Output() taskEdited: EventEmitter<void> = new EventEmitter<void>(); // подія для редагування завдання

  constructor(private store: Store<AppState>) {}

  deleteTask(id: string): void {
    this.store.dispatch(deleteTask({ id }));
  }

  editTask(): void {
    const id = this.task.id;
    this.store.dispatch(selectTask({ id }));
    this.taskEdited.emit();
  }

  getStatusClasses() {
    return {
      done: this.task.status === TaskStatus.DONE,
      todo: this.task.status === TaskStatus.TODO,
      "in-progress": this.task.status === TaskStatus.IN_PROGRESS,
    };
  }

  updateStatus(event: MatSelectChange) {
    const selectedValue = event.value;
    const id = this.task.id;
    this.store.dispatch(patchTask({ id, changes: { status: selectedValue } }));
  }
  protected readonly TaskStatus = TaskStatus;
}
