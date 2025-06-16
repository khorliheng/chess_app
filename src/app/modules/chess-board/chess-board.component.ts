import { Component } from '@angular/core';
import { ChessBoard } from '../../chess-logic/chess-board';
import { CheckState, Color, Coords, FENChar, LastMove, pieceImagePaths, SafeSquares } from '../../chess-logic/models';
import { SelectedSquare } from './model';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})
export class ChessBoardComponent {
  public pieceImagePaths = pieceImagePaths;

  private chessBoard = new ChessBoard;
  public chessBoardView: (FENChar | null)[][] = this.chessBoard.chessBoardView;
  public get playerColor(): Color {return this.chessBoard.playerColor;};
  public get safeSquares(): SafeSquares {return this.chessBoard.safeSquare;}

  private selectedSquare: SelectedSquare = { piece: null };
  private pieceSafeSquares: Coords[] = [];
  private lastMove: LastMove| undefined = this.chessBoard.lastMove;
  private checkState: CheckState= this.chessBoard.checkState;

  //promotion properties
  public isPromotionActive: boolean = false;
  public promotionCoords: Coords | null = null;
  private promotedPiece: FENChar | null = null;
  public promotionPieces(): FENChar[]{
    return this.playerColor === Color.White ? 
      [FENChar.WhiteKnight, FENChar.WhiteBishop, FENChar.WhiteRook, FENChar.WhiteQueen] :
      [FENChar.BlackKnight, FENChar.BlackBishop, FENChar.BlackRook, FENChar.BlackQueen];
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
    const piece: FENChar | null = this.chessBoardView[x][y];
    if (!piece) {
      console.warn("No piece selected at the given coordinates.");
      return;
    }
    if(this.isWrongPieceSelected(piece)) {
      console.warn("Selected piece does not belong to the current player.");
      return;
    }

    this.selectedSquare = { piece, x, y };
    this.pieceSafeSquares= this.safeSquares.get(x + "," + y) || [];
  }

  private placingPiece(newX: number, newY: number): void {
    if (!this.selectedSquare.piece) {
      console.warn("No piece selected to place.");
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

  private updateBoard(prevX: number, prevY: number, newX: number, newY: number, promotedPiece: FENChar | null): void {
    console.log(`Moving piece from (${prevX}, ${prevY}) to (${newX}, ${newY}) with promotion: ${promotedPiece}`);
    this.chessBoard.move(prevX, prevY, newX, newY, promotedPiece);
    this.chessBoardView = this.chessBoard.chessBoardView;
    this.checkState = this.chessBoard.checkState;
    this.lastMove = this.chessBoard.lastMove;
    this.unmarkingPreviouslySelectedAndSafeSquares();
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

  private isWrongPieceSelected(piece:FENChar): boolean{
    const isWhitePieceSelected:boolean = piece === piece.toUpperCase();
    return isWhitePieceSelected && this.playerColor === Color.Black || !isWhitePieceSelected && this.playerColor === Color.White;
  }
}
