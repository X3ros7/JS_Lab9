import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { Task } from "../../core/models/task.model";
import { TaskStatus } from "../../core/models/status.enum";
import {
  Observable,
  Subject,
  takeUntil,
  combineLatest,
  map,
  debounceTime,
  distinctUntilChanged,
  startWith,
} from "rxjs";
import { TaskStateService } from "../../share/state/task-state.service";
import { MatDialog } from "@angular/material/dialog";
import { TaskFormComponent } from "../task-form/task-form.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormControl } from "@angular/forms";
import { MatSelectChange } from "@angular/material/select";
import { Store } from "@ngrx/store";
import {
  selectAllTasks,
  selectFilteredTasks,
  selectTaskError,
  selectTaskLoading,
} from "../../store/task/task.selectors";
import { AppState } from "../../store/app.state";
import { loadTasks, setFilterStatus } from "../../store/task/task.actions";

@Component({
  selector: "app-task-list",
  standalone: false,
  templateUrl: "./task-list.component.html",
  styleUrl: "./task-list.component.scss",
})
export class TaskListComponent implements OnInit, OnDestroy {
  myTasks$!: Observable<Task[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  selectedStatus: TaskStatus | "" = "";
  editingTask: Task | null = null;
  private destroy$ = new Subject<void>();
  hasLoading = false;
  filterControl = new FormControl("");

  constructor(
    private store: Store<AppState>,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.store.dispatch(
      loadTasks({ status: this.selectedStatus as TaskStatus })
    );
    this.loading$ = this.store.select(selectTaskLoading);
    this.error$ = this.store.select(selectTaskError);
    this.myTasks$ = combineLatest([
      this.store.select(selectFilteredTasks),
      this.filterControl.valueChanges.pipe(
        startWith(""),
        debounceTime(300),
        distinctUntilChanged()
      ),
    ]).pipe(
      map(([tasks, filter]) =>
        tasks.filter(
          (task) =>
            task.title.toLowerCase().includes(filter ?? "".toLowerCase()) ||
            task.description
              ?.toLowerCase()
              .includes(filter ?? "".toLowerCase()) ||
            task.assignee.toLowerCase().includes(filter ?? "".toLowerCase())
        )
      )
    );
    this.error$.pipe(takeUntil(this.destroy$)).subscribe((error) => {
      if (error) {
        this.snackBar.open(error, "Закрити", {
          duration: 4000,
          panelClass: ["error-snackbar"],
        });
      }
    });
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      this.hasLoading = loading;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: "80vw",
      height: "70vh",
    });
  }

  editTask(): void {
    this.openDialog();
  }

  onSelected(event: MatSelectChange): void {
    this.store.dispatch(setFilterStatus({ status: event.value }));
  }

  protected readonly TaskStatus = TaskStatus;
}
