import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ChessBoardComponent } from '../chess-board/chess-board.component';
import { StockfishService } from './stockfish.service';
import { ChessBoardService } from '../chess-board/chess-board.service';
import { tap, Subscription, firstValueFrom } from 'rxjs';
import { Color } from '../../chess-logic/models';

@Component({
  selector: 'app-computer-mode',
  templateUrl: '../chess-board/chess-board.component.html',
  styleUrls: ['../chess-board/chess-board.component.css']
})
export class ComputerModeComponent extends ChessBoardComponent implements OnInit, OnDestroy{
  private computerSubscription$ = new Subscription();

  constructor(private stockfishService: StockfishService) {
    super(inject(ChessBoardService));
  }

  public override ngOnInit(): void {
    super.ngOnInit();
    
    console.log("Computer mode initialized");
    const computerConfiSubscription$: Subscription = this.stockfishService.computerConfiguration$.subscribe({
      next:(computerConfiguration) => {
        if(computerConfiguration.color === Color.White) this.flipBoard();
      }
    });
    const chessBoardStateSubscription$: Subscription = this.chessBoardService.chessBoardState$.subscribe({
      next: async (FEN: string) => {
        if(this.chessBoard.isGameOver) {
          console.log("Game over, no more moves");
          chessBoardStateSubscription$.unsubscribe();
          return;
        }
        const player: Color = FEN.split(" ")[1] === 'w'? Color.White : Color.Black;
        if(player !== this.stockfishService.computerConfiguration$.value.color) return;

        const {prevX, prevY, newX, newY, promotedPiece} = await firstValueFrom(this.stockfishService.getBestMove(FEN));
        console.log(`Computer move: ${prevX},${prevY} to ${newX},${newY} with promotion: ${promotedPiece}`);
        this.updateBoard(prevX, prevY, newX, newY, promotedPiece);
      }
    });

    this.computerSubscription$.add(chessBoardStateSubscription$)
    this.computerSubscription$.add(computerConfiSubscription$)
  }

  public override ngOnDestroy(): void{
    super.ngOnDestroy();
    this.computerSubscription$.unsubscribe();
  }
}
