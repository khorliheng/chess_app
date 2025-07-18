import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StockfishService } from '../computer-mode/stockfish.service';
import { Color } from '../../chess-logic/models';
import { Router } from '@angular/router';


@Component({
  selector: 'app-play-against-computer-dialog',
  templateUrl: './play-against-computer-dialog.component.html',
  styleUrl: './play-against-computer-dialog.component.css',
  standalone: true,
  imports:[MatDialogModule, MatButtonModule, CommonModule]
})
export class PlayAgainstComputerDialogComponent {
  public stockfishLevels: readonly number[] = [1, 2, 3, 4, 5];
  public stockfishLevel: number = 1;

  
  constructor(
    private stockfishService: StockfishService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  public selectStockfishLevel(level: number): void{
    this.stockfishLevel = level;
  }

  public play(color:"w"| "b"): void{
    this.dialog.closeAll();
    this.stockfishService.computerConfiguration$.next({
      color: color === "w" ? Color.Black : Color.White,
      level: this.stockfishLevel
    });
    this.router.navigate(["against-computer"]);
    console.log(`Starting game against computer with level ${this.stockfishLevel} and color ${color}`);
  }

  public closeDialog(): void{
    this.router.navigate(["against-friend"]);
  }
}
