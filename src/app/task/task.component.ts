import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';  // Importer le module

export interface Supplement {
  idSup?: number;
  usId: number;
  regPackageId?: number;
  comment?: string;
  timeNeededForTcCreation?: number;
  timeNeededToTest?: number;
  bugsRaised?: number;
  nbTc?: number;
  nbTcModified?: number;
}

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './task.component.html',
  styles: ``
})
export class TaskComponent {
  supplementForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<TaskComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Supplement,
    private fb: FormBuilder
  ) {
    this.supplementForm = this.fb.group({
      usId: [data.usId],
      regPackageId: [data.regPackageId],
      comment: [data.comment],
      timeNeededForTcCreation: [data.timeNeededForTcCreation],
      timeNeededToTest: [data.timeNeededToTest],
      bugsRaised: [data.bugsRaised],
      nbTc: [data.nbTc],
      nbTcModified: [data.nbTcModified]
    });
  }

  onSave(): void {
    this.dialogRef.close(this.supplementForm.value);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
