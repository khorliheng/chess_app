import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChessBoard } from '../../chess-logic/chess-board';
import { CheckState, Color, Coords, FENChar, GameHistory, LastMove, MoveList, MoveType, pieceImagePaths, SafeSquares } from '../../chess-logic/models';
import { SelectedSquare } from './model';
import { ChessBoardService } from './chess-board.service';
import { filter, fromEvent, Subscription, tap } from 'rxjs';
import { FENConverter } from '../../chess-logic/FENConverter';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})
export class ChessBoardComponent implements OnInit, OnDestroy {
  public pieceImagePaths = pieceImagePaths;

  protected chessBoard = new ChessBoard;
  public chessBoardView: (FENChar | null)[][] = this.chessBoard.chessBoardView;
  public get playerColor(): Color {return this.chessBoard.playerColor;};
  public get safeSquares(): SafeSquares {return this.chessBoard.safeSquare;}
  public get gameOverMessage(): string | undefined {return this.chessBoard.gameOverMessage;}

  private selectedSquare: SelectedSquare = { piece: null };
  private pieceSafeSquares: Coords[] = [];
  private lastMove: LastMove| undefined = this.chessBoard.lastMove;
  private checkState: CheckState= this.chessBoard.checkState;

  public get moveList(): MoveList{return this.chessBoard.moveList; }
  public get gameHistory(): GameHistory{return this.chessBoard.gameHistory;};
  public gameHistoryPointer: number = 0;

  //promotion properties
  public isPromotionActive: boolean = false;
  public promotionCoords: Coords | null = null;
  private promotedPiece: FENChar | null = null;
  public promotionPieces(): FENChar[]{
    return this.playerColor === Color.White ? 
      [FENChar.WhiteKnight, FENChar.WhiteBishop, FENChar.WhiteRook, FENChar.WhiteQueen] :
      [FENChar.BlackKnight, FENChar.BlackBishop, FENChar.BlackRook, FENChar.BlackQueen];
  }

  public flipMode: boolean = false;

  private subscriptions$ = new Subscription();
  constructor(protected chessBoardService: ChessBoardService) {} 

  public ngOnInit(): void {
    const keyEventSubscription$: Subscription = fromEvent<KeyboardEvent>(document, "keyup")
      .pipe(
        filter(event => event.key === "ArrowRight" || event.key === "ArrowLeft"),
        tap(event => {
          switch (event.key) {
            case "ArrowRight":
              if (this.gameHistoryPointer === this.gameHistory.length - 1) return;
              this.gameHistoryPointer++;
              break;
            case "ArrowLeft":
              if (this.gameHistoryPointer === 0) return;
              this.gameHistoryPointer--;
              break;
            default:
              break;
          }

          this.showPreviousPosition(this.gameHistoryPointer);
        })
      ).subscribe();

    this.subscriptions$.add(keyEventSubscription$);
  }

  public ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
    this.chessBoardService.chessBoardState$.next(FENConverter.initalPosition);
  }

  public flipBoard(): void{
    this.flipMode = !this.flipMode;
  }

  public isSquareDark(x: number, y: number): boolean {
    return ChessBoard.isSquareDark(x, y);
  }

  public isSquareSelected(x: number, y: number): boolean {
    if(!this.selectedSquare.piece) return false;
    return this.selectedSquare.x === x && this.selectedSquare.y === y;
  }

  public isSquareSafeForSelectedPiece(x:number, y:number): boolean{
    return this.pieceSafeSquares.some(coords=> coords.x === x && coords.y === y);
  }

  public isSquareLastMove(x: number, y: number): boolean{
    if(!this.lastMove) return false;
    const{ prevX, prevY, currX, currY} = this.lastMove;
    return x === prevX && y ===  prevY || x === currX && y === currY;
  }

  public isSquareChecked(x:number, y:number): boolean{
    return this.checkState.isInCheck && this.checkState.x === x && this.checkState.y === y;
  }

  public isSquarePromotionSquare(x: number, y: number): boolean {
    if (!this.promotionCoords) return false;
    return this.promotionCoords.x === x && this.promotionCoords.y === y;
  }


  private unmarkingPreviouslySelectedAndSafeSquares(): void {
    this.selectedSquare = { piece: null };
    this.pieceSafeSquares = [];

    if(this.isPromotionActive) {
      this.isPromotionActive = false;
      this.promotionCoords = null;
      this.promotedPiece = null;
    }
  }

  private selectingPiece(x:number, y:number): void{
    if(this.gameOverMessage !== undefined) return;
    const piece: FENChar | null = this.chessBoardView[x][y];
    if (!piece) {
      // console.warn("No piece selected at the given coordinates.");
      return;
    }
    if(this.isWrongPieceSelected(piece)) {
      // console.warn("Selected piece does not belong to the current player.");
      return;
    }

    this.selectedSquare = { piece, x, y };
    this.pieceSafeSquares= this.safeSquares.get(x + "," + y) || [];
  }

  private placingPiece(newX: number, newY: number): void {
    if (!this.selectedSquare.piece) {
      // console.warn("No piece selected to place.");
      return;
    }
    if(!this.isSquareSafeForSelectedPiece(newX, newY)){
      // console.warn("Selected square is not safe for the piece.");
      return;
    }

    const isPawnSelected: boolean = this.selectedSquare.piece === FENChar.WhitePawn || this.selectedSquare.piece === FENChar.BlackPawn;
    const isPawnOnlastRank: boolean = isPawnSelected && (newX === 0 || newX === 7);
    const shouldOpenPromotionDialog: boolean = isPawnOnlastRank && !this.isPromotionActive;

    if(shouldOpenPromotionDialog){
      this.pieceSafeSquares = [];
      this.isPromotionActive = true;
      this.promotionCoords = { x: newX, y: newY };
      return;
    }
    
    const {x: prevX, y: prevY} = this.selectedSquare;
    this.updateBoard(prevX, prevY, newX, newY, this.promotedPiece);
  }

  protected updateBoard(prevX: number, prevY: number, newX: number, newY: number, promotedPiece: FENChar | null): void {
    // console.log(`Moving piece from (${prevX}, ${prevY}) to (${newX}, ${newY}) with promotion: ${promotedPiece}`);
    this.chessBoard.move(prevX, prevY, newX, newY, promotedPiece);
    this.chessBoardView = this.chessBoard.chessBoardView;
    this.checkState = this.chessBoard.checkState;
    this.lastMove = this.chessBoard.lastMove;
    this.markLastMoveAndCheckState(this.chessBoard.lastMove, this.chessBoard.checkState);
    this.unmarkingPreviouslySelectedAndSafeSquares();
    this.chessBoardService.chessBoardState$.next(this.chessBoard.boardAsFEN);
    this.gameHistoryPointer++;
  }

  public promotePiece(piece: FENChar): void {
    if (!this.promotionCoords || !this.selectedSquare.piece) {
      return;
    }
    this.promotedPiece = piece;
    const { x: newX, y: newY } = this.promotionCoords;
    const {x: prevX, y: prevY} = this.selectedSquare;
    this.updateBoard(prevX, prevY, newX, newY, this.promotedPiece);
  }

  public closePromotionDialog(): void {
    this.unmarkingPreviouslySelectedAndSafeSquares();
  }

  public move(x: number, y: number): void {
    this.selectingPiece(x, y);
    this.placingPiece(x, y);
  }

  private markLastMoveAndCheckState(lastMove: LastMove | undefined, checkState: CheckState): void {
    this.lastMove = lastMove;
    this.checkState = checkState;

    if(this.lastMove){
      this.moveSound(this.lastMove.moveType);
    }else{
      this.moveSound(new Set<MoveType>([MoveType.BasicMove]));
    }
  }

  private isWrongPieceSelected(piece:FENChar): boolean{
    const isWhitePieceSelected:boolean = piece === piece.toUpperCase();
    return isWhitePieceSelected && this.playerColor === Color.Black || !isWhitePieceSelected && this.playerColor === Color.White;
  }

  public showPreviousPosition(moveIndex: number): void {
    const {board, checkState, lastMove} = this.gameHistory[moveIndex];
    this.chessBoardView = board;
    this.markLastMoveAndCheckState(lastMove, checkState);
    this.gameHistoryPointer = moveIndex;
  }

  private moveSound(moveType:Set<MoveType>): void{
    const moveSound = new Audio("assets/sounds/move.mp3");

    if(moveType.has(MoveType.Promotion)){
      moveSound.src = "assets/sounds/promote.mp3";
    } else if(moveType.has(MoveType.Castling)){
      moveSound.src = "assets/sounds/castle.mp3";
    } else if(moveType.has(MoveType.Capture)){
      moveSound.src = "assets/sounds/capture.mp3";
    }

    if(moveType.has(MoveType.CheckMate)){
      moveSound.src = "assets/sounds/checkmate.mp3";
    }
    if(moveType.has(MoveType.Check)){
      moveSound.src = "assets/sounds/check.mp3";
    }

    moveSound.play();
  }
}
