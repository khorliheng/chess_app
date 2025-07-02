import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, switchMap, of } from 'rxjs';
import { ChessMove, StockfishQueryParams, StockfishResponse } from './models';
import { FENChar } from '../../chess-logic/models';

@Injectable({
  providedIn: 'root'
})
export class StockfishService {
  private readonly api: string = 'https://stockfish.online/api/s/v2.php';
  constructor(private http: HttpClient) { }

  private convertColumnLetterToYCoord(string: string): number {
    return string.charCodeAt(0) - 'a'.charCodeAt(0);
  }

  privarepromotedPiece(piece: string | undefined): FENChar|null{
    if(!piece) return null;
    if(piece ==="n") return FENChar.BlackKnight;
    if(piece ==="b") return FENChar.BlackBishop;
    if(piece ==="r") return FENChar.BlackRook;
    return FENChar.BlackQueen;
  }

  private moveFromStockfishString(move:string):ChessMove{
    const prevY: number = this.convertColumnLetterToYCoord(move[0])
    const prevX: number = Number(move[1]) - 1;
    const newY: number = this.convertColumnLetterToYCoord(move[2]);
    const newX: number = Number(move[3]) - 1;
    const promotedPiece = this.privarepromotedPiece(move[4]);
    return {
      prevX,
      prevY,
      newX,
      newY,
      promotedPiece
    };
  }

  public getBestMode(fen: string): Observable<ChessMove> {
    const queryParams: StockfishQueryParams ={
      fen,
      depth: 16,
    };

    let params = new HttpParams().appendAll(queryParams);

    return this.http.get<StockfishResponse>(this.api, {params})
    .pipe(
      switchMap(response =>{
        const bestMove: string = response.data.split(' ')[1];
        return of(this.moveFromStockfishString(bestMove));
      })
    )
  }
}
