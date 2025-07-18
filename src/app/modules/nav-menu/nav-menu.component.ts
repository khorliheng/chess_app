import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PlayAgainstComputerDialogComponent } from '../play-against-computer-dialog/play-against-computer-dialog.component';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrl: './nav-menu.component.css',
  standalone: true,
  imports:[MatToolbarModule, MatButtonModule, MatIconModule, RouterModule, MatDialogModule]
})
export class NavMenuComponent {

  constructor(private dialog: MatDialog) {}
  public playAgainstComputer(): void{
    this.dialog.open(PlayAgainstComputerDialogComponent);
  }
}
